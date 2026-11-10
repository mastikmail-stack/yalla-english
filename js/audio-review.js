(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const catalog = window.YALLA_AUDIO_CATALOG;
  const build = window.YALLA_BUILD.version;
  // Results are kept per voice (approving an item in one voice never approves the other), and a
  // mark counts only while it names the current recording file (see valid). So an app update that
  // does not replace a recording keeps the mark; a replaced take must be heard again.
  const voiceKey = () => window.YallaAudio.currentVoice();
  const key = () => 'yallaEnglish.audioReview.marks.' + voiceKey();
  try { const pref = localStorage.getItem('yallaEnglish.audioReview.voice'); if (pref) window.YallaAudio.setVoice(pref); } catch { /* ignore */ }
  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let results = {}, list = [], index = 0, heard = new Set(), playback = null;
  function loadResults() {
    results = {};
    try {
      let raw = localStorage.getItem(key());
      if (raw === null) {
        // Marks from builds before 2026.11.10.7 were stored per build: carry over the newest.
        const old = Object.keys(localStorage).filter(k => k.startsWith('yallaEnglish.audioReview.2') && k.endsWith('.' + voiceKey())).sort().pop();
        if (old) raw = localStorage.getItem(old);
      }
      const saved = JSON.parse(raw);
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) results = saved;
    } catch { /* keep review usable */ }
  }
  loadResults();
  $('voice').innerHTML = window.YallaAudio.voices().map(v => `<option value="${esc(v.key)}">${esc(v.label)}${v.complete ? '' : ' — בהכנה ' + v.count + '/' + v.total}</option>`).join('');
  $('voice').value = voiceKey();
  $('voice').onchange = () => { window.YallaAudio.setVoice($('voice').value); try { localStorage.setItem('yallaEnglish.audioReview.voice', voiceKey()); } catch { /* ignore */ } loadResults(); filter(); };
  $('build').textContent = 'גרסה ' + build;
  // A mark counts only for the exact recording that was heard; a replaced take needs a new check.
  const valid = item => { const r = results[item.id]; return r && r.source?.file && r.source.file === window.YallaAudio.recording(item.text) ? r : null; };
  function save() { try { localStorage.setItem(key(), JSON.stringify(results)); } catch { $('summary').textContent = 'שמירה במכשיר נכשלה. הורידו דו״ח כדי לשמור את הבדיקה.'; } }
  function filter() {
    const group = $('group').value;
    list = catalog.filter(item => group === 'all' || (group === 'missing' ? !window.YallaAudio.recording(item.text) : group === 'fail' ? valid(item)?.status === 'fail' : item.type === group));
    index = 0;
    $('item').innerHTML = list.map((item,i) => `<option value="${i}">${esc(item.text)} — ${esc(item.meaning)}</option>`).join('');
    render();
  }
  function render() {
    window.YallaAudio.stop(); heard = new Set(); playback = null;
    $('item').value = String(index);
    $('previous').disabled = index === 0;
    $('next').disabled = index >= list.length - 1;
    const checked = catalog.filter(item => ['pass','fail'].includes(valid(item)?.status));
    $('summary').textContent = `${checked.length} מתוך ${catalog.length} פריטים סומנו; ${checked.filter(item => valid(item).status === 'fail').length} דורשים תיקון. פריטים שלא נבדקו אינם מאושרים.`;
    $('progress').textContent = list.length ? `${index + 1} מתוך ${list.length} בקבוצה` : 'אין פריטים בקבוצה הזאת';
    const item = list[index];
    if (!item) { $('review-card').innerHTML = '<p>אין כרגע פריטים להצגה.</p>'; return; }
    const previous = valid(item);
    const replaced = !previous && results[item.id];
    $('review-card').innerHTML = `<p>${item.type === 'letter' ? 'שם האות — לא הצליל שלה בתוך מילה' : item.type === 'word' ? 'מילה או ביטוי' : 'משפט'}</p>
      <h2 class="review-word" dir="ltr">${esc(item.text)}</h2><p>${esc(item.meaning)}</p>${item.hint ? `<p>עזר להגייה: ${esc(item.hint)}</p>` : ''}
      <p class="study-hint">מופיע בשיעורים: ${item.lessons.map(l => esc(l.title)).join(' · ')}</p>
      <div class="review-actions"><button class="btn blue" id="play">🔊 השמעה</button><button class="btn" id="slow">🐢 לאט</button><button class="btn" id="stop">עצירה</button></div>
      <p id="play-status" role="status">${previous ? 'סימון קודם: ' + (previous.status === 'pass' ? 'תקין' : 'דורש תיקון') : replaced ? 'ההקלטה הוחלפה מאז הסימון הקודם. האזינו שוב.' : 'טרם נבדק'}</p>
      <label for="note">מה נשמע או מה צריך לתקן?</label><textarea id="note" rows="2" maxlength="1000" placeholder="לדוגמה: מוצגת F, אך נשמע שם של אות אחרת">${esc(previous?.note)}</textarea>
      <div class="review-actions"><button class="btn primary" id="pass" disabled>נשמע נכון</button><button class="btn" id="fail">יש בעיה</button></div>
      <p class="study-hint">אפשר לאשר הגייה רק אחרי סיום ההשמעה. אם אין צליל או שהוא נקטע, סמנו ״יש בעיה״.</p>`;
    $('note').addEventListener('input', () => {
      if (results[item.id]) { results[item.id].note = $('note').value; save(); }
    });
    const play = slow => {
      $('play-status').textContent = 'טוענים השמעה…';
      if (!window.YallaAudio.play) { $('play-status').textContent = 'נדרש עדכון גרסה. לחצו על ״עדכון עכשיו״ או סגרו ופתחו שוב את האפליקציה.'; return; }
      window.YallaAudio.play(item.text, {slow,
        onStart: source => { playback = source; $('play-status').textContent = source.engine === 'voice-recording' ? 'מושמעת הקלטה בקול ' + (window.YallaAudio.voices().find(v => v.key === source.voice)?.label || source.voice) + ': ' + item.text : 'מושמע בקול המכשיר ' + source.voice; },
        onEnd: () => { heard.add(slow ? 'slow' : 'normal'); $('pass').disabled = false; $('play-status').textContent = 'ההשמעה הסתיימה. האם היא תואמת למה שכתוב?'; },
        onError: kind => { $('play-status').textContent = kind === 'missing-recording' ? 'אין עדיין הקלטה לפריט הזה בקול שנבחר. הוא מופיע כחסר בדו״ח.' : 'ההשמעה נכשלה. סמנו בעיה וכתבו מה קרה.'; }
      });
    };
    $('play').onclick = () => play(false); $('slow').onclick = () => play(true);
    $('stop').onclick = () => { window.YallaAudio.stop(); $('play-status').textContent = 'ההשמעה נעצרה.'; };
    const mark = status => {
      if (status === 'pass' && !heard.size) return;
      results[item.id] = {status, note:$('note').value, heardModes:Array.from(heard), source:playback, time:new Date().toISOString()};
      save();
      if (index < list.length - 1) index++;
      render();
    };
    $('pass').onclick = () => mark('pass'); $('fail').onclick = () => mark('fail');
  }
  $('group').onchange = filter;
  $('item').onchange = () => { index = Number($('item').value); render(); };
  $('previous').onclick = () => { if (index > 0) { index--; render(); } };
  $('next').onclick = () => { if (index < list.length - 1) { index++; render(); } };
  $('export').onclick = () => {
    const report = {app:'yalla-english', build, created:new Date().toISOString(), page:location.origin + location.pathname, userAgent:navigator.userAgent, voice:voiceKey(), deviceVoice:window.YallaAudio.voice()?.name || null,
      entries:catalog.map(item => ({...item, recording:window.YallaAudio.recording(item.text), result:valid(item) || {status:'not-reviewed', earlierMarkForReplacedTake:results[item.id] || undefined}}))};
    const url = URL.createObjectURL(new Blob([JSON.stringify(report,null,2)], {type:'application/json'}));
    const link = document.createElement('a'); link.href = url; link.download = 'yalla-audio-review-' + build + '-' + voiceKey() + '.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) window.YallaAudio.stop(); });
  filter();
})();
