/* Behavioral checks of offline routing and cache ownership, using real Request URLs. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const handlers = {}, deleted = [], entries = new Map();
const base = 'https://example.test/english/';
const key = request => new URL(typeof request === 'string' ? request : request.url,base).pathname;
const cache = {
  async addAll(files) { for(const file of files) entries.set(key(file),file); },
  async match(request) { const file=entries.get(key(request)); return file ? new Response(file,{headers:{'Content-Type':file.endsWith('.wav')?'audio/wav':file.endsWith('.mp3')?'audio/mpeg':'text/html'}}) : undefined; }
};
const worker = {
  URL, Response,
  self:{location:{origin:'https://example.test'},registration:{scope:base},clients:{async claim(){}},skipWaiting(){worker.activated=true;},addEventListener(name,fn){handlers[name]=fn;}},
  caches:{async open(){return cache;},async keys(){return ['unrelated-app','yalla-english-v1',worker.cacheVersion];},async delete(k){deleted.push(k);}},
  async fetch(){throw new Error('Offline');}
};
vm.createContext(worker);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../sw.js'),'utf8')+'\nglobalThis.cacheVersion = CACHE;',worker);
async function event(name) {let done;handlers[name]({waitUntil(p){done=p;}});await done;}
async function request(path,mode='same-origin') {let result;handlers.fetch({request:{url:new URL(path,base).href,method:'GET',mode},respondWith(p){result=p;}});return result ? await result : null;}
(async()=>{
  await event('install');await event('activate');
  assert(!worker.activated,'An update must not interrupt a lesson automatically');
  handlers.message({data:{type:'ACTIVATE_UPDATE'}});assert(worker.activated);
  assert.deepEqual(deleted,['yalla-english-v1']);
  assert.equal(await (await request('index.html')).text(),'./index.html');
  assert.equal(await (await request('js/learning.js')).text(),'./js/learning.js');
  for(const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    const response=await request(`audio/letters/${letter}.wav`);
    assert.equal(response.headers.get('content-type'),'audio/wav');
    assert.equal(await response.text(),`./audio/letters/${letter}.wav`);
  }
  assert.equal(await (await request('unknown-route','navigate')).text(),'./index.html');
  assert.equal(await request('audio/letters/MISSING.wav'),null);
  entries.delete('/english/audio/letters/A.wav');
  assert.equal((await request('audio/letters/A.wav')).type,'error');
  assert.equal(await request('https://other.test/private.js'),null);
  for(const file of entries.values()) if(file.endsWith('.mp3')) assert.equal((await request(file)).headers.get('content-type'),'audio/mpeg');
  console.log('PASS offline app shell and human audio, explicit update activation, navigation fallback, missing media, foreign origins, unrelated caches');
})().catch(error=>{console.error(error);process.exitCode=1;});
