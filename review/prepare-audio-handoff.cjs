/* Rebuild manifests, attribution and an exact recording brief from current data. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
process.chdir(root);
const ctx={window:null};ctx.window=ctx;vm.createContext(ctx);
for(const file of ['js/data.js','js/learning.js','js/audio-catalog.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
const letters=JSON.parse(fs.readFileSync('audio/letters/manifest.json','utf8'));
const human=JSON.parse(fs.readFileSync('audio/human/manifest.json','utf8'));
const normalized=text=>text.trim().toLowerCase().replace(/[.!?,]+$/g,'');
const map={};
for(const [text,item] of Object.entries(human.recordings))map[normalized(text)]={file:item.file,kind:'human',author:item.author};
fs.writeFileSync('js/human-audio.js','window.YALLA_HUMAN_AUDIO = Object.freeze('+JSON.stringify(map,null,2)+');\n');
const worker=fs.readFileSync('sw.js','utf8');
const assets=[...new Set(Object.values(human.recordings).map(x=>'./'+x.file))].sort();
fs.writeFileSync('sw.js',worker.replace(/  \/\/ BEGIN HUMAN AUDIO[\s\S]*?  \/\/ END HUMAN AUDIO/,'  // BEGIN HUMAN AUDIO\n'+assets.map(x=>'  '+JSON.stringify(x)+',').join('\n')+'\n  // END HUMAN AUDIO'));
const escape=text=>String(text||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rows=[...letters.letters.map(item=>({...item,text:item.letter,file:'audio/letters/'+item.file})),...Object.values(human.recordings)];
fs.writeFileSync('audio-credits.html',`<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>מקורות ההקלטות · יאללה אינגליש</title><link rel="stylesheet" href="css/style.css"><link rel="stylesheet" href="css/learning.css"><main class="audio-review"><a href="./">חזרה ללימוד</a><h1>מקורות ההקלטות</h1><p><b>הקריינות באפליקציה כיום:</b> כל האותיות, המילים והמשפטים הופקו ב־ElevenLabs בשני קולות מובנים של השירות: Bella (נשי) ו־Eric (גברי), במודל eleven_v4. האות G בשני הקולות הופקה במודל eleven_multilingual_v2, אחרי בחירה באוזן מבין כמה גרסאות. פרטי כל קובץ (טקסט, מודל, תאריך וחתימה) נמצאים ב־<span dir="ltr">audio/voices/&lt;voice&gt;/manifest.json</span>. קובץ תקין אינו אישור שההגייה נכונה; הבדיקה נעשית בהאזנה בדף בדיקת השמע.</p><h2>הקלטות קודמות (אינן מושמעות עוד)</h2><p>הקלטות אנושיות ממקורות פתוחים. כל קובץ נשאר תחת הרישיון הרשום לידו. הקבצים הומרו לפורמט מתאים ועוצמתם אוזנה. קטעי האלפבית חולצו מתוך הקלטה רציפה. הקלטות שעברו התאמה תחת CC BY-SA מופצות תחת אותה גרסת הרישיון. היוצרים אינם נותני חסות לאפליקציה.</p><p>הן נשמרות כאן עם המקור, היוצר והרישיון שלהן, כפי שהיו בגרסאות הקודמות.</p>${rows.map(item=>`<section class="card"><h2 dir="ltr">${escape(item.text)}</h2><p dir="ltr">${escape(item.author)}</p><p><a href="${escape(item.source)}" rel="noopener">מקור ההקלטה</a> · <a href="${escape(item.licenseUrl)}" rel="noopener">${escape(item.license)}</a></p><p dir="ltr" class="study-hint">${escape(item.changes)}</p></section>`).join('')}</main></html>`);
const inventory=ctx.YALLA_AUDIO_CATALOG.map(item=>{
  const letter=letters.letters.find(x=>item.type==='letter'&&x.letter===item.text);
  return {...item,assetId:crypto.createHash('sha256').update(item.id).digest('hex').slice(0,20),expectedIPA:letter?.ipa||null,expectedSpokenText:item.text,notes:letter?'Speak the English letter NAME only. No example word, Hebrew, prefix or alternate letter name.':'Speak the complete text naturally; never stitch isolated-word recordings.',currentFile:/^[A-Z]$/.test(item.text)?'audio/letters/'+item.text+'.wav':map[normalized(item.text)]?.file||null};
});
fs.mkdirSync('audio/production',{recursive:true});
fs.writeFileSync('audio/production/utterances.json',JSON.stringify({schemaVersion:1,language:'en-US',voiceCountRequested:2,items:inventory},null,2));
const missing=inventory.filter(x=>!x.currentFile);
fs.writeFileSync('audio/production/missing-recordings.json',JSON.stringify(missing,null,2));
console.log(JSON.stringify({items:inventory.length,currentRecordings:inventory.length-missing.length,missing:missing.length,charactersPerVoice:inventory.reduce((n,x)=>n+x.text.length,0)}));
