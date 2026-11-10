/* Run: node review/checks.cjs. Dependency-free regression checks for curriculum/state/audio. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const path = require('node:path');
process.chdir(path.resolve(__dirname, '..'));
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function context(saved) {
  const elements = new Map();
  const element = () => ({innerHTML:'',style:{},inert:false,focus(){},setAttribute(){},appendChild(){},classList:{add(){},remove(){}}});
  ['#app','#modal-root','#toast-root','.sheet'].forEach(k => elements.set(k,element()));
  const ctx = {console, Date, Math, Set, Map, Object, Array, JSON, URL, Blob, setTimeout(){}, clearTimeout(){},
    localStorage:{getItem:()=>saved ? JSON.stringify(saved) : null,setItem(){}},
    navigator:{userAgent:'Test'}, location:{protocol:'file:'},
    document:{querySelector: s => elements.get(s) || null, querySelectorAll:()=>[],addEventListener(){},documentElement:{removeAttribute(){},setAttribute(){}},activeElement:null},
    matchMedia:()=>({matches:false}),addEventListener(){},scrollTo(){},
    YallaAudio:{stop(){},playLetter(){},play(){},recording(){return 'test.mp3';},voice(){return null;},currentVoice(){return 'bella';},setVoice(k){return k;},voices(){return [{key:'bella',label:'Bella',complete:true,count:1,total:1},{key:'eric',label:'Eric',complete:true,count:1,total:1}];}}
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const file of ['js/version.js','js/data.js','js/learning.js','js/app.js']) {
    let source = fs.readFileSync(file,'utf8');
    if(file==='js/app.js') source = source.replace('  window.__yalla =', '  window.__review = {EX, mixed};\n  window.__yalla =');
    vm.runInContext(source,ctx,{filename:file});
  }
  return ctx;
}
const ctx = context(), app = ctx.__yalla, lessons = app.LESSONS;
test('36 unique lessons, original IDs preserved, explicit difficulty stages', () => {
  assert.equal(lessons.length,36); assert.equal(new Set(lessons.map(l=>l.id)).size,36);
  for (const id of ['ua','ub','u1','u2','u3','u4','u5']) for(let n=1;n<=4;n++) assert(lessons.some(l=>l.id===id+'l'+n));
  assert(lessons.every(l=>['letters','starter','guided','independent'].includes(l.unit.stage)));
});
test('every correct answer and alternative is accepted', () => {
  for (const item of lessons.flatMap(l=>[...l.words,...l.sentences])) for (const answer of [item.en,...item.alt||[]]) assert(app.gradeText(answer,item).ok, answer);
});
test('meaning changes and grammatical errors are not forgiven as typos', () => {
  for (const [input,expected] of [['She is happy','He is happy'],['an cat','a cat'],['tree','three'],['four','your'],['I eat','I eats'],['She drink water','She drinks water'],['from','form'],['I can swim','I cannot swim'],['The man has bag','The man has a bag']]) assert(!app.gradeText(input,{en:expected}).ok, `${input} != ${expected}`);
  assert(app.gradeText('helllo',{en:'hello'}).typo);
  assert(app.gradeText('freind',{en:'friend'}).typo);
  assert(app.gradeText("I'm happy!",{en:'I am happy'}).ok);
});
test('all 36 lesson generators: target coverage, valid options, tile multiplicities, no early typing (100 each)', () => {
  for (const l of lessons) for(let run=0;run<100;run++) {
    const exercises = app.genLesson(l);
    assert(exercises.length >= 10 && exercises.length <= 16);
    for (const w of l.words) assert(exercises.some(e=>e.word===w),l.id+': missing target '+w.en);
    if(l.unit.stage!=='independent') assert(!exercises.some(e=>/^type_|listen_type/.test(e.type)),l.id);
    for(const e of exercises) {
      if(e.options) {
        const item = e.word || e.sentence;
        assert(e.options.some(x=>x.en===item.en));
        assert.equal(new Set(e.options.map(x=>x.en)).size,e.options.length);
        if (e.type !== 'listen_pick' && e.type !== 'first_letter') assert.equal(new Set(e.options.map(x=>x.he)).size,e.options.length);
      }
      if(e.pairs) assert.equal(new Set(e.pairs.map(x=>x.en)).size,e.pairs.length);
      if(e.tiles) {
        const needed = e.type==='spell' ? e.word.en.split('') : e.sentence.en.replace(/[.,!?;:]/g,'').split(/\s+/);
        const tiles = e.tiles.map(x=>x.toLowerCase());
        for(const token of needed) {const i=tiles.indexOf(token.toLowerCase()); assert(i>=0,`${l.id}: ${token}`); tiles.splice(i,1);}
      }
    }
  }
});
test('new material is taught before being tested', () => {
  for(const l of lessons) {
    const introduced = new Set();
    for(const e of app.prepareLesson(l)) {
      if(e.type==='study') {introduced.add((e.word||e.sentence).en);continue;}
      if(e.word) assert(introduced.has(e.word.en));
      if(e.sentence) assert(introduced.has(e.sentence.en));
      for(const w of e.pairs||[]) assert(introduced.has(w.en));
      for(const it of e.items||[]) assert(introduced.has(it.word.en));
    }
  }
});
test('first lessons alternate learning and recall, vary the skill and end with the quick round', () => {
  for(const l of lessons) for(let run=0;run<30;run++) {
    const q = app.prepareLesson(l);
    assert(q.length <= 30, l.id+': too long '+q.length);
    let studyRun = 0;
    for(const e of q) { studyRun = e.type==='study' ? studyRun+1 : 0; assert(studyRun<=2, l.id+': more than two introductions in a row'); }
    q.forEach((e,i) => { if(e.type==='study' && e.word) assert(q.slice(i+1,i+5).some(x=>x.word===e.word), l.id+': '+e.word.en+' is not recalled soon after it is taught'); });
    const last = q[q.length-1];
    assert.equal(last.type,'speed');
    assert(last.items.length>=3 && last.items.every(it => it.truth === (it.shown===it.word) && isFinite(it.word.en.length)));
    assert(last.items.every(it => it.truth || it.shown.he !== it.word.he), 'false item must show a different meaning');
    if(l.type!=='letters') assert(new Set(q.filter(e=>e.type!=='study').map(e=>e.type)).size>=6, l.id+': too little variety');
    for(const e of q.filter(e=>e.type==='listen_image')) {
      assert(e.options.some(o=>o.en===e.word.en));
      assert.equal(new Set(e.options.map(o=>o.emoji)).size,e.options.length);
      assert(!e.options.some(o=>o!==e.word && [['see','sea'],['two','to','too'],['four','for'],['here','hear'],['no','know'],['right','write']].some(g=>g.includes(o.en)&&g.includes(e.word.en))));
    }
  }
});
test('repeated lessons skip introductions; creator mode unlocks and replays as new without touching progress', () => {
  const l = lessons.find(x=>x.id==='u1l1'), later = lessons.find(x=>x.id==='u5l4');
  app.state.completed[l.id]=1;
  const again = app.prepareLesson(l);
  assert(!again.some(e=>e.type==='study')); assert.equal(again[again.length-1].type,'speed');
  assert.equal(app.lessonStatus(later),'locked');
  app.setCreator({on:true,unlockAll:true,fresh:true});
  assert.equal(app.lessonStatus(later),'available');
  assert(app.prepareLesson(l).some(e=>e.type==='study'));
  app.setCreator({on:false});
  assert.equal(app.creator.unlockAll,false); assert.equal(app.creator.fresh,false);
  assert.equal(app.lessonStatus(later),'locked');
  assert(!('creator' in app.cleanState({creator:{on:true}})));
  app.state.completed={};
});
test('placement does not invent completions/XP; earlier lessons stay available', () => {
  const s=app.state;
  for (const level of ctx.LEARNING_LEVELS) {
    s.startLessonId=level.start; s.levelId=level.id;
    const current=lessons.find(l=>l.id===level.start);
    assert.equal(app.currentLessonIndex(),current.order);
    for(const l of lessons.filter(l=>l.order<current.order)) assert.equal(app.lessonStatus(l),'available');
    assert.equal(s.xp,0); assert.equal(Object.keys(s.completed).length,0);
  }
  s.startLessonId='ual1';s.levelId='zero';
});
test('placement uses consecutive gates, not a misleading total score', () => {
  const correct=ctx.PLACEMENT_QUESTIONS.map(q=>q.answer);
  assert.equal(app.placementLevel(correct).id,'strong');
  assert.equal(app.placementLevel(correct.map(()=>null)).id,'zero');
  const gap=correct.slice();gap[4]=null;
  assert.equal(app.placementLevel(gap).id,'some');
});
test('all practice modes at every course boundary are valid and deduplicated', () => {
  for(const l of lessons) {
    app.state.completed[l.id]=1;
    for(const kind of ['weak','write','listen','due']) for(let i=0;i<10;i++) {
      const exercises=app.genPractice(kind); assert(exercises.length);
      for(const e of exercises) {
        assert(e.word||e.sentence||e.pairs||e.items);
        for(const it of e.items||[]) for(const w of [it.word,it.shown]) assert(app.state.completed[w.lessonId],`${w.en} is not learned`);
        if(e.pairs) assert.equal(new Set(e.pairs.map(w=>w.en)).size,e.pairs.length);
        for(const w of e.options||[]) assert(app.state.completed[w.lessonId],`${w.en} is not learned`);
      }
    }
  }
  app.state.completed={};
});
test('letter I is not pronoun I; alphabet is not counted as vocabulary', () => {
  const letter=lessons.find(l=>l.id==='ual2').words.find(w=>w.en==='I');
  const pronoun=lessons.find(l=>l.id==='u1l2').words.find(w=>w.en==='I');
  assert.notEqual(app.wordKey(letter),app.wordKey(pronoun));
  for(const l of lessons.filter(l=>l.type==='letters')) app.state.completed[l.id]=1;
  assert.equal(app.vocabularyCount(),0);app.state.completed={};
});
test('spaced review grows once per day and mistakes return sooner', () => {
  const w=lessons[0].words[0];
  app.recordWord(w,true); const stat=app.state.wordStats[app.wordKey(w)];
  assert.equal(stat.box,1);const due=stat.due;
  app.recordWord(w,true);assert.equal(stat.box,1);assert.equal(stat.due,due);
  app.recordWord(w,false);assert.equal(stat.box,0);assert(stat.due < due);
});
test('old saves load and damaged nested values are sanitized', () => {
  const old=context({welcomed:true,xp:50,completed:{ual1:2},settings:{unlimitedHearts:false}}).__yalla.state;
  assert.equal(old.xp,50);assert.equal(old.completed.ual1,2);assert.equal(old.settings.unlimitedHearts,false);
  const bad=app.cleanState({daily:null,completed:null,wordStats:[],settings:{dailyGoal:0,theme:'<bad>'},hearts:-10,xp:'bad'});
  assert.equal(bad.xp,0);assert.equal(bad.daily.xp,0);assert.equal(bad.settings.dailyGoal,20);
  assert.equal(bad.settings.theme,'auto'); assert.equal(bad.hearts,5);
});
test('all 26 immutable audio mappings match valid distinct WAVs and explicit phonemes', () => {
  const manifest=JSON.parse(fs.readFileSync('audio/letters/manifest.json','utf8').replace(/^\uFEFF/,''));
  assert.equal(manifest.letters.length,26);
  const hashes=new Set();
  for(const letter of manifest.letters) {
    const bytes=fs.readFileSync('audio/letters/'+letter.file);
    assert.equal(letter.file,letter.letter+'.wav');
    assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');
    assert(bytes.length>5000);const hash=crypto.createHash('sha256').update(bytes).digest('hex');
    assert.equal(hash,letter.sha256);hashes.add(hash);
  }
  assert.equal(hashes.size,26);
  const phones=Object.fromEntries(manifest.letters.map(l=>[l.letter,l.ipa]));
  assert.equal(phones.A,'eɪ');assert.equal(phones.E,'iː');assert.equal(phones.F,'ɛf');assert.equal(phones.I,'aɪ');
});
test('audio engine plays the selected voice, stops the previous clip and never crosses voices', () => {
  const played=[];
  class Audio {constructor(src){this.src=src;played.push(this);} play(){return Promise.resolve();}pause(){this.paused=true;}}
  const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const files={bella:Object.fromEntries(letters.map(l=>[l,'audio/voices/bella/'+l+'.mp3']).concat([['hello','audio/voices/bella/hello.mp3']])),
    eric:Object.fromEntries(letters.filter(l=>l!=='Q').map(l=>[l,'audio/voices/eric/'+l+'.mp3']))};
  const utter=[];
  const audioCtx={Audio,SpeechSynthesisUtterance:class{constructor(t){this.text=t;}},speechSynthesis:{getVoices:()=>[{name:'T',lang:'en-US'}],cancel(){},speak(u){utter.push(u);}}};
  audioCtx.window=audioCtx;audioCtx.YALLA_VOICES={default:'bella',voices:[{key:'bella'},{key:'eric'}],files};
  vm.createContext(audioCtx);vm.runInContext(fs.readFileSync('js/audio.js','utf8'),audioCtx);
  const A=audioCtx.window.YallaAudio;
  assert.equal(A.currentVoice(),'bella');
  for(const letter of letters) {A.playLetter(letter,false);assert.equal(played.at(-1).src,'audio/voices/bella/'+letter+'.mp3');}
  assert(played.slice(0,-1).every(a=>a.paused));
  A.stop();assert(played.at(-1).paused);
  assert.equal(A.playLetter('unknown',false),false);
  assert.equal(A.setVoice('nobody'),'bella');
  assert.equal(A.setVoice('eric'),'eric');
  assert(played.at(-1).paused,'switching voice stops playback');
  assert.equal(A.recording('Q'),null,'missing item in eric must not borrow bella');
  let kinds=[];assert.equal(A.play('Q',{allowDeviceVoice:true,onError:k=>kinds.push(k)}),false);assert.deepEqual(kinds,['missing-recording']);assert.equal(utter.length,0,'letters never use device TTS');
  assert.equal(A.play('hello',{onError:k=>kinds.push(k)}),false);assert.equal(kinds.at(-1),'missing-recording');
  assert(A.play('hello',{voice:'bella'}));assert.equal(played.at(-1).src,'audio/voices/bella/hello.mp3');assert.equal(A.currentVoice(),'eric','preview does not change the selection');
  let errors=0;
  A.playLetter('A',false,()=>errors++);const previous=played.at(-1);
  A.playLetter('E',false,()=>errors++);previous.onerror();assert.equal(errors,0);
  played.at(-1).onerror();played.at(-1).onerror();assert.equal(errors,1);
});
test('listening requires the words heard; translation accepts defined synonyms', () => {
  const ex={sentence:{en:'The check, please',he:'חשבון, בבקשה',alt:['The bill, please']}};
  assert(!ctx.__review.EX.listen_type.grade(ex,'The bill, please').ok);
  assert(!ctx.__review.EX.listen_build.grade(ex,'The bill please').ok);
  assert(ctx.__review.EX.type_sentence.grade(ex,'The bill please').ok);
  assert(ctx.__review.EX.listen_type.grade(ex,'The check please').ok);
});
test('mixed Hebrew/English keeps apostrophes and punctuation inside isolation while escaping HTML', () => {
  assert(ctx.__review.mixed("מה זה I'm?").includes('<bdi dir="ltr">I&#39;m?</bdi>'));
  assert(!ctx.__review.mixed('<script>bad</script>').includes('<script>'));
});
test('service worker only removes its own caches and never substitutes HTML for audio', () => {
  const source=fs.readFileSync('sw.js','utf8');
  assert(source.includes("k.startsWith('yalla-english-')"));
  assert(source.includes("e.request.mode === 'navigate'"));
  const worker={self:{addEventListener(){}},URL};vm.createContext(worker);
  vm.runInContext(source+'\nglobalThis.files = FILES;',worker);
  for(const file of worker.files) if(file!=='./') assert(fs.existsSync(file),file);
  const voiceMap={};const vctx={window:voiceMap};vm.createContext(vctx);vm.runInContext(fs.readFileSync('js/voice-audio.js','utf8'),vctx);
  const expected=new Set(Object.values(vctx.window.YALLA_VOICES.files).flatMap(m=>Object.values(m)).map(f=>'./'+f));
  for(const f of expected) assert(worker.files.includes(f),'voice audio must be cached offline: '+f);
  assert(!worker.files.some(f=>f.startsWith('./audio/human/') || f.startsWith('./audio/letters/')),'retired recordings are not precached');
});
console.log(`\n${passed} groups passed; ${lessons.length * 100} generated lessons checked.`);
