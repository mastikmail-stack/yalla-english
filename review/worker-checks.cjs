/* Behavioral checks of offline routing and cache ownership, using real Request URLs. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const handlers = {}, deleted = [], entries = new Map();
const base = 'https://example.test/english/';
const key = request => new URL(typeof request === 'string' ? request : request.url,base).pathname;
const cache = {
  async addAll(files) { for(const request of files) {
    assert.equal(request.cache,'reload','Installing an update must bypass stale browser HTTP-cache assets');
    const file='./'+new URL(request.url).pathname.slice('/english/'.length);
    entries.set(key(request),file);
  } },
  async match(request) { const file=entries.get(key(request)); return file ? new Response(file,{headers:{'Content-Type':file.endsWith('.wav')?'audio/wav':file.endsWith('.mp3')?'audio/mpeg':'text/html'}}) : undefined; }
};
const worker = {
  URL, Response, Request,
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
  const voiceFiles=[...entries.values()].filter(f=>f.startsWith('./audio/voices/'));
  for(const file of voiceFiles) {
    const response=await request(file.slice(2));
    assert.equal(response.headers.get('content-type'),'audio/mpeg');
    assert.equal(await response.text(),file);
  }
  assert.equal(await (await request('unknown-route','navigate')).text(),'./index.html');
  assert.equal(await request('audio/voices/bella/MISSING.mp3'),null,'unknown media is not answered with HTML');
  // A listed recording that is missing from the cache while offline fails instead of becoming HTML.
  const probe='./js/voice-audio.js';
  entries.delete('/english/'+probe.slice(2));
  assert.equal((await request(probe.slice(2))).type,'error');
  assert.equal(await request('https://other.test/private.js'),null);
  for(const file of entries.values()) if(file.endsWith('.mp3')) assert.equal((await request(file)).headers.get('content-type'),'audio/mpeg');
  console.log(`PASS offline app shell and both voices' audio (${voiceFiles.length} files), explicit update activation, navigation fallback, missing media, foreign origins, unrelated caches`);
})().catch(error=>{console.error(error);process.exitCode=1;});
