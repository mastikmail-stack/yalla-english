/* Behavioral playback tests for both ElevenLabs voices. These DO NOT certify audible pronunciation:
   a valid, hashed MP3 that plays is not proof that the right word is heard. Human listening
   (audio-review.html, per voice) is still required.
   Publication requires every voice to be complete; set ALLOW_INCOMPLETE_VOICES=1 only for local work. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const crypto = require('node:crypto');
process.chdir(path.resolve(__dirname,'..'));
const clips=[], utterances=[];
let voices=[{name:'Hebrew',lang:'he-IL'},{name:'English test',lang:'en-US'}], cancels=0;
class Audio {
  constructor(src) { this.src=src;clips.push(this); }
  play() { return Promise.resolve(); }
  pause() { this.paused=true; }
}
const ctx={Audio,console,window:null,SpeechSynthesisUtterance:class {constructor(text){this.text=text;}},
  speechSynthesis:{getVoices:()=>voices,cancel(){cancels++;},speak(u){utterances.push(u);}}};
ctx.window=ctx;vm.createContext(ctx);
for(const file of ['js/version.js','js/data.js','js/learning.js','js/voice-audio.js','js/audio.js','js/audio-catalog.js']) vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const {YallaAudio:audio,YALLA_AUDIO_CATALOG:catalog,YALLA_VOICES:runtime}=ctx;

// Catalog covers every lesson item.
assert.equal(catalog.filter(x=>x.type==='letter').length,26);
assert.equal(new Set(catalog.map(x=>x.id)).size,catalog.length);
for(const unit of ctx.COURSE.units) for(const lesson of unit.lessons) {
  for(const word of lesson.words) {
    assert(catalog.some(x=>x.text===word.en && x.lessons.some(l=>l.id===lesson.id)));
    if(word.ex) assert(catalog.some(x=>x.text===word.ex && x.type==='word'));
  }
  for(const sentence of lesson.sentences) assert(catalog.some(x=>x.text===sentence.en && x.type==='sentence' && x.lessons.some(l=>l.id===lesson.id)));
}
const inventory=JSON.parse(fs.readFileSync('audio/production/utterances.json','utf8')).items;
assert.equal(inventory.length,catalog.length);
assert.equal(new Set(inventory.map(x=>x.assetId)).size,inventory.length);
for(const item of catalog) assert(inventory.some(x=>x.id===item.id && x.expectedSpokenText===item.text),'recording brief matches course: '+item.id);

const config=JSON.parse(fs.readFileSync('review/voices.config.json','utf8'));
assert.equal(JSON.stringify(runtime.voices.map(v=>v.key)),JSON.stringify(config.map(v=>v.key)),'runtime voice list is generated from the config');
assert.equal(runtime.voices.length,2);
const sw=fs.readFileSync('sw.js','utf8');
const allowIncomplete=process.env.ALLOW_INCOMPLETE_VOICES==='1';
const isMp3=buf=>buf.length>1500 && (buf.slice(0,3).toString('latin1')==='ID3' || (buf[0]===0xff && (buf[1]&0xe0)===0xe0));
const summary=[];
for(const voice of config) {
  const manifestFile=`audio/voices/${voice.key}/manifest.json`;
  const manifest=fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile,'utf8')) : {items:{}};
  if(fs.existsSync(manifestFile)) { assert.equal(manifest.voiceId,voice.voiceId); assert.equal(manifest.provider,'ElevenLabs'); }
  audio.setVoice(voice.key); assert.equal(audio.currentVoice(),voice.key);
  let present=0;
  for(const item of inventory) {
    const entry=manifest.items[item.id];
    if(!entry) continue;
    present++;
    const buf=fs.readFileSync(entry.file);
    assert(isMp3(buf),'not an MP3: '+entry.file);
    assert.equal(crypto.createHash('sha256').update(buf).digest('hex'),entry.sha256,'hash '+entry.file);
    assert.equal(entry.voiceId,voice.voiceId); assert(entry.modelId && entry.generated && entry.text===item.text && entry.assetId===item.assetId);
    assert(entry.file.startsWith(`audio/voices/${voice.key}/`),'file belongs to its own voice');
    assert(sw.includes('"./'+entry.file+'"'),'cached offline: '+entry.file);
  }
  const v=runtime.voices.find(x=>x.key===voice.key);
  assert.equal(v.count,present); assert.equal(v.complete,present===inventory.length);
  if(!allowIncomplete) assert(v.complete,`voice ${voice.key} is incomplete (${present}/${inventory.length}); it must not be published as ready`);
  // Playback of every catalog item in both speeds, through the shared engine.
  for(const item of catalog) for(const slow of [false,true]) {
    const file=audio.recording(item.text);
    if(file) {
      assert(file.startsWith(`audio/voices/${voice.key}/`),'no cross-voice fallback');
      assert(audio.play(item.text,{slow}));
      assert.equal(clips.at(-1).src,file); assert.equal(clips.at(-1).playbackRate,slow?0.75:1);
    } else {
      const before=utterances.length;
      assert.equal(audio.play(item.text,{slow,onError:kind=>assert.equal(kind,'missing-recording')}),false);
      assert.equal(utterances.length,before,'missing recordings never fall back silently');
      if(/^[A-Z]$/.test(item.text)) assert.equal(audio.play(item.text,{slow,allowDeviceVoice:true}),false,'letter names (and pronoun I) never use device TTS');
      else { assert(audio.play(item.text,{slow,allowDeviceVoice:true})); const spoken=utterances.at(-1); assert.equal(spoken.text,item.text); assert.equal(spoken.voice.lang,'en-US'); assert.equal(spoken.rate,slow?0.55:0.9); }
    }
  }
  summary.push(`${voice.key} ${present}/${inventory.length}`);
}

// Stale events and cancellation (uses whichever recording exists; falls back to device voice path otherwise).
let ends=0, errors=0;
audio.play('unrecorded test phrase',{allowDeviceVoice:true,onEnd:()=>ends++,onError:()=>errors++});const oldSpeech=utterances.at(-1);
audio.play('another unrecorded phrase',{allowDeviceVoice:true});oldSpeech.onend();oldSpeech.onerror({error:'network'});assert.equal(ends,0);assert.equal(errors,0);
voices=[{name:'Hebrew',lang:'he-IL'}];const count=utterances.length;
assert.equal(audio.play('unrecorded test phrase',{allowDeviceVoice:true,onError:kind=>assert.equal(kind,'voice')}),false);assert.equal(utterances.length,count);
assert(cancels>catalog.length);
assert(!fs.readFileSync('js/app.js','utf8').includes('new SpeechSynthesisUtterance'),'No bypass of the shared engine');

// Release coherence.
const release=JSON.parse(fs.readFileSync('version.json','utf8'));
assert.equal(ctx.YALLA_BUILD.version,release.version);
assert(sw.includes("'yalla-english-"+release.version+"'"));

// Earlier human recordings stay documented (provenance) even though playback no longer uses them.
const recordings=Object.values(JSON.parse(fs.readFileSync('audio/human/manifest.json','utf8')).recordings);
for(const item of recordings) {
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(item.file)).digest('hex'),item.sha256);
  assert(item.source && item.author && item.license && item.licenseUrl && item.changes);
}
console.log(`PASS ${catalog.length} curriculum audio items x 2 speeds per voice (${summary.join(', ')}); MP3 validity, hashes, offline inclusion, no cross-voice or silent TTS fallback, cancellation, stale events, release coherence. Not a pronunciation check.`);
