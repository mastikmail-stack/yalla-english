/* Behavioral playback tests. These DO NOT certify audible pronunciation. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
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
for(const file of ['js/version.js','js/data.js','js/learning.js','js/human-audio.js','js/audio.js','js/audio-catalog.js']) vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const {YallaAudio:audio,YALLA_AUDIO_CATALOG:catalog}=ctx;
assert.equal(catalog.filter(x=>x.type==='letter').length,26);
assert.equal(new Set(catalog.map(x=>x.id)).size,catalog.length);
for(const unit of ctx.COURSE.units) for(const lesson of unit.lessons) {
  for(const word of lesson.words) {
    assert(catalog.some(x=>x.text===word.en && x.lessons.some(l=>l.id===lesson.id)));
    if(word.ex) assert(catalog.some(x=>x.text===word.ex && x.type==='word'));
  }
  for(const sentence of lesson.sentences) assert(catalog.some(x=>x.text===sentence.en && x.type==='sentence' && x.lessons.some(l=>l.id===lesson.id)));
}
for(const item of catalog) for(const slow of [false,true]) {
  const file=audio.recording(item.text);
  if(file) {
    assert(audio.play(item.text,{slow}));
    assert.equal(clips.at(-1).src,file);
    assert.equal(clips.at(-1).playbackRate,slow?0.75:1);
    assert(fs.existsSync(file));
  } else {
    assert.equal(audio.play(item.text,{slow,onError:kind=>assert.equal(kind,'missing-recording')}),false);
    assert(audio.play(item.text,{slow,allowDeviceVoice:true}));
    const spoken=utterances.at(-1);
    assert.equal(spoken.text,item.text); assert.equal(spoken.voice.lang,'en-US'); assert.equal(spoken.rate,slow?0.55:0.9);
  }
}
let ends=0, errors=0;
audio.play('A',{onEnd:()=>ends++,onError:()=>errors++}); const old=clips.at(-1);
audio.play('E',{onEnd:()=>ends++});old.onended();old.onerror();assert.equal(ends,0);assert.equal(errors,0);assert(old.paused);
audio.play('unrecorded test phrase',{allowDeviceVoice:true,onEnd:()=>ends++,onError:()=>errors++});const oldSpeech=utterances.at(-1);
audio.play('F');oldSpeech.onend();oldSpeech.onerror({error:'network'});assert.equal(ends,0);assert.equal(errors,0);
const count=utterances.length;
audio.play('I',{onError:()=>errors++});clips.at(-1).onerror();clips.at(-1).onerror();assert.equal(errors,1);assert.equal(utterances.length,count,'Failed letter must never fall back to TTS');
voices=[{name:'Hebrew',lang:'he-IL'}];assert.equal(audio.play('unrecorded test phrase',{allowDeviceVoice:true,onError:kind=>assert.equal(kind,'voice')}),false);assert.equal(utterances.length,count);
assert.equal(audio.play('A'),true,'Recorded letters work without a TTS voice');
assert(cancels>catalog.length);
assert(!fs.readFileSync('js/app.js','utf8').includes('new SpeechSynthesisUtterance'),'No bypass of the shared engine');
const release=JSON.parse(fs.readFileSync('version.json','utf8'));
assert.equal(ctx.YALLA_BUILD.version,release.version);
assert(fs.readFileSync('sw.js','utf8').includes("'yalla-english-"+release.version+"'"));
const crypto=require('node:crypto');
const recordings=Object.values(JSON.parse(fs.readFileSync('audio/human/manifest.json','utf8')).recordings);
for(const item of recordings) {
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(item.file)).digest('hex'),item.sha256);
  assert(item.source && item.author && item.license && item.licenseUrl && item.changes);
  assert(fs.readFileSync('sw.js','utf8').includes('./'+item.file),'Audio must be cached offline');
}
for(const letter of JSON.parse(fs.readFileSync('audio/letters/manifest.json','utf8')).letters)assert.equal(letter.recording,'human');
const inventory=JSON.parse(fs.readFileSync('audio/production/utterances.json','utf8')).items;
assert.equal(inventory.length,catalog.length);
assert.equal(new Set(inventory.map(x=>x.assetId)).size,inventory.length);
for(const item of catalog) assert(inventory.some(x=>x.id===item.id && x.expectedSpokenText===item.text));
console.log(`PASS all ${catalog.length} curriculum audio items in both speeds; human recordings, missing audio, explicit TTS opt-in, cancellation, stale events, English-only voice, provenance/hashes, offline inclusion and release coherence`);
