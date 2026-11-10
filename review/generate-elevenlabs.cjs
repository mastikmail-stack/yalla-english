/*
 * Produce the app's narration with ElevenLabs, one MP3 per catalog item per voice.
 *
 *   node review/generate-elevenlabs.cjs [--voice bella|eric|all] [--only letter|word|sentence] [--ids id1,id2] [--force] [--dry-run]
 *
 * The API key is read from the ELEVENLABS_API_KEY environment variable and is never
 * written anywhere. Output: audio/voices/<voice>/<assetId>.mp3 + manifest.json.
 * Resumable: an item whose file exists and matches the manifest hash is skipped, so an
 * interrupted run does not pay twice. --force regenerates the selected items.
 *
 * A successful run proves only that a valid MP3 was returned. It is NOT a check that
 * the pronunciation is right; that needs a person listening (audio-review.html).
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const VOICES = require('./voices.config.json');
const OUTPUT_FORMAT = 'mp3_44100_64';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : fallback; };
const flag = name => args.includes('--' + name);
const voiceArg = opt('voice', 'all');
const only = opt('only', null);
const ids = opt('ids', null)?.split(',').map(s => s.trim()).filter(Boolean);
const force = flag('force');
const dryRun = flag('dry-run');
const concurrency = Number(opt('concurrency', 3));

const key = process.env.ELEVENLABS_API_KEY;
if (!key && !dryRun) { console.error('ELEVENLABS_API_KEY is not set.'); process.exit(2); }

const catalog = JSON.parse(fs.readFileSync(path.join(root, 'audio/production/utterances.json'), 'utf8')).items;
let items = catalog;
if (only) items = items.filter(x => x.type === only);
if (ids) items = items.filter(x => ids.includes(x.id));

/* Text actually sent. A lone letter gets a full stop so it is read as a letter name
   ("A." -> /eɪ/) and not as the article "a"; nothing else is added (no "The letter").
   Some letters were misread on their own in human listening (2026-11-10, Bella): G/H as a
   sound, I as the Roman numeral "one", W wrong, Y as "i". For those, the model gets an English
   word whose pronunciation IS the letter name. The result still needs human listening. */
const LETTER_SPELLING = { G: 'Gee.', H: 'Aitch.', I: 'Eye.', W: 'Double-you.', Y: 'Why.' };
function spokenText(item) {
  const t = item.expectedSpokenText;
  if (item.type === 'letter') return LETTER_SPELLING[t] || t + '.';
  return t;
}
/* Per-voice overrides (voices.config.json -> overrides[letter]) record takes chosen by ear,
   e.g. G in multilingual v2. They win over the defaults so a re-run keeps the chosen take. */
function planFor(voice, item) {
  const o = (item.type === 'letter' && voice.overrides?.[item.expectedSpokenText]) || {};
  return { text: o.text || spokenText(item), modelId: o.modelId || voice.modelId, settings: o.settings || voice.settings, seed: o.seed ?? voice.seed };
}

const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');
function looksLikeMp3(buf) {
  if (buf.length < 1500) return false;
  if (buf.slice(0, 3).toString('latin1') === 'ID3') return true;
  return buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;
}

