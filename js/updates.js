/* One address, explicit version and safe updates without interrupting a lesson. */
(function () {
  'use strict';
  let registration, applying = false;
  const status = message => document.querySelectorAll('[data-update-status]').forEach(el => { el.textContent = message; });
  function ready() {
    if (!registration?.waiting) return;
    const root = document.getElementById('update-root');
    // Mention the lesson only when one is actually open (the review page has none).
    const inLesson = !!window.__yalla?.session;
    const text = inLesson
      ? 'גרסה חדשה מוכנה. סיימו קודם את השיעור (עד המסך ״השיעור הושלם!״), ואז לחצו על עדכון.'
      : 'גרסה חדשה מוכנה. אפשר לעדכן עכשיו; ההתקדמות שלכם נשמרת.';
    if (root) root.innerHTML = `<div class="update-banner" role="status"><span>${text}</span><button class="btn primary" data-apply-update>עדכון עכשיו</button></div>`;
    status('גרסה חדשה מוכנה. לחצו על ״עדכון עכשיו״.');
  }
  async function check() {
    status('בודקים עדכון…');
    try {
      registration = registration || await navigator.serviceWorker?.getRegistration();
      if (registration) await registration.update();
      if (registration?.waiting) return ready();
      const response = await fetch('version.json?t=' + Date.now(), {cache:'no-store'});
      if (!response.ok) throw new Error('Version unavailable');
      const latest = await response.json();
      if (latest.version === window.YALLA_BUILD.version) status('זו הגרסה העדכנית.');
      else if (registration) status('עדכון חדש מתכונן. הכפתור יופיע כשההורדה תסתיים.');
      else status('קיימת גרסה חדשה. רעננו את הדף כדי לטעון אותה.');
    } catch { status('לא ניתן לבדוק כרגע. התחברו לאינטרנט ונסו שוב.'); }
  }
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', async () => {
      try {
        registration = await navigator.serviceWorker.register('sw.js', {updateViaCache:'none'});
        ready();
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          worker?.addEventListener('statechange', () => { if (worker.state === 'installed') ready(); });
        });
      } catch { status('העבודה ללא אינטרנט אינה זמינה בדפדפן הזה.'); }
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (applying) location.reload(); });
  }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-check-update]')) check();
    if (event.target.closest('[data-apply-update]') && registration?.waiting) {
      applying = true;
      registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});
    }
  });
})();