async function synthesize(voice, item) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice.voiceId}?output_format=${OUTPUT_FORMAT}`;
  const p = planFor(voice, item);
  const body = { text: p.text, model_id: p.modelId, voice_settings: p.settings, seed: p.seed };
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, { method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' }, body: JSON.stringify(body) });
    if (res.ok) {
      const type = res.headers.get('content-type') || '';
      const buf = Buffer.from(await res.arrayBuffer());
      if (!/audio\/mpeg/.test(type) || !looksLikeMp3(buf)) throw new Error(`${item.id}: response is not an MP3 (${type}, ${buf.length} bytes)`);
      return { buf, requestId: res.headers.get('request-id') || null, characterCost: Number(res.headers.get('character-cost')) || null };
    }
    const detail = (await res.text()).slice(0, 300);
    if (res.status === 429 || res.status >= 500) { await new Promise(r => setTimeout(r, 1500 * attempt)); continue; }
    throw new Error(`${item.id}: HTTP ${res.status} ${detail}`);
  }
  throw new Error(`${item.id}: gave up after retries`);
}

function loadManifest(voice) {
  const file = path.join(root, 'audio/voices', voice.key, 'manifest.json');
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

async function runVoice(voice) {
  const dir = path.join(root, 'audio/voices', voice.key);
  fs.mkdirSync(dir, { recursive: true });
  const manifest = loadManifest(voice) || { schemaVersion: 1, items: {} };
  Object.assign(manifest, {
    voiceKey: voice.key, label: voice.label, voiceId: voice.voiceId, voiceName: voice.voiceName, voiceCategory: voice.category,
    provider: 'ElevenLabs', modelId: voice.modelId, outputFormat: OUTPUT_FORMAT, settings: voice.settings, seed: voice.seed,
    note: 'Generated audio. A valid file is not a pronunciation check; review results live in audio-review.html per voice and build.'
  });
  const todo = items.filter(item => {
    if (force) return true;
    const entry = manifest.items[item.id];
    const file = entry && path.join(root, entry.file);
    return !(entry && fs.existsSync(file) && sha256(fs.readFileSync(file)) === entry.sha256 && entry.spokenText === planFor(voice, item).text && entry.modelId === planFor(voice, item).modelId);
  });
  const chars = todo.reduce((n, x) => n + planFor(voice, x).text.length, 0);
  console.log(`${voice.key}: ${todo.length}/${items.length} to generate, ~${chars} characters`);
  if (dryRun || !todo.length) return { voice: voice.key, generated: 0, chars };
  let next = 0, done = 0, failed = [];
  const save = () => fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
  async function worker() {
    while (next < todo.length) {
      const item = todo[next++];
      try {
        const { buf, requestId, characterCost } = await synthesize(voice, item);
        // The content hash is part of the name: a replaced take gets a new URL (no stale caches)
        // and earlier review marks for the old take no longer apply.
        const hash = sha256(buf);
        const rel = `audio/voices/${voice.key}/${item.assetId}-${hash.slice(0, 8)}.mp3`;
        const old = manifest.items[item.id]?.file;
        fs.writeFileSync(path.join(root, rel), buf);
        if (old && old !== rel && fs.existsSync(path.join(root, old))) fs.unlinkSync(path.join(root, old));
        manifest.items[item.id] = {
          assetId: item.assetId, type: item.type, text: item.text, spokenText: planFor(voice, item).text, file: rel,
          sha256: sha256(buf), bytes: buf.length, approxSeconds: Math.round(buf.length * 8 / 64000 * 100) / 100,
          voiceId: voice.voiceId, modelId: planFor(voice, item).modelId, settings: planFor(voice, item).settings, seed: planFor(voice, item).seed, outputFormat: OUTPUT_FORMAT, requestId, characterCost,
          generated: new Date().toISOString(), qa: 'not-reviewed'
        };
        done++;
        if (done % 25 === 0) { save(); console.log(`  ${voice.key}: ${done}/${todo.length}`); }
      } catch (e) { failed.push(item.id); console.error('  FAIL', e.message); }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  manifest.complete = catalog.every(item => manifest.items[item.id] && fs.existsSync(path.join(root, manifest.items[item.id].file)));
  manifest.updated = new Date().toISOString();
  save();
  console.log(`${voice.key}: generated ${done}, failed ${failed.length}${failed.length ? ' -> ' + failed.join(', ') : ''}; complete=${manifest.complete}`);
  return { voice: voice.key, generated: done, failed, chars };
}

(async () => {
  const chosen = VOICES.filter(v => voiceArg === 'all' || v.key === voiceArg);
  if (!chosen.length) { console.error('Unknown voice', voiceArg); process.exit(2); }
  const results = [];
  for (const voice of chosen) results.push(await runVoice(voice));
  if (!dryRun) require('./build-voice-map.cjs');
  if (results.some(r => r.failed?.length)) process.exitCode = 1;
})().catch(e => { console.error(e.message); process.exitCode = 1; });
