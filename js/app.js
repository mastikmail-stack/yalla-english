/*
 * Yalla English (יאללה אינגליש) – main app logic.
 * Vanilla JS, no build step. Course content lives in js/data.js (window.COURSE).
 *
 * Sections:
 *   1. Constants & utils
 *   2. Course index (flattened lessons / words)
 *   3. State (localStorage), hearts, streak, XP, achievements
 *   4. Audio (sound effects + English text-to-speech)
 *   5. Answer checking (normalize / typo tolerance)
 *   6. Exercise builders + lesson/practice generators
 *   7. Exercise renderers (EX registry)
 *   8. Lesson session engine (check → feedback → next → finish)
 *   9. Main screens (path, practice, words, profile) + modals
 *  10. Event wiring (click delegation, keyboard), PWA, boot
 */
(function () {
  'use strict';

  // ───────────────────────── 1. Constants & utils ─────────────────────────
  const STORAGE_KEY = 'yallaEnglish.v1';
  const MAX_HEARTS = 5;
  const HEART_REGEN_MIN = 30;        // minutes per heart
  const XP_LESSON = 10;
  const XP_PERFECT_BONUS = 5;
  const XP_PRACTICE = 10;
  const MASCOT = '🦊';
  const PRAISE = ['מצוין!', 'כל הכבוד!', 'יפה מאוד!', 'נהדר!', 'מעולה!', 'אלופים!', 'בול!'];
  const WRONG = ['לא בדיוק...', 'כמעט!', 'אופס...', 'לא נורא, ממשיכים!'];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sample = (arr, n) => shuffle(arr).slice(0, n);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const pad2 = (n) => String(n).padStart(2, '0');
  const todayStr = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
  /** Escape Hebrew text and isolate English fragments so mixed RTL/LTR reads correctly. */
  const mixed = (s) => String(s).split(/([A-Za-z][A-Za-z0-9'’]*(?:[ \t]+[A-Za-z0-9][A-Za-z0-9'’]*)*[?!.,:]?)/g).map((part,i) => i % 2 ? `<bdi dir="ltr">${esc(part)}</bdi>` : esc(part)).join('');
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v * (1 + amt))));
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('');
  }

  // ───────────────────────── 2. Course index ─────────────────────────
  const COURSE = window.COURSE;
  const LESSONS = [];
  COURSE.units.forEach((unit, ui) => {
    unit.lessons.forEach((lesson, li) => {
      lesson.words.forEach((w) => { w.lessonId = lesson.id; });
      lesson.sentences.forEach((s) => { s.lessonId = lesson.id; });
      LESSONS.push(Object.assign({}, lesson, { unit, unitIndex: ui, indexInUnit: li, order: LESSONS.length }));
    });
  });
  const ALL_WORDS = LESSONS.flatMap((l) => l.words);
  const ALL_SENTENCES = LESSONS.flatMap((l) => l.sentences);
  const lessonById = (id) => LESSONS.find((l) => l.id === id);
  const LEVELS = window.LEARNING_LEVELS;
  const wordKey = (w) => w.ex ? 'letter:' + w.en : w.en;
  const uniqueWords = (words) => [...new Map(words.map(w => [wordKey(w), w])).values()];

  // ───────────────────────── 3. State ─────────────────────────
  const DEFAULT_STATE = {
    xp: 0,
    streak: 0,
    bestStreak: 0,
    lastActive: null,              // 'YYYY-MM-DD' of last finished lesson/practice
    daily: { date: null, xp: 0 },
    hearts: MAX_HEARTS,
    heartsTs: Date.now(),          // time the regen timer started
    completed: {},                 // lessonId -> times completed
    perfect: {},                   // lessonId -> true
    wordStats: {},                 // word / letter:X -> {c, w, box, due, reviewed}
    achievements: [],              // ids
    welcomed: false,
    startLessonId: 'ual1',
    levelId: 'zero',
    settings: { sound: true, autoSpeak: true, deviceVoice: false, vibrate: true, unlimitedHearts: true, dailyGoal: 20, theme: 'auto', voice: window.YallaAudio.currentVoice() }
  };

  let state = load();
  window.YallaAudio.setVoice(state.settings.voice);

  function cleanState(s) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) throw new Error('Invalid progress');
    const result = clone(DEFAULT_STATE);
    const number = (v, fallback = 0) => Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback;
    ['xp', 'streak', 'bestStreak'].forEach(k => result[k] = number(s[k]));
    result.hearts = Math.min(MAX_HEARTS, number(s.hearts, MAX_HEARTS));
    result.heartsTs = Math.min(Date.now(), number(s.heartsTs, Date.now()));
    const validDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v));
    result.lastActive = validDate(s.lastActive) ? s.lastActive : null;
    result.daily = { date: validDate(s.daily?.date) ? s.daily.date : null, xp: number(s.daily?.xp) };
    LESSONS.forEach(l => {
      if (number(s.completed?.[l.id])) result.completed[l.id] = number(s.completed[l.id]);
      if (s.perfect?.[l.id] === true && result.completed[l.id]) result.perfect[l.id] = true;
    });
    ALL_WORDS.forEach(w => {
      const k = wordKey(w), old = s.wordStats?.[k] || (w.ex ? s.wordStats?.[w.en] : null);
      if (old && typeof old === 'object') result.wordStats[k] = { c:number(old.c), w:number(old.w), box:Math.min(5,number(old.box)), due:number(old.due), reviewed:validDate(old.reviewed) ? old.reviewed : null };
    });
    result.achievements = Array.isArray(s.achievements) ? [...new Set(s.achievements.filter(x => typeof x === 'string'))] : [];
    result.welcomed = s.welcomed === true;
    if (lessonById(s.startLessonId)) result.startLessonId = s.startLessonId;
    if (LEVELS.some(x => x.id === s.levelId)) result.levelId = s.levelId;
    const settings = s.settings || {};
    ['sound','autoSpeak','deviceVoice','vibrate','unlimitedHearts'].forEach(k => { if (typeof settings[k] === 'boolean') result.settings[k] = settings[k]; });
    if ([10,20,30,50].includes(settings.dailyGoal)) result.settings.dailyGoal = settings.dailyGoal;
    if (['auto','light','dark'].includes(settings.theme)) result.settings.theme = settings.theme;
    if (window.YallaAudio.voices().some(v => v.key === settings.voice)) result.settings.voice = settings.voice;
    return result;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        return cleanState(s);
      }
    } catch (e) { /* storage blocked – run without saving */ }
    return clone(DEFAULT_STATE);
  }
  let storageWarning = false;
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; }
    catch (e) { if (!storageWarning) { storageWarning = true; toast('לא ניתן לשמור במכשיר הזה. אפשר לגבות את ההתקדמות דרך הפרופיל.'); } return false; }
  }

  // Hearts
  function regenHearts() {
    if (state.hearts >= MAX_HEARTS) { state.hearts = MAX_HEARTS; return; }
    const step = HEART_REGEN_MIN * 60000;
    const gained = Math.floor((Date.now() - state.heartsTs) / step);
    if (gained > 0) {
      state.hearts = Math.min(MAX_HEARTS, state.hearts + gained);
      state.heartsTs += gained * step;
      save();
    }
  }
  function loseHeart() {
    if (state.settings.unlimitedHearts) return;
    if (state.hearts >= MAX_HEARTS) state.heartsTs = Date.now();
    state.hearts = Math.max(0, state.hearts - 1);
    save();
  }
  function gainHeart() {
    state.hearts = Math.min(MAX_HEARTS, state.hearts + 1);
    if (state.hearts >= MAX_HEARTS) state.heartsTs = Date.now();
  }
  function minutesToNextHeart() {
    if (state.hearts >= MAX_HEARTS) return 0;
    return Math.max(1, Math.ceil((state.heartsTs + HEART_REGEN_MIN * 60000 - Date.now()) / 60000));
  }
  const heartsLabel = () => (state.settings.unlimitedHearts ? '∞' : state.hearts);
  const outOfHearts = () => !state.settings.unlimitedHearts && state.hearts <= 0;

  // Streak / XP
  function currentStreak() {
    if (!state.lastActive) return 0;
    return daysBetween(state.lastActive, todayStr()) <= 1 ? state.streak : 0;
  }
  const doneToday = () => state.lastActive === todayStr();
  const dailyXp = () => (state.daily.date === todayStr() ? state.daily.xp : 0);
  function addXp(xp) {
    const t = todayStr();
    if (state.lastActive !== t) {
      const gap = state.lastActive ? daysBetween(state.lastActive, t) : null;
      state.streak = gap === 1 ? state.streak + 1 : 1;
      state.lastActive = t;
    }
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    if (state.daily.date !== t) state.daily = { date: t, xp: 0 };
    state.daily.xp += xp;
    state.xp += xp;
  }

  // Progress helpers
  const lessonsDone = () => LESSONS.filter((l) => state.completed[l.id]).length;
  const learnedLessons = () => LESSONS.filter((l) => state.completed[l.id]);
  const learnedWords = () => uniqueWords(learnedLessons().flatMap((l) => l.words));
  const vocabularyCount = () => learnedWords().filter(w => !isLetter(w)).length;
  const startOrder = () => lessonById(state.startLessonId)?.order || 0;
  const reviewLessons = () => LESSONS.filter(l => state.completed[l.id] || l.order < startOrder());
  const dueWords = () => uniqueWords(reviewLessons().flatMap(l => l.words)).filter(w => (state.wordStats[wordKey(w)]?.due || 0) <= Date.now());
  function currentLessonIndex() {
    const i = LESSONS.findIndex((l) => l.order >= startOrder() && !state.completed[l.id]);
    return i === -1 ? LESSONS.length : i;
  }
  function lessonStatus(l) {
    if (state.completed[l.id]) return 'done';
    if (l.order < startOrder()) return 'available';
    const cur = currentLessonIndex();
    if (l.order === cur) return 'current';
    return l.order < cur ? 'done' : 'locked';
  }
  function wordStrength(w) {
    const s = state.wordStats[wordKey(w)] || { c: 0, w: 0 };
    return Math.max(0.1, Math.min(1, (s.c + 1) / (s.c + s.w * 2 + 2)));
  }
  function recordWord(w, ok) {
    if (!w) return;
    const s = state.wordStats[wordKey(w)] || (state.wordStats[wordKey(w)] = { c: 0, w: 0, box: 0 });
    if (ok) s.c++; else s.w++;
    if (!ok) { s.box = 0; s.due = Date.now() + 10 * 60000; }
    else if (s.reviewed !== todayStr()) {
      s.box = Math.min(5, (s.box || 0) + 1);
      s.due = Date.now() + [1,3,7,14,30][s.box - 1] * 86400000;
      s.reviewed = todayStr();
    }
  }

  // Achievements
  const ACHIEVEMENTS = [
    { id: 'first', icon: '🐣', title: 'צעד ראשון', desc: 'השלימו שיעור ראשון', test: () => lessonsDone() >= 1 },
    { id: 'five', icon: '📚', title: 'תלמיד חרוץ', desc: 'השלימו 5 שיעורים', test: () => lessonsDone() >= 5 },
    { id: 'perfect', icon: '💯', title: 'מושלם!', desc: 'שיעור בלי אף טעות', test: () => Object.keys(state.perfect).length >= 1 },
    { id: 'streak3', icon: '🔥', title: 'על הגל', desc: 'רצף של 3 ימים', test: () => state.bestStreak >= 3 },
    { id: 'streak7', icon: '🏆', title: 'שבוע של אש', desc: 'רצף של 7 ימים', test: () => state.bestStreak >= 7 },
    { id: 'xp100', icon: '⭐', title: '100 XP', desc: 'צברו 100 נקודות', test: () => state.xp >= 100 },
    { id: 'xp500', icon: '🌟', title: '500 XP', desc: 'צברו 500 נקודות', test: () => state.xp >= 500 },
    { id: 'unit', icon: '🎓', title: 'בוגרי יחידה', desc: 'השלימו יחידה שלמה', test: () => COURSE.units.some((u) => u.lessons.every((l) => state.completed[l.id])) },
    { id: 'words50', icon: '🧠', title: '50 מילים', desc: 'למדו 50 מילים שונות', test: () => vocabularyCount() >= 50 },
    { id: 'all', icon: '👑', title: 'אלופי האנגלית', desc: 'השלימו את כל הקורס', test: () => lessonsDone() === LESSONS.length }
  ];
  function checkAchievements() {
    const fresh = ACHIEVEMENTS.filter((a) => !state.achievements.includes(a.id) && a.test());
    fresh.forEach((a) => state.achievements.push(a.id));
    return fresh;
  }

  // ───────────────────────── 4. Audio ─────────────────────────
  let actx = null;
  function tone(freqs, dur = 0.12, type = 'sine', gap = 0.09, vol = 0.14) {
    if (!state.settings.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const now = actx.currentTime;
      freqs.forEach((f, i) => {
        const o = actx.createOscillator();
        const g = actx.createGain();
        const t0 = now + i * gap;
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(actx.destination);
        o.start(t0); o.stop(t0 + dur + 0.03);
      });
    } catch (e) { /* no audio */ }
  }
  const sfx = {
    correct: () => tone([660, 990], 0.16, 'sine', 0.1),
    wrong: () => tone([240, 180], 0.22, 'square', 0.13, 0.05),
    tap: () => tone([520], 0.05, 'sine', 0, 0.04),
    match: () => tone([700, 940], 0.08, 'sine', 0.06, 0.08),
    finish: () => tone([523, 659, 784, 1047], 0.24, 'triangle', 0.13, 0.16)
  };
  function vibrate(ms) { if (state.settings.vibrate && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* ignore */ } } }

  // The application and the audio review page use the exact same playback engine.
  function speak(text, slow = false) {
    return window.YallaAudio.play(text, {slow, allowDeviceVoice:state.settings.deviceVoice, onError:kind => toast(kind === 'recording'
      ? 'ההקלטה לא נטענה. נסו שוב או בדקו את החיבור.'
      : kind === 'missing-recording' ? 'ההקלטה לפריט הזה עדיין בהכנה בקול שבחרתם. אפשר להמשיך בתרגול החזותי, או לבחור קול אחר בפרופיל.'
      : kind === 'voice' ? 'לא נמצא קול באנגלית במכשיר. שמות האותיות זמינים בהקלטה; למילים אפשר לעבור לתרגיל חזותי.'
      : 'ההקראה אינה זמינה כרגע. אפשר לעבור לתרגיל חזותי.')});
  }
  function stopSpeech() {
    window.YallaAudio.stop();
  }
  const canSpeak = text => !!window.YallaAudio.recording(text) || (state.settings.deviceVoice && !!window.YallaAudio.voice());
  const autoSpeak = (text) => { if (state.settings.autoSpeak && canSpeak(text)) speak(text); };

  // ───────────────────────── 5. Answer checking ─────────────────────────
  const CONTRACTIONS = {
    "i'm": 'i am', "you're": 'you are', "he's": 'he is', "she's": 'she is', "it's": 'it is', "we're": 'we are', "they're": 'they are',
    "what's": 'what is', "where's": 'where is', "who's": 'who is', "when's": 'when is', "how's": 'how is', "that's": 'that is', "there's": 'there is',
    "let's": 'let us', "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "isn't": 'is not', "aren't": 'are not',
    "wasn't": 'was not', "weren't": 'were not', "can't": 'cannot', "won't": 'will not', "i'll": 'i will', "you'll": 'you will',
    "i'd": 'i would', "you'd": 'you would', "we'd": 'we would', "i've": 'i have', "you've": 'you have', "we've": 'we have',
    "name's": 'name is', "today's": 'today is', "meeting's": 'meeting is', "baby's": 'baby is', "party's": 'party is'
  };
  function normalize(s) {
    let t = String(s).toLowerCase().replace(/[’‘`´]/g, "'");
    t = t.replace(/[a-z']+/g, (w) => CONTRACTIONS[w] || w);
    t = t.replace(/\bcan not\b/g, 'cannot').replace(/'/g, '');
    return t.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  /** Edit distance where a swap of two neighbour letters also counts as 1 typo. */
  function lev(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    const d = Array.from({ length: m + 1 }, (_, i) => { const r = new Array(n + 1).fill(0); r[0] = i; return r; });
    for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[m][n];
  }
  /** Compare user input to an item ({en, alt}). Small typos in long words are forgiven. */
  function gradeText(input, item, allowTypos = true) {
    const n = normalize(input);
    const answers = [item.en].concat(item.alt || []);
    if (!n) return { ok: false };
    if (answers.some((a) => normalize(a) === n)) return { ok: true };
    if (allowTypos) {
      const iw = n.split(' ');
      for (const a of answers) {
        const aw = normalize(a).split(' ');
        if (aw.length !== iw.length) continue;
        let typos = 0, fail = false;
        for (let k = 0; k < aw.length; k++) {
          if (aw[k] === iw[k]) continue;
          // A known word or grammatical form is not a harmless spelling error.
          const meaningful = KNOWN_TOKENS.has(iw[k]) || /^(?:.+s|.+ed|.+ing)$/.test(iw[k]) && (iw[k] === aw[k] + 's' || iw[k] === aw[k] + 'ed' || iw[k] === aw[k] + 'ing') || aw[k] === iw[k] + 's';
          if (aw[k].length >= 4 && !meaningful && lev(aw[k], iw[k]) <= 1) typos++; else { fail = true; break; }
        }
        if (!fail && typos <= 1) return { ok: true, typo: true, expected: a };
      }
    }
    return { ok: false };
  }

  // ───────────────────────── 6. Exercise builders ─────────────────────────
  const KNOWN_TOKENS = new Set([...ALL_WORDS, ...ALL_SENTENCES].flatMap(w => [w.en, ...(w.alt || [])]).flatMap(x => normalize(x).split(' ')).concat('can cant cannot will well walk talk thing think form from than then there their these those mouth month four for tree three play plays drink drinks eat eats read reads want wants has have is are was were not no do does did'.split(' ')));
  const isLetter = (w) => !!w.ex;
  const canSpell = (w) => /^[a-z]{2,7}$/.test(w.en);

  /** Pick n distractor words from pools (in priority order), unique by en and he. Letters only mix with letters. */
  function distractorWords(word, pools, n) {
    const seen = new Set(['en:' + word.en, 'he:' + word.he]);
    const letter = isLetter(word);
    const out = [];
    for (const pool of pools) {
      for (const w of shuffle(pool)) {
        if (out.length >= n) return out;
        if (isLetter(w) !== letter) continue;
        if (seen.has('en:' + w.en) || seen.has('he:' + w.he)) continue;
        seen.add('en:' + w.en); seen.add('he:' + w.he);
        out.push(w);
      }
    }
    return out;
  }
  function distractorSentences(sent, pools, n) {
    const seen = new Set([sent.he]);
    const out = [];
    for (const pool of pools) {
      for (const s of shuffle(pool)) {
        if (out.length >= n) return out;
        if (seen.has(s.he)) continue;
        seen.add(s.he); out.push(s);
      }
    }
    return out;
  }
  const tokens = (s) => s.replace(/[.,!?;:]/g, '').split(/\s+/).filter(Boolean);

  const exEnHe = (w, pW) => ({ type: 'mc_en_he', word: w, options: shuffle([w].concat(distractorWords(w, pW, 3))) });
  const exPickImage = (w, pW, isNew) => (isLetter(w) ? exEnHe(w, pW)
    : { type: 'pick_image', word: w, isNew, options: shuffle([w].concat(distractorWords(w, pW, 3))) });
  const homophones = [['see','sea'],['two','to','too'],['four','for'],['here','hear'],['no','know'],['right','write']];
  const exListenPick = (w, pW) => ({ type: 'listen_pick', word: w, options: shuffle([w].concat(distractorWords(w, pW.map(pool => pool.filter(x => !homophones.some(group => group.includes(w.en) && group.includes(x.en)))), 3))) });
  const exMatch = (words) => ({ type: 'match', pairs: uniqueWords(words).filter((w,i,a) => a.findIndex(x => x.he === w.he) === i).slice(0, 5) });
  const exCaseMatch = (letters) => ({ type: 'match', caseMode: true, pairs: uniqueWords(letters).slice(0, 5).map((w) => ({ ...w, he: w.en.toLowerCase() })) });
  const exFirstLetter = (w, pW) => ({ type: 'first_letter', word: w, options: shuffle([w].concat(distractorWords(w, pW, 3))) });
  const exTypeWord = (w) => ({ type: 'type_word', word: w });
  const exTypeSentence = (s) => ({ type: 'type_sentence', sentence: s });
  const exListenType = (s) => ({ type: 'listen_type', sentence: s });
  const exMcSentence = (s, pS) => ({ type: 'mc_sentence', sentence: s, options: shuffle([s].concat(distractorSentences(s, pS, 2))) });
  /** Build a short word from tiles; longer words use recognition, never forced early typing. */
  function exSpell(w) {
    if (!canSpell(w)) return exEnHe(w, [[w], ALL_WORDS.filter(x => x.lessonId === w.lessonId)]);
    const letters = w.en.split('');
    const pool = 'abcdefghijklmnoprstuvwy'.split('').filter((c) => !letters.includes(c));
    return { type: 'spell', word: w, tiles: shuffle(letters.concat(sample(pool, 2))) };
  }
  function exBuild(s, pS, listen = false) {
    const ans = tokens(s.en).map((t, i) => (i === 0 && t !== 'I' ? t.charAt(0).toLowerCase() + t.slice(1) : t));
    const lower = new Set(ans.map((t) => t.toLowerCase()));
    const extra = [];
    const seen = new Set();
    for (const pool of pS) {
      for (const other of shuffle(pool)) {
        if (other === s) continue;
        for (const t0 of tokens(other.en)) {
          const t = t0 === 'I' ? t0 : t0.toLowerCase();
          if (lower.has(t.toLowerCase()) || seen.has(t)) continue;
          seen.add(t); extra.push(t);
        }
      }
    }
    const nExtra = listen ? 2 : Math.min(4, Math.max(2, Math.round(ans.length * 0.6)));
    return { type: listen ? 'listen_build' : 'build', sentence: s, tiles: shuffle(ans.concat(shuffle(extra).slice(0, nExtra))) };
  }

  /** Alphabet lessons: letter names, sounds, upper/lower case, first letter of a word. */
  function genLetters(l) {
    const pW = [l.words];
    const exercises = l.words.map(w => exEnHe(w, pW));
    exercises.push(...sample(l.words, 3).map(w => exListenPick(w, pW)), exCaseMatch(l.words));
    // Every letter appears as a target, and its example spelling is shown.
    exercises.push(...sample(l.words, 3).map(w => exFirstLetter(w, pW)));
    return exercises;
  }

  /**
   * Explicit stages survive inserting/reordering units:
   * letters/starter/guided use recognition and tiles, independent permits typing.
   * Every word appears as a target; prepareLesson adds introductions on first use.
   */
  function genLesson(l) {
    if (l.type === 'letters') return genLetters(l);
    const W = shuffle(l.words);
    const S = shuffle(l.sentences);
    const w = (i) => W[i % W.length];
    const s = (i) => S[i % S.length];
    const previous = LESSONS.filter(x => x.order < l.order);
    const pW = [l.words, previous.flatMap(x => x.words)];
    const pS = [l.sentences, previous.flatMap(x => x.sentences)];
    const firstTime = !state.completed[l.id];
    const early = l.unit.stage !== 'independent';
    const exercises = W.map((word, i) => i % 3 === 0 ? exPickImage(word,pW,firstTime) : i % 3 === 1 ? exEnHe(word,pW) : exListenPick(word,pW));
    exercises.push(exMatch(sample(l.words,5)), early ? exSpell(w(0)) : exTypeWord(w(0)), exBuild(s(0),pS), exMcSentence(s(1),pS), exBuild(s(2),pS,true), early ? exBuild(s(3),pS) : exTypeSentence(s(3)));
    return exercises;
  }

  /** Practice uses completed or self-declared familiar lessons. kind: weak | listen | write | due. */
  function genPractice(kind) {
    const ls = reviewLessons();
    if (!ls.length) return null;
    const words = uniqueWords(ls.flatMap((l) => l.words));
    const sents = ls.flatMap((l) => l.sentences);
    const advanced = ls.some((l) => l.unit.stage === 'independent');
    const pW = [words];
    const pS = [sents];
    // weakest words first (with some randomness)
    const weak = words
      .map((w) => ({ w, score: (kind === 'due' && (state.wordStats[wordKey(w)]?.due || 0) > Date.now() ? 10 : 0) + wordStrength(w) + Math.random() * 0.1 }))
      .sort((a, b) => a.score - b.score)
      .map((x) => x.w);
    const W = (i) => weak[i % weak.length];
    // Only the alphabet is done so far: letters-only practice
    if (!sents.length) {
      const weakLetters = weak.filter(isLetter);
      const L = (i) => weakLetters[i % weakLetters.length];
      return [exEnHe(L(0), pW), exListenPick(L(1), pW), exFirstLetter(L(2), pW), exEnHe(L(3), pW), exMatch(sample(weakLetters, 5)),
        exListenPick(L(4), pW), exFirstLetter(L(5), pW), exCaseMatch(sample(weakLetters, 5)), exEnHe(L(6), pW), exFirstLetter(L(7), pW)];
    }
    const weakWords = weak.filter((w) => !isLetter(w));
    const RW = (i) => weakWords[i % weakWords.length];
    const S = shuffle(sents);
    const s = (i) => S[i % S.length];
    const typeW = (w) => (advanced ? exTypeWord(w) : exSpell(w));
    const typeS = (x) => (advanced ? exTypeSentence(x) : exBuild(x, pS));
    const listenS = (x) => (advanced ? exListenType(x) : exBuild(x, pS, true));
    if (kind === 'due') return weak.slice(0, 10).map((w, i) => i % 2 ? exListenPick(w,pW) : exEnHe(w,pW));
    if (kind === 'listen') {
      return [exListenPick(W(0), pW), exListenPick(W(1), pW), exListenPick(W(2), pW), exBuild(s(0), pS, true), exListenPick(W(3), pW),
        exBuild(s(1), pS, true), listenS(s(2)), exBuild(s(3), pS, true), listenS(s(4)), listenS(s(5))];
    }
    if (kind === 'write') {
      return [typeW(RW(0)), typeW(RW(1)), typeW(RW(2)), typeS(s(0)), typeW(RW(3)),
        typeS(s(1)), listenS(s(2)), typeW(RW(4)), typeS(s(3)), listenS(s(4))];
    }
    return [exPickImage(W(0), pW, false), exEnHe(W(1), pW), exEnHe(W(2), pW), exListenPick(W(3), pW),
      exMatch(weakWords.length >= 5 ? weakWords.slice(0, 5) : weak.slice(0, 5)),
      typeW(RW(4)), exBuild(s(0), pS), typeW(RW(5)), exBuild(s(1), pS), typeS(s(2))];
  }

  // ───────────────────────── 7. Exercise renderers ─────────────────────────
  // Each renderer: render(ex, body) draws the exercise and calls setAnswer(value).
  // grade(ex, answer) returns { ok, typo?, correct, correctDir: 'en'|'he', meaning?, speakText?, words? }.
  const speakBtn = (text, cls = '') => `<button class="speak-btn ${cls}" data-action="speak" data-text="${esc(text)}" aria-label="השמעה">🔊</button>`;
  const speakBig = (text) => `<div class="speak-big">
      <button class="speak-btn" data-action="speak" data-text="${esc(text)}" aria-label="השמעה">🔊</button>
      <button class="speak-btn slow" data-action="speak" data-slow="1" data-text="${esc(text)}" aria-label="השמעה איטית">🐢</button>
    </div>`;
  const mascotSays = (heText) => `<div class="mascot-row"><div class="mascot" aria-hidden="true">${MASCOT}</div><div class="bubble he">${esc(heText)}</div></div>`;
  const noSpeech = () => !('speechSynthesis' in window);
  /** Hebrew-letters pronunciation hint (only words that have `say` in data.js) */
  const sayHint = (w) => (w && w.say ? `<span class="say">${esc(w.say)}</span>` : '');
  const bigLetter = (w) => `${esc(w.en)}${esc(w.en.toLowerCase())}`;

  function wireChoices(body, selector, onPick) {
    const btns = $$(selector, body);
    btns.forEach((b, i) => b.addEventListener('click', () => {
      if (session.phase !== 'answer') return;
      btns.forEach((x) => x.classList.remove('sel'));
      b.classList.add('sel');
      sfx.tap();
      onPick(i);
    }));
    session.numberKeys = btns;
  }
  function wireTyping(body) {
    const input = $('.type-input', body);
    input.addEventListener('input', () => setAnswer(input.value.trim() || null));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (session.phase === 'feedback') onContinue(); else if (session.answer) onCheck(); }
    });
    setTimeout(() => { try { input.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 50);
  }
  const typeBox = (multi) => multi
    ? '<textarea class="type-input en" aria-label="התשובה באנגלית" rows="3" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="כתבו באנגלית..."></textarea>'
    : '<input class="type-input en" aria-label="התשובה באנגלית" type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="כתבו באנגלית...">';

  function wireTiles(body, ex) {
    const area = $('#ans', body);
    const chosen = [];
    const bankBtns = $$('#bank .tile', body);
    const sep = ex.type === 'spell' ? '' : ' ';
    const update = () => setAnswer(chosen.length ? chosen.map((i) => ex.tiles[i]).join(sep) : null);
    bankBtns.forEach((b) => b.addEventListener('click', () => {
      if (session.phase !== 'answer' || b.disabled) return;
      const i = +b.dataset.t;
      b.disabled = true;
      b.classList.add('used');
      chosen.push(i);
      const t = document.createElement('button');
      t.className = 'tile'; t.textContent = ex.tiles[i]; t.dataset.t = i;
      t.addEventListener('click', () => {
        if (session.phase !== 'answer') return;
        chosen.splice(chosen.indexOf(i), 1);
        t.remove(); b.disabled = false; b.classList.remove('used'); sfx.tap(); update();
      });
      area.appendChild(t);
      if (ex.type === 'build') autoSpeak(ex.tiles[i]); else sfx.tap();
      update();
    }));
  }

  const EX = {
    study: {
      render(ex, body) {
        const w = ex.word || ex.sentence;
        const letter = !!ex.word && isLetter(w);
        body.innerHTML = `<div class="new-badge">${ex.sentence ? '🧩 לומדים משפט לפני שמתרגלים' : '✨ קודם מכירים, אחר כך משחקים'}</div>
          <h2 class="ex-title">${letter ? 'זאת האות ' + w.en : ex.sentence ? 'קוראים, מקשיבים ומבינים' : 'מילה חדשה בשבילכם'}</h2>
          <div class="study-card"><div class="study-emoji" aria-hidden="true">${w.emoji || '💬'}</div>
            <div class="study-word en">${letter ? bigLetter(w) : esc(w.en)}</div>
            <div class="study-meaning he">${esc(w.he)}</div>${sayHint(w)}
            ${speakBig(w.en)}
            ${letter ? `<p>זה <b>שם האות</b>. בתוך מילה הצליל יכול להשתנות.</p><p>${speakBtn(w.ex)} <bdi dir="ltr">${esc(w.ex)}</bdi> = ${esc(w.exHe)}</p>` : ''}
          </div>
          ${ex.sentence ? `<div class="tip-box">${mixed(ex.sentence.explanation || session.lesson.tip)}</div>` : '<p class="study-hint">הקשיבו וחזרו בקול. אין צורך למהר.</p>'}`;
        const button = $('#check-btn'); button.disabled = false; button.textContent = 'הכרתי, ממשיכים';
        autoSpeak(w.en);
      }
    },
    pick_image: {
      render(ex, body) {
        body.innerHTML = `${ex.isNew ? '<div class="new-badge">✨ מילה חדשה</div>' : ''}
          <h2 class="ex-title">איך אומרים "<span class="he">${esc(ex.word.he)}</span>"?</h2>
          <div class="image-grid">${ex.options.map((w, i) => `
            <button class="img-card"><span class="emo" aria-hidden="true">${w.emoji || '💬'}</span><span class="lbl en">${esc(w.en)}</span>${sayHint(w)}</button>`).join('')}
          </div>`;
        wireChoices(body, '.img-card', (i) => { setAnswer(ex.options[i].en); autoSpeak(ex.options[i].en); });
      },
      grade: (ex, a) => ({ ok: a === ex.word.en, correct: ex.word.en, correctDir: 'en', meaning: ex.word.he, words: [ex.word], word: ex.word })
    },

    mc_en_he: {
      render(ex, body) {
        const letter = isLetter(ex.word);
        body.innerHTML = `<h2 class="ex-title">${letter ? 'איך קוראים לאות הזאת?' : 'מה הפירוש?'}</h2>
          <div class="prompt-word">${speakBtn(ex.word.en)}<span class="w en ${letter ? 'letter-big' : ''}">${letter ? bigLetter(ex.word) : esc(ex.word.en)}</span>${letter ? '' : sayHint(ex.word)}</div>
          <div class="choices">${ex.options.map((w, i) => `<button class="choice"><span class="num">${i + 1}</span><span class="he">${esc(w.he)}</span></button>`).join('')}</div>`;
        wireChoices(body, '.choice', (i) => setAnswer(ex.options[i].he));
        autoSpeak(ex.word.en);
      },
      grade: (ex, a) => ({ ok: a === ex.word.he, correct: ex.word.he, correctDir: 'he', speakText: ex.word.en, words: [ex.word] })
    },

    listen_pick: {
      render(ex, body) {
        const letter = isLetter(ex.word);
        body.innerHTML = `<h2 class="ex-title">${letter ? 'איזו אות שמעתם?' : 'מה שמעתם?'}</h2>${speakBig(ex.word.en)}
          <div class="choices">${ex.options.map((w, i) => `<button class="choice"><span class="num">${i + 1}</span><span class="en ${letter ? 'letter-opt' : ''}">${letter ? bigLetter(w) : esc(w.en)}</span></button>`).join('')}</div>`;
        wireChoices(body, '.choice', (i) => setAnswer(ex.options[i].en));
        speak(ex.word.en);
      },
      grade: (ex, a) => ({ ok: a === ex.word.en, correct: ex.word.en, correctDir: 'en', meaning: ex.word.he, words: [ex.word], word: ex.word })
    },

    // Alphabet: hear a word + see its picture, pick the letter it starts with
    first_letter: {
      render(ex, body) {
        const w = ex.word;
        body.innerHTML = `<h2 class="ex-title">באיזו אות מתחילה המילה?</h2>
          <div class="prompt-word">${speakBtn(w.ex)}<span class="w"><span aria-hidden="true" style="font-size:56px">${w.emoji || ''}</span> <span class="he" style="font-size:20px;color:var(--muted)">(${esc(w.exHe)})</span></span></div>
          <p class="word-example en">${esc(w.ex)}</p><p class="study-hint">קוראים משמאל לימין. חפשו את האות הראשונה.</p>
          <div class="image-grid">${ex.options.map((o) => `
            <button class="img-card"><span class="emo en letter-card">${bigLetter(o)}</span><span class="lbl he">${esc(o.he)}</span></button>`).join('')}
          </div>`;
        wireChoices(body, '.img-card', (i) => { setAnswer(ex.options[i].en); autoSpeak(ex.options[i].en); });
        speak(w.ex);
      },
      grade: (ex, a) => ({ ok: a === ex.word.en, correct: `${ex.word.en} – ${ex.word.ex}`, correctDir: 'en', speakText: ex.word.ex, meaning: ex.word.exHe, words: [ex.word] })
    },

    // Easy words: build the word from letter tiles (c-a-t)
    spell: {
      render(ex, body) {
        const w = ex.word;
        body.innerHTML = `<h2 class="ex-title">בנו את המילה מהאותיות</h2>
          <div class="prompt-word">${speakBtn(w.en)}<span class="w"><span aria-hidden="true">${w.emoji || ''}</span> <span class="he">${esc(w.he)}</span></span>${sayHint(w)}</div>
          <div class="answer-area en spell-area" id="ans"></div>
          <div class="tile-bank en" id="bank">${ex.tiles.map((t, i) => `<button class="tile letter-tile" data-t="${i}">${esc(t)}</button>`).join('')}</div>`;
        wireTiles(body, ex);
        autoSpeak(w.en);
      },
      grade: (ex, a) => ({ ok: a === ex.word.en, correct: ex.word.en, correctDir: 'en', meaning: ex.word.he, words: [ex.word], word: ex.word })
    },

    mc_sentence: {
      render(ex, body) {
        body.innerHTML = `<h2 class="ex-title">מה הפירוש של המשפט?</h2>
          <div class="prompt-word">${speakBtn(ex.sentence.en)}<span class="w en" style="font-size:22px">${esc(ex.sentence.en)}</span></div>
          <div class="choices">${ex.options.map((s, i) => `<button class="choice"><span class="num">${i + 1}</span><span class="he">${esc(s.he)}</span></button>`).join('')}</div>`;
        wireChoices(body, '.choice', (i) => setAnswer(ex.options[i].he));
        autoSpeak(ex.sentence.en);
      },
      grade: (ex, a) => ({ ok: a === ex.sentence.he, correct: ex.sentence.he, correctDir: 'he', speakText: ex.sentence.en })
    },

    match: {
      render(ex, body) {
        const owner = session;
        const he = shuffle(ex.pairs), en = shuffle(ex.pairs);
        body.innerHTML = `<h2 class="ex-title">${ex.caseMode ? 'התאימו כל אות גדולה לאות הקטנה שלה' : 'התאימו את הזוגות'}</h2>
          <div class="match-grid">
            <div class="match-col">${he.map((w) => `<button class="match-btn ${ex.caseMode ? 'en letter-opt' : 'he'}" data-side="he" data-key="${esc(w.en)}">${esc(w.he)}</button>`).join('')}</div>
            <div class="match-col">${en.map((w) => `<button class="match-btn en" data-side="en" data-key="${esc(w.en)}">${esc(w.en)}</button>`).join('')}</div>
          </div><p id="match-status" role="status" aria-live="polite" class="study-hint">בחרו פריט מכל צד כדי ליצור זוג.</p>`;
        $('#check-btn').classList.add('hidden');
        let sel = { he: null, en: null };
        let left = ex.pairs.length;
        $$('.match-btn', body).forEach((b) => b.addEventListener('click', () => {
          if (session !== owner || session.cur !== ex || session.phase !== 'answer' || b.disabled) return;
          const side = b.dataset.side;
          if (sel[side]) sel[side].classList.remove('sel');
          sel[side] = b; b.classList.add('sel');
          if (side === 'en' || ex.caseMode) autoSpeak(b.dataset.key); else sfx.tap();
          if (sel.he && sel.en) {
            const a = sel.he, c = sel.en;
            sel = { he: null, en: null };
            const word = ex.pairs.find((w) => w.en === a.dataset.key);
            if (a.dataset.key === c.dataset.key) {
              [a, c].forEach((x) => { x.disabled = true; x.classList.remove('sel'); x.classList.add('flash-ok'); });
              sfx.match(); recordWord(word, true);
              $('#match-status').textContent = 'זוג נכון! יפה מאוד.';
              setTimeout(() => [a, c].forEach((x) => { x.classList.remove('flash-ok'); x.classList.add('done'); }), 280);
              left--;
              if (left === 0) setTimeout(() => { if (session === owner && session.cur === ex && session.phase === 'answer') showFeedback({ ok: true, pairErrors: !!ex.pairErrors }); }, 420);
            } else {
              session.mistakes++; session.combo = 0; ex.pairErrors = (ex.pairErrors || 0) + 1;
              [a, c].forEach((x) => { x.classList.remove('sel'); x.classList.add('flash-bad'); });
              sfx.wrong(); vibrate(80);
              recordWord(word, false);
              recordWord(ex.pairs.find((w) => w.en === c.dataset.key), false);
              $('#match-status').textContent = `עוד ניסיון: ${a.textContent} מתאים ל־${a.dataset.key}. טעויות הן חלק מהלמידה.`;
              save();
              setTimeout(() => [a, c].forEach((x) => x.classList.remove('flash-bad')), 450);
            }
          }
        }));
      },
      grade: () => ({ ok: true })
    },

    build: {
      render(ex, body) {
        body.innerHTML = `<h2 class="ex-title">תרגמו את המשפט</h2>${mascotSays(ex.sentence.he)}
          <div class="answer-area en" id="ans"></div>
          <div class="tile-bank en" id="bank">${ex.tiles.map((t, i) => `<button class="tile" data-t="${i}">${esc(t)}</button>`).join('')}</div>`;
        wireTiles(body, ex);
      },
      grade: (ex, a) => Object.assign(gradeText(a, ex.sentence, false), { correct: ex.sentence.en, correctDir: 'en', meaning: ex.sentence.he, word: ex.sentence })
    },

    listen_build: {
      render(ex, body) {
        body.innerHTML = `<h2 class="ex-title">הקישו את מה ששמעתם</h2>${speakBig(ex.sentence.en)}
          <div class="answer-area en" id="ans"></div>
          <div class="tile-bank en" id="bank">${ex.tiles.map((t, i) => `<button class="tile" data-t="${i}">${esc(t)}</button>`).join('')}</div>`;
        wireTiles(body, ex);
        speak(ex.sentence.en);
      },
      grade: (ex, a) => Object.assign(gradeText(a, {en:ex.sentence.en}, false), { correct: ex.sentence.en, correctDir: 'en', meaning: ex.sentence.he, word: ex.sentence })
    },

    type_word: {
      render(ex, body) {
        body.innerHTML = `<h2 class="ex-title">כתבו באנגלית</h2>
          ${mascotSays((ex.word.emoji ? ex.word.emoji + '  ' : '') + ex.word.he)}
          ${typeBox(false)}`;
        wireTyping(body);
      },
      grade: (ex, a) => Object.assign(gradeText(a, ex.word), { correct: ex.word.en, correctDir: 'en', meaning: ex.word.he, words: [ex.word] })
    },

    type_sentence: {
      render(ex, body) {
        body.innerHTML = `<h2 class="ex-title">תרגמו לאנגלית</h2>${mascotSays(ex.sentence.he)}${typeBox(true)}`;
        wireTyping(body);
      },
      grade: (ex, a) => Object.assign(gradeText(a, ex.sentence), { correct: ex.sentence.en, correctDir: 'en', meaning: ex.sentence.he })
    },

    listen_type: {
      render(ex, body) {
        body.innerHTML = `<h2 class="ex-title">כתבו את מה ששמעתם</h2>${speakBig(ex.sentence.en)}${typeBox(true)}`;
        wireTyping(body);
        speak(ex.sentence.en);
      },
      grade: (ex, a) => Object.assign(gradeText(a, {en:ex.sentence.en}), { correct: ex.sentence.en, correctDir: 'en', meaning: ex.sentence.he })
    }
  };

  // ───────────────────────── 8. Lesson session engine ─────────────────────────
  let session = null;

  function prepareLesson(lesson) {
    const exercises = genLesson(lesson);
    if (state.completed[lesson.id]) return exercises;
    const queue = lesson.words.map(word => ({ type:'study', word }));
    const introduced = new Set();
    exercises.forEach(ex => {
      if (ex.sentence && !introduced.has(ex.sentence.en)) {
        queue.push({ type:'study', sentence:ex.sentence }); introduced.add(ex.sentence.en);
      }
      queue.push(ex);
    });
    return queue;
  }

  function startSession(kind, lessonId) {
    closeModal();
    let exercises, lesson = null;
    if (kind === 'lesson') {
      if (outOfHearts()) { regenHearts(); if (outOfHearts()) return openHeartsModal(); }
      lesson = lessonById(lessonId);
      if (!lesson || lessonStatus(lesson) === 'locked') return toast('השיעור עדיין נעול. אפשר לשנות נקודת פתיחה בפרופיל.');
      exercises = prepareLesson(lesson);
    } else {
      exercises = genPractice(kind);
      if (!exercises) return toast('השלימו קודם שיעור אחד לפחות 🙂');
    }
    // Preserve practice when browser TTS is unavailable; letters have local recordings.
    exercises = exercises.map(ex => {
      const text = ex.word?.en || ex.sentence?.en;
      return /^listen/.test(ex.type) && !canSpeak(text) ? visualExercise(ex) : ex;
    });
    session = { kind, lesson, queue: exercises, total: exercises.filter(e => e.type !== 'study').length, done: 0, mistakes: 0, combo: 0, maxCombo: 0, start: Date.now(), cur: null, phase: 'answer', answer: null };
    nextExercise();
  }

  function visualExercise(ex) {
    if (ex.type === 'listen_pick' && !isLetter(ex.word)) return exEnHe(ex.word, [ex.options]);
    if (ex.type === 'listen_build') return { ...ex, type:'build' };
    if (ex.type === 'listen_type') return { ...ex, type:'type_sentence' };
    return ex;
  }

  function renderLessonShell() {
    const pct = Math.round((session.done / session.total) * 100);
    $('#app').innerHTML = `
      <div class="lesson">
        <div class="lesson-top">
          <button class="icon-btn" data-action="quit-lesson" aria-label="יציאה מהשיעור">✕</button>
          <div class="progress" role="progressbar" aria-label="התקדמות בשיעור" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
          <div class="lesson-hearts">❤️ <span id="lesson-hearts">${session.kind === 'lesson' ? heartsLabel() : '∞'}</span></div>
        </div>
        <div class="lesson-caption">${session.lesson ? mixed(session.lesson.title) : 'תרגול אישי'} · ${session.cur.type === 'study' ? 'מכירים את החומר' : `<bdi dir="ltr">${Math.min(session.done+1,session.total)} / ${session.total}</bdi>`}</div>
        <div class="combo" id="combo"></div>
        <div class="ex-body" id="ex-body"></div>
        <div class="footer" id="footer">
          <div class="fb" id="fb" role="status" aria-live="polite"></div>
          <button class="btn block primary" id="check-btn" data-action="check" disabled>בדיקה</button>
          ${/^listen/.test(session.cur.type) ? '<button class="btn ghost block" data-action="visual-exercise">אין אפשרות להקשיב כרגע</button>' : ''}
        </div>
      </div>`;
  }

  function nextExercise() {
    stopSpeech();
    if (!session.queue.length) return finishSession();
    session.cur = session.queue.shift();
    session.answer = null;
    session.phase = 'answer';
    session.numberKeys = null;
    renderLessonShell();
    window.scrollTo(0, 0);
    EX[session.cur.type].render(session.cur, $('#ex-body'));
  }

  function setAnswer(v) {
    session.answer = v;
    const btn = $('#check-btn');
    if (btn) btn.disabled = !v;
  }

  function onCheck() {
    if (session && session.cur.type === 'study') return nextExercise();
    if (!session || session.phase !== 'answer' || !session.answer) return;
    const ex = session.cur;
    const res = EX[ex.type].grade(ex, session.answer);
    (res.words || []).forEach((w) => recordWord(w, res.ok));
    showFeedback(res);
  }

  function showFeedback(res) {
    if (!session || session.phase !== 'answer') return;
    session.phase = 'feedback';
    const footer = $('#footer');
    const fb = $('#fb');
    const btn = $('#check-btn');
    btn.classList.remove('hidden');
    btn.disabled = false;
    $('#ex-body').style.pointerEvents = 'none';
    $$('#ex-body .speak-btn').forEach((b) => { b.style.pointerEvents = 'auto'; });
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();

    const ans = res.correct
      ? `<span class="ans ${res.correctDir === 'he' ? 'he' : 'en'}">${esc(res.typo ? res.expected : res.correct)}</span>`
      : '';
    const sayIt = res.speakText || (res.correctDir === 'en' ? (res.typo ? res.expected : res.correct) : null);
    const speakLink = sayIt ? `<button class="fb-speak" data-action="speak" data-text="${esc(sayIt)}" aria-label="השמעה">🔊</button>` : '';

    if (res.ok) {
      session.done++;
      if (!res.pairErrors) session.combo++;
      session.maxCombo = Math.max(session.maxCombo, session.combo);
      sfx.correct();
      footer.className = 'footer ok';
      let body = '';
      if (res.typo) body = `שימו לב לאיות: ${ans} ${speakLink}`;
      else if (res.meaning && res.correctDir === 'en') body = `${ans} ${res.word && res.word.say ? `<span class="he say-inline">(${esc(res.word.say)})</span> ` : ''}= <span class="he">${esc(res.meaning)}</span> ${speakLink}`;
      fb.innerHTML = `<div class="fb-head"><span class="badge">✓</span>${pick(PRAISE)}</div>${body ? `<div class="fb-body">${body}</div>` : ''}`;
      btn.className = 'btn block primary';
      const c = session.combo;
      if (c === 3 || c === 5 || c === 8 || c === 12) {
        const el = $('#combo');
        el.textContent = `🔥 ${c} ברצף!`;
        el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
      }
      const bar = $('.progress > i');
      if (bar) bar.style.width = Math.round((session.done / session.total) * 100) + '%';
      $('.progress').setAttribute('aria-valuenow', Math.round((session.done / session.total) * 100));
    } else {
      session.mistakes++;
      session.combo = 0;
      sfx.wrong(); vibrate(150);
      if (session.kind === 'lesson') { loseHeart(); $('#lesson-hearts').textContent = heartsLabel(); }
      footer.className = 'footer bad';
      const meaning = res.meaning && res.correctDir === 'en' ? `<div class="fb-body">פירוש: <span class="he">${esc(res.meaning)}</span></div>` : '';
      fb.innerHTML = `<div class="fb-head"><span class="badge">✕</span>${pick(WRONG)}</div>
        <div class="fb-body">התשובה הנכונה: ${ans} ${res.word && res.word.say && res.correctDir === 'en' ? `<span class="he say-inline">(${esc(res.word.say)})</span>` : ''} ${speakLink}</div>${meaning}`;
      btn.className = 'btn block red';
      // try again later in the lesson (fresh option order)
      const retry = Object.assign({}, session.cur);
      if (retry.options) retry.options = shuffle(retry.options);
      if (retry.tiles) retry.tiles = shuffle(retry.tiles);
      retry.isNew = false;
      session.queue.push(retry);
    }
    if (session.cur.type !== 'match') fb.innerHTML += `<details class="explanation" ${res.ok ? '' : 'open'}><summary>${res.ok ? 'למה זו התשובה?' : 'בואו נבין ביחד'}</summary><p>${explainAnswer(session.cur, session.answer)}</p></details>`;
    if (res.ok && res.correctDir === 'en' && session.cur.type !== 'match' && !/^listen/.test(session.cur.type)) autoSpeak(res.speakText || (res.typo ? res.expected : res.correct));
    btn.textContent = 'המשך';
    save();
  }

  function explainAnswer(ex, answer) {
    const w = ex.word, s = ex.sentence;
    if (w && isLetter(w)) {
      if (ex.type === 'first_letter') return `המילה <bdi dir="ltr">${esc(w.ex)}</bdi> מתחילה באות <bdi dir="ltr">${esc(w.en)}</bdi>. קוראים משמאל לימין. שם האות הוא ${esc(w.he)}; השם והצליל במילה אינם תמיד זהים.`;
      return `<bdi dir="ltr">${esc(w.en)}</bdi> ו־<bdi dir="ltr">${esc(w.en.toLowerCase())}</bdi> הן אותה אות, גדולה וקטנה. שם האות: <b>${esc(w.he)}</b>. לחצו על הרמקול והשוו להקראה.`;
    }
    if (w) return `<bdi dir="ltr">${esc(w.en)}</bdi> פירושו ${esc(w.he)}.${w.say ? ' עזר להגייה: ' + esc(w.say) + '.' : ''}${ex.type === 'spell' ? ` סדר האותיות הוא <bdi dir="ltr">${esc(w.en.split('').join(' · '))}</bdi>.` : ''} ${session.lesson?.unit.id === 'up' ? mixed(session.lesson.tip) : 'הקשיבו למילה, אמרו אותה בקול, ואז נסו לזכור בלי להסתכל.'}`;
    if (s?.explanation) return mixed(s.explanation);
    const n = normalize(s?.en || '');
    if (/^does /.test(n)) return 'בשאלה עם he / she / it ופועל רגיל משתמשים ב־<bdi dir="ltr">does</bdi>. הפועל שאחריו בצורת הבסיס, בלי s.';
    if (/^do /.test(n)) return 'בשאלה עם פועל רגיל ו־I / you / we / they משתמשים ב־<bdi dir="ltr">do</bdi> לפני הנושא.';
    if (/\b(?:am|is|are)\b/.test(n)) return 'משפט עם תיאור או מיקום צריך פועל: <bdi dir="ltr">I am</bdi>, <bdi dir="ltr">he/she/it is</bdi>, <bdi dir="ltr">you/we/they are</bdi>. בשאלה הפועל בא לפני הנושא. שימו לב גם למילים שמתארות את ההמשך.';
    if (/\bhas\b/.test(n)) return 'כשאומרים שיש משהו ל־he / she / it, משתמשים ב־<bdi dir="ltr">has</bdi>. עם I / you / we / they משתמשים ב־have.';
    if (/would like/.test(n)) return '<bdi dir="ltr">I would like</bdi> היא בקשה מנומסת: הייתי רוצה. מוסיפים אחריה את הדבר שרוצים.';
    return `${s ? `<bdi dir="ltr">${esc(s.en)}</bdi> = ${esc(s.he)}. ` : ''}שימו לב לסדר המילים ולמילים הקטנות כמו a, the ו־to. ${session.lesson ? mixed(session.lesson.tip) : 'אפשר לפתוח את מדריך היחידה להסבר נוסף.'}`;
  }

  function onContinue() {
    if (!session || session.phase !== 'feedback') return;
    if (session.kind === 'lesson' && outOfHearts() && session.queue.length) return renderOutOfHearts();
    nextExercise();
  }

  function finishSession() {
    const s = session;
    const isLesson = s.kind === 'lesson';
    const perfect = s.mistakes === 0;
    const xp = isLesson ? XP_LESSON + (perfect ? XP_PERFECT_BONUS : 0) : XP_PRACTICE;
    const streakBefore = currentStreak();
    const goalBefore = dailyXp() >= state.settings.dailyGoal;
    if (isLesson) {
      state.completed[s.lesson.id] = (state.completed[s.lesson.id] || 0) + 1;
      if (perfect) state.perfect[s.lesson.id] = true;
    } else {
      gainHeart();
    }
    addXp(xp);
    const streakUp = currentStreak() > streakBefore;
    const goalNow = !goalBefore && dailyXp() >= state.settings.dailyGoal;
    const newAch = checkAchievements();
    save();
    sfx.finish();
    confetti();

    const secs = Math.round((Date.now() - s.start) / 1000);
    const time = `${Math.floor(secs / 60)}:${pad2(secs % 60)}`;
    const accuracy = Math.round((100 * s.total) / (s.total + s.mistakes));
    $('#app').innerHTML = `
      <div class="result">
        <div class="hero">${perfect ? '🏆' : '🎉'}</div>
        <h1>${isLesson ? 'השיעור הושלם!' : 'האימון הושלם!'}</h1>
        ${perfect ? '<div class="perfect">💯 שיעור מושלם – בלי אף טעות!</div>' : ''}
        ${!isLesson ? '<div class="perfect">❤️ הרווחתם לב!</div>' : ''}
        <div class="result-stats">
          <div class="r-stat" style="--c:var(--gold)"><div class="h">XP</div><div class="v en">+${xp}</div></div>
          <div class="r-stat" style="--c:var(--green)"><div class="h">דיוק</div><div class="v">${accuracy}%</div></div>
          <div class="r-stat" style="--c:var(--blue)"><div class="h">זמן</div><div class="v en">${time}</div></div>
        </div>
        ${streakUp ? `<div class="card" style="width:100%">🔥 <b>רצף של ${currentStreak()} ${currentStreak() === 1 ? 'יום' : 'ימים'}!</b> תחזרו מחר כדי לשמור עליו.</div>` : ''}
        ${goalNow ? '<div class="card" style="width:100%">🎯 <b>עמדתם ביעד היומי!</b></div>' : ''}
        ${newAch.map((a) => `<div class="card" style="width:100%">${a.icon} <b>הישג חדש: ${esc(a.title)}</b> – ${esc(a.desc)}</div>`).join('')}
        <button class="btn primary" data-action="finish-continue">המשך</button>
      </div>`;
    session = null;
    stopSpeech();
  }

  function renderOutOfHearts() {
    session.phase = 'nohearts';
    $('#app').innerHTML = `
      <div class="result">
        <div class="hero">💔</div>
        <h1 style="color:var(--red)">נגמרו הלבבות</h1>
        <p style="color:var(--muted)">לב חדש יגיע בעוד ${minutesToNextHeart()} דקות.<br>בינתיים אפשר לתרגל ולהרוויח לב, או להמשיך עם לבבות ללא הגבלה.</p>
        ${reviewLessons().length ? '<button class="btn blue" data-action="practice" data-kind="weak">🧠 תרגול להרווחת לב</button>' : ''}
        <button class="btn gold" data-action="unlimited-continue">♾️ לבבות ללא הגבלה</button>
        <button class="btn ghost" data-action="quit-now">חזרה למסלול</button>
      </div>`;
  }

  function confetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#3DBE5B', '#2FA8F0', '#FFB703', '#F25A8C', '#A066F0', '#FF8A3D'];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = pick(colors);
      c.style.animationDuration = 1.8 + Math.random() * 1.8 + 's';
      c.style.animationDelay = Math.random() * 0.4 + 's';
      c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4200);
    }
  }

  // ───────────────────────── 9. Screens ─────────────────────────
  let view = 'path';
  let wordFilter = '';
  let installPrompt = null;

  function topbarHTML() {
    const st = currentStreak();
    return `<header class="topbar">
      <div class="brand"><span class="logo" aria-hidden="true">${MASCOT}</span><span class="name">יאללה אינגליש</span></div>
      <div class="stats">
        <button class="stat streak ${doneToday() ? '' : 'off'}" data-action="streak-info" aria-label="רצף ימים">🔥 ${st}</button>
        <button class="stat xp" data-action="nav" data-view="profile" aria-label="נקודות">⭐ ${state.xp}</button>
        <button class="stat hearts" data-action="hearts-info" aria-label="לבבות">❤️ ${heartsLabel()}</button>
      </div>
    </header>`;
  }
  function navHTML() {
    const tabs = [['path', '🏠', 'מסלול'], ['practice', '🎯', 'תרגול'], ['words', '📖', 'מילים'], ['profile', '👤', 'פרופיל']];
    return `<nav class="bottom-nav">${tabs.map(([id, ico, label]) => `
      <button class="nav-btn ${view === id ? 'active' : ''}" ${view === id ? 'aria-current="page"' : ''} data-action="nav" data-view="${id}"><span class="ico">${ico}</span>${label}</button>`).join('')}</nav>`;
  }

  function pathHTML() {
    const current = LESSONS[currentLessonIndex()];
    const level = LEVELS.find(x => x.id === state.levelId) || LEVELS[0];
    const dashboard = `<section class="learning-home"><div class="home-eyebrow">קצת בכל יום. הרבה עם הזמן.</div>
      <div class="home-heading"><div><h1>${doneToday() ? 'עוד צעד קטן קדימה?' : 'יאללה, זמן לאנגלית!'}</h1><p>המסלול שלכם · ${esc(level.title)}</p></div><span aria-hidden="true">🦊</span></div>
      <div class="daily-track"><span>🎯 היעד היומי</span><bdi dir="ltr">${dailyXp()} / ${state.settings.dailyGoal} XP</bdi></div>
      <div class="daily-bar"><i style="width:${Math.min(100,dailyXp()/state.settings.dailyGoal*100)}%"></i></div>
      ${current ? `<button class="btn primary block" data-action="open-lesson" data-id="${current.id}">ממשיכים: ${mixed(current.title)} <span aria-hidden="true">←</span></button>` : '<p>🎉 הגעתם לסוף המסלול שבחרתם. עכשיו מחזקים וזוכרים!</p>'}
      <div class="home-links"><button data-action="choose-level">התאמת רמה</button><button data-action="alphabet-guide">🔊 שמות האותיות</button></div>
      ${reviewLessons().length ? `<button class="review-link" data-action="practice" data-kind="due">🧠 ${dueWords().length ? dueWords().length + ' פריטים לחזרה היום' : 'הכול טרי בזיכרון — אפשר לתרגל עוד'}</button>` : ''}
    </section>`;
    const offs = [0, -50, -76, -50, 0, 50, 76, 50];
    let k = 0;
    const units = COURSE.units.map((u, ui) => {
      const nodes = u.lessons.map((raw) => {
        const l = lessonById(raw.id);
        const st = lessonStatus(l);
        const off = offs[k++ % offs.length];
        return `<div class="node-wrap" style="--off:${off}px">
          ${st === 'current' ? '<div class="start-bubble">התחילו!</div>' : ''}
          <button class="node ${st}" data-action="open-lesson" data-id="${l.id}" aria-label="${esc(l.title)}">${st === 'locked' ? '🔒' : l.icon}</button>
          <div class="node-label">${mixed(l.title)}${st === 'available' ? '<small>זמין לחזרה</small>' : ''}</div>
        </div>`;
      }).join('');
      return `<section class="unit" style="--uc:${u.color};--ucd:${shade(u.color, -0.25)}">
        <div class="unit-banner">
          <div><div class="label">יחידה ${ui + 1}</div><h2>${esc(u.title)}</h2><p>${esc(u.desc)}</p></div>
          <button class="guide-btn" data-action="unit-guide" data-unit="${u.id}">📖 מדריך</button>
        </div>
        <div class="nodes">${nodes}</div>
      </section>`;
    }).join('');
    const end = lessonsDone() === LESSONS.length
      ? '<div class="course-end"><div class="big">👑</div>סיימתם את כל הקורס! אפשר לחזור על שיעורים ולתרגל.</div>'
      : '<div class="course-end"><div class="big">🚧</div>עוד יחידות בדרך...</div>';
    return dashboard + '<h2 class="path-heading">המסע שלכם</h2>' + units + end;
  }

  function practiceHTML() {
    const has = reviewLessons().length > 0;
    const card = (ico, title, desc, kind) => `<div class="card practice-card">
        <div class="big-ico">${ico}</div>
        <div class="body"><h3>${title}</h3><p>${desc}</p>
          <button class="btn ${has ? 'blue' : ''} block" data-action="practice" data-kind="${kind}" ${has ? '' : 'disabled'}>${has ? 'התחילו · <bdi dir="ltr">+10 XP +❤️</bdi>' : 'השלימו שיעור ראשון'}</button>
        </div></div>`;
    const heartsMsg = state.settings.unlimitedHearts
      ? 'לבבות ללא הגבלה מופעלים.'
      : state.hearts >= MAX_HEARTS ? 'הלבבות מלאים!' : `לב חדש בעוד ${minutesToNextHeart()} דקות. כל תרגול מוסיף לב.`;
    return `<h1 class="screen-title">תרגול</h1>
      <div class="card"><h3>❤️ <bdi dir="ltr">${heartsLabel()} / ${MAX_HEARTS}</bdi></h3><p style="margin:0">${heartsMsg} בתרגול לא מאבדים לבבות.</p></div>
      ${card('🗓️', 'חזרה בזמן הנכון', dueWords().length ? `${dueWords().length} פריטים שהגיע הזמן לחזק. קודם נתרגל את מה שצריך חזרה.` : 'חזרות קצרות לאורך זמן עוזרות לזכור. אפשר גם לתרגל מעבר לחזרה המתוכננת.', 'due')}
      ${card('🧠', 'חיזוק מילים', 'תרגול של המילים שהכי קשות לכם', 'weak')}
      ${card('🎧', 'תרגול הקשבה', 'שומעים אנגלית ומבינים – משפטים ומילים', 'listen')}
      ${card('✍️', 'בנייה וכתיבה', 'מתחילים עם אריחים; בהמשך כותבים בעצמכם', 'write')}
      <button class="btn block" data-action="alphabet-guide">🔊 מדריך האותיות וההגייה</button>`;
  }

  function wordsHTML() {
    const ls = learnedLessons();
    if (!ls.length) {
      return `<h1 class="screen-title">המילים שלי</h1><div class="empty"><div class="big">📖</div>כאן יופיעו המילים שלמדתם.<br>השלימו שיעור ראשון כדי להתחיל!</div>`;
    }
    const f = wordFilter.trim().toLowerCase();
    const total = learnedWords().length;
    const shown = new Set();
    const groups = ls.map((l) => {
      const ws = l.words.filter((w) => { const key = wordKey(w); if (shown.has(key)) return false; shown.add(key); return !f || w.en.toLowerCase().includes(f) || w.he.replace(/[\u0591-\u05c7]/g,'').includes(f.replace(/[\u0591-\u05c7]/g,'')); });
      if (!ws.length) return '';
      return `<div class="word-group-title">${l.icon} ${esc(l.title)}</div>` + ws.map((w) => `
        <div class="word-row">
          <span class="emo" aria-hidden="true">${w.emoji || '💬'}</span>
          <div class="txt"><div class="w-en en">${esc(w.en)}</div><div class="w-he">${esc(w.he)}${w.say ? ' · ' + esc(w.say) : ''}${w.ex ? ' · <bdi dir="ltr">' + esc(w.ex) + '</bdi> = ' + esc(w.exHe) : ''}</div></div>
          <div class="strength" title="חוזק"><i style="width:${Math.round(wordStrength(w) * 100)}%"></i></div>
          <button class="speak-sm" data-action="speak" data-text="${esc(w.en)}" aria-label="השמעה">🔊</button>
        </div>`).join('');
    }).join('');
    return `<h1 class="screen-title">המילים שלי <span style="color:var(--muted);font-size:16px">(${total})</span></h1>
      <input class="search" id="word-search" type="search" aria-label="חיפוש מילים בעברית או באנגלית" placeholder="🔍 חיפוש בעברית או באנגלית" value="${esc(wordFilter)}">
      <div id="word-list">${groups || '<div class="empty">לא נמצאו מילים</div>'}</div>`;
  }

  function profileHTML() {
    const goal = state.settings.dailyGoal;
    const today = dailyXp();
    const r = 32, circ = 2 * Math.PI * r;
    const frac = Math.min(1, today / goal);
    const statBox = (ico, num, lbl) => `<div class="stat-box"><span class="ico">${ico}</span><div><div class="num">${num}</div><div class="lbl">${lbl}</div></div></div>`;
    const sw = (key, title, desc) => `<label class="setting"><div><div class="s-title">${title}</div>${desc ? `<div class="s-desc">${desc}</div>` : ''}</div>
      <span class="switch"><input type="checkbox" data-setting="${key}" ${state.settings[key] ? 'checked' : ''}><span class="track"></span></span></label>`;
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const install = standalone ? '' : `<div class="card"><h3>📲 התקנה בטלפון</h3>
      ${installPrompt ? '<p>התקינו את האפליקציה למסך הבית – תיפתח כמו אפליקציה רגילה ותעבוד גם בלי אינטרנט.</p><button class="btn primary block" data-action="install">התקינו עכשיו</button>'
        : isIOS ? '<p>באייפון: פתחו ב-Safari, לחצו על כפתור השיתוף <b>⬆️</b> ובחרו <b>"הוסף למסך הבית"</b>.</p>'
          : '<p>באנדרואיד: בתפריט של Chrome (<b>⋮</b>) בחרו <b>"התקנת אפליקציה"</b> או <b>"הוספה למסך הבית"</b>.</p>'}</div>`;
    return `<h1 class="screen-title">פרופיל</h1>
      <div class="stat-grid">
        ${statBox('🔥', currentStreak(), 'ימי רצף')}
        ${statBox('⭐', state.xp, 'סה"כ XP')}
        ${statBox('✅', `${lessonsDone()}/${LESSONS.length}`, 'שיעורים')}
        ${statBox('🧠', vocabularyCount(), 'מילים שונות (ללא אותיות)')}
        ${statBox('🏅', state.bestStreak, 'שיא רצף')}
        ${statBox('🏆', `${state.achievements.length}/${ACHIEVEMENTS.length}`, 'הישגים')}
      </div>
      <div class="card"><h3>🧭 נקודת הפתיחה שלכם</h3><p>${esc((LEVELS.find(x => x.id === state.levelId) || LEVELS[0]).title)}. אפשר לשנות בכל רגע; השיעורים שהשלמתם נשמרים.</p><button class="btn blue block" data-action="choose-level">בחירת רמה או בדיקה קצרה</button></div>
      <div class="card">
        <div class="goal-row">
          <svg class="ring" viewBox="0 0 76 76" aria-hidden="true"><circle class="bg" cx="38" cy="38" r="${r}"/>
            <circle class="fg" cx="38" cy="38" r="${r}" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - frac)}" transform="rotate(-90 38 38)"/></svg>
          <div><h3>🎯 יעד יומי</h3><p style="margin:0"><bdi dir="ltr">${today} / ${goal} XP</bdi> היום ${today >= goal ? '– הושלם! 🎉' : ''}</p></div>
        </div>
        <div class="chips" style="margin-top:12px">${[10, 20, 30, 50].map((g) => `<button class="chip ${g === goal ? 'active' : ''}" data-action="set-goal" data-goal="${g}"><bdi dir="ltr">${g} XP</bdi></button>`).join('')}</div>
      </div>
      ${install}
      <div class="card"><h3>🏆 הישגים</h3><div class="ach-grid" style="margin-top:10px">
        ${ACHIEVEMENTS.map((a) => `<div class="ach ${state.achievements.includes(a.id) ? '' : 'locked'}"><div class="ico">${a.icon}</div><div class="t">${esc(a.title)}</div><div class="d">${esc(a.desc)}</div></div>`).join('')}
      </div></div>
      <div class="card"><h3>🗣️ הקול שמקריא את האנגלית</h3>
        <p>אותו קול בכל השיעורים, בתרגול ובבדיקת השמע. אפשר להחליף בכל רגע.</p>
        <div class="voice-options">${window.YallaAudio.voices().map(v => `<div class="voice-option ${state.settings.voice === v.key ? 'active' : ''}">
          <button class="chip ${state.settings.voice === v.key ? 'active' : ''}" data-action="set-voice" data-voice="${esc(v.key)}" aria-pressed="${state.settings.voice === v.key}">${esc(v.label)}</button>
          <button class="speak-sm" data-action="preview-voice" data-voice="${esc(v.key)}" aria-label="השמעת דוגמה של ${esc(v.label)}">🔊</button>
          ${v.complete ? '' : `<span class="s-desc">בהכנה: <bdi dir="ltr">${v.count}/${v.total}</bdi> הקלטות</span>`}
        </div>`).join('')}</div>
      </div>
      <div class="card"><h3>⚙️ הגדרות</h3>
        ${sw('sound', 'צלילים', 'צליל לתשובה נכונה ושגויה')}
        ${sw('autoSpeak', 'הקראה אוטומטית', 'להשמיע את המילים באנגלית אוטומטית')}
        ${sw('deviceVoice', 'קול המכשיר כשאין הקלטה', 'כבוי כברירת מחדל. אם מפעילים, תושמע הקראה ממוחשבת רק בפריטים שטרם הוקלטו; האיכות תלויה במכשיר.')}
        ${sw('vibrate', 'רטט', 'רטט בטלפון כשטועים')}
        ${sw('unlimitedHearts', 'לבבות ללא הגבלה', 'ללמוד בלי לחץ – הטעויות לא עולות לבבות')}
        <div class="setting"><div class="s-title">ערכת צבעים</div>
          <div class="chips">${[['auto', 'אוטומטי'], ['light', 'בהיר'], ['dark', 'כהה']].map(([k, l]) => `<button class="chip ${state.settings.theme === k ? 'active' : ''}" data-action="set-theme" data-theme="${k}">${l}</button>`).join('')}</div>
        </div>
      </div>
      <div class="card"><h3>💾 ההתקדמות שלכם</h3><p>נשמרת בדפדפן ובמכשיר הזה. הורידו גיבוי כדי להעביר למכשיר אחר.</p><div class="actions"><button class="btn block" data-action="export-progress">הורדת גיבוי</button><button class="btn block" data-action="import-progress">שחזור מגיבוי</button><input id="progress-file" class="hidden" type="file" accept=".json,application/json"></div></div>
      <div class="card"><h3>🔊 בדיקת שמע ועדכונים</h3><p>גרסה <bdi dir="ltr">${window.YALLA_BUILD.version}</bdi></p><p>משהו נשמע לא נכון? אפשר לבדוק כל אות, מילה ומשפט ולשמור דו״ח מסודר.</p><div class="actions"><a class="btn block" href="audio-review.html">פתיחת בדיקת השמע</a><a class="btn block" href="audio-credits.html">מקורות ההקלטות</a><button class="btn block" data-check-update>בדיקת עדכון</button></div><p data-update-status role="status"></p></div>
      <button class="btn block" style="color:var(--red)" data-action="reset">איפוס התקדמות</button>`;
  }

  const SCREENS = { path: pathHTML, practice: practiceHTML, words: wordsHTML, profile: profileHTML };

  function render() {
    regenHearts();
    applyTheme();
    if (session) return;
    $('#app').innerHTML = topbarHTML() + `<main class="screen">${SCREENS[view]()}</main>` + navHTML();
    $('#progress-file')?.addEventListener('change', importProgress);
    const search = $('#word-search');
    if (search) search.addEventListener('input', () => {
      wordFilter = search.value;
      const html = wordsHTML();
      const tmp = document.createElement('div'); tmp.innerHTML = html;
      $('#word-list').innerHTML = $('#word-list', tmp).innerHTML;
    });
    if (!state.welcomed && !$('#modal-root').innerHTML) openWelcome();
  }
  /** First-launch screen for complete beginners */
  function openWelcome() {
    openModal(`<div style="font-size:64px;text-align:center">${MASCOT}</div>
      <h2 style="text-align:center">ברוכים הבאים ליאללה אינגליש!</h2>
      <p class="sub" style="text-align:center">כאן לומדים אנגלית מאפס – גם אם אף פעם לא למדתם.</p>
      <div class="tip-box">
        <b>1. האותיות</b> – קודם לומדים את האותיות באנגלית ואיך הן נשמעות.<br>
        <b>2. מילים קלות</b> – מילים קצרות שקל לקרוא ולכתוב, כמו <bdi dir="ltr">cat</bdi> ו-<bdi dir="ltr">dog</bdi>.<br>
        <b>3. משפטים</b> – לאט לאט בונים משפטים ומדברים.
      </div>
      <div class="tip-box">🔊 לחצו על 🔊 כדי לשמוע הקלטה, ועל 🐢 כדי לשמוע לאט. כל האנגלית מוקראת בקול אחיד; אפשר לבחור קול נשי או גברי בפרופיל.</div>
      <div class="tip-box">⏱️ מספיק 5–10 דקות ביום. כל יום שלומדים מגדיל את הרצף 🔥</div>
      <div class="actions"><button class="btn primary block" data-action="choose-level">בוחרים מאיפה להתחיל</button><button class="btn ghost block" data-action="set-level" data-level="zero">להתחיל מאפס</button></div>`);
  }
  function applyTheme() {
    const t = state.settings.theme;
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
  }

  function openLevelPicker() {
    openModal(`<div class="sheet-eyebrow">המסלול שמתאים לכם</div><h2>כמה אנגלית כבר מכירים?</h2>
      <p class="sub">בחרו נקודת פתיחה. תמיד אפשר לחזור לבסיס או לשנות בחירה.</p>
      <button class="btn blue block" data-action="placement-start">🧭 עזרו לי לבחור · בדיקה קצרה</button>
      <div class="level-list">${LEVELS.map(level => `<button class="level-option ${state.levelId === level.id ? 'selected' : ''}" data-action="set-level" data-level="${level.id}"><span class="level-icon">${level.icon}</span><span><strong>${esc(level.title)}</strong><small>${esc(level.desc)}</small></span><span aria-hidden="true">←</span></button>`).join('')}</div>
      <p class="study-hint">הרמות הן נקודות פתיחה בתוך האפליקציה. התוכן כרגע עוסק ביסודות ובשיחות בסיסיות, ולא מהווה קורס מלא עד רמה מתקדמת.</p>
      <button class="btn ghost block" data-action="close-modal">חזרה</button>`);
  }
  function setLevel(id) {
    const level = LEVELS.find(x => x.id === id);
    if (!level) return;
    state.levelId = id; state.startLessonId = level.start; state.welcomed = true;
    save(); placement = null; closeModal(); view = 'path'; render(); window.scrollTo(0,0);
    toast('נקודת הפתיחה עודכנה. ההתקדמות הקיימת נשמרה.');
  }
  let placement = null;
  function placementLevel(answers) {
    let gates = 0;
    for (let gate = 0; gate < 6; gate++) {
      const questions = window.PLACEMENT_QUESTIONS.map((q,i) => ({q,i})).filter(x => x.q.gate === gate);
      if (!questions.every(({q,i}) => answers[i] === q.answer)) break;
      gates++;
    }
    return LEVELS[gates];
  }
  function renderPlacement() {
    const questions = window.PLACEMENT_QUESTIONS;
    if (placement.index >= questions.length) {
      const level = placementLevel(placement.answers);
      const correct = questions.filter((q,i) => q.answer === placement.answers[i]).length;
      return openModal(`<div class="placement-hero">🧭</div><h2>נקודת הפתיחה המוצעת</h2><div class="tip-box"><h3>${esc(level.title)}</h3><p>${esc(level.desc)}</p></div>
        <p>עניתם נכון על ${correct} מתוך ${questions.length}. ההמלצה מתחילה בשלב הראשון שזקוק לחיזוק, גם אם הצלחתם בשאלות קשות יותר.</p>
        <p class="sub">זו בדיקת היכרות קצרה בקריאה ובהבנה. היא אינה מבחן רשמי ולא בודקת דיבור או הגייה.</p>
        <button class="btn primary block" data-action="set-level" data-level="${level.id}">מתחילים כאן</button><button class="btn ghost block" data-action="choose-level">לבחור נקודה אחרת</button>`);
    }
    const q = questions[placement.index];
    openModal(`<div class="sheet-eyebrow">בדיקת היכרות · ${placement.index+1} מתוך ${questions.length}</div><h2>${mixed(q.prompt)}</h2>
      <p class="sub">בלי לבבות ובלי לחץ. אם לא יודעים, פשוט מסמנים.</p>
      <div class="choices placement-options">${q.options.map((answer,i) => `<button class="choice" data-action="placement-answer" data-option="${i}">${mixed(answer)}</button>`).join('')}</div>
      <button class="btn ghost block" data-action="placement-answer" data-option="-1">עוד לא יודעים</button>
      <button class="btn ghost block" data-action="choose-level">יציאה מהבדיקה</button>`);
  }
  function answerPlacement(option) {
    if (!placement || placement.feedback) return;
    const q = window.PLACEMENT_QUESTIONS[placement.index];
    const answer = q.options[option] || null;
    placement.answers.push(answer); placement.feedback = true;
    openModal(`<div class="sheet-eyebrow">${answer === q.answer ? '✓ נכון!' : 'לומדים גם מהניסיון הזה'}</div>
      <h2>${mixed(q.answer)}</h2><div class="tip-box">${mixed(q.explanation)}</div>
      <button class="btn primary block" data-action="placement-next">המשך</button>`);
  }
  function openAlphabetGuide() {
    const letters = ALL_WORDS.filter(isLetter);
    openModal(`<h2>🔊 שמות האותיות</h2><p class="sub">לחצו כדי לשמוע את שם האות. A = אֵיי, E = אִי, I = אַיי, F = אֶף. שם האות והצליל שלה בתוך מילה הם דברים שונים.</p>
      <div class="alphabet-grid" dir="ltr">${letters.map(w => `<button class="letter-listen" data-action="speak" data-text="${w.en}" aria-label="האות ${w.en} — ${esc(w.he)}"><strong>${bigLetter(w)}</strong><span class="he">${esc(w.he)}</span><span aria-hidden="true">🔊</span></button>`).join('')}</div>
      <div class="tip-box">לקריאה ממשיכים אל ״מילים ראשונות״ ו״סודות הקריאה״: צלילי תנועות, SH, CH, TH, EE, EA, OO וה־E השקטה. ההגייה בעברית משוערת; ההקראה באנגלית היא הדוגמה.</div><button class="btn block" data-action="close-modal">סגירה</button>`);
  }
  function exportProgress() {
    const blob = new Blob([JSON.stringify({app:'yalla-english',version:2,state},null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = `yalla-english-${todayStr()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  let pendingImport = null;
  async function importProgress(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 2000000) throw new Error('Too large');
      const payload = JSON.parse(await file.text());
      if (payload.app !== 'yalla-english' || payload.version !== 2 || !payload.state) throw new Error('Wrong format');
      pendingImport = cleanState(payload.state);
      openModal(`<h2>שחזור ההתקדמות</h2><p>בגיבוי יש ${Object.keys(pendingImport.completed).length} שיעורים שהושלמו ו־${pendingImport.xp} נקודות. השחזור יחליף את ההתקדמות במכשיר הזה.</p>
        <button class="btn block" data-action="export-progress">קודם להוריד גיבוי של המצב הנוכחי</button><div class="actions"><button class="btn primary block" data-action="restore-progress">שחזור הגיבוי שנבחר</button><button class="btn ghost block" data-action="close-modal">ביטול</button></div>`);
    } catch (error) { pendingImport = null; toast('זה לא קובץ גיבוי תקין של יאללה אינגליש.'); }
    e.target.value = '';
  }

  // Modals & toasts
  let modalReturnFocus = null;
  function openModal(html) {
    if (!$('#modal-root').innerHTML) modalReturnFocus = document.activeElement;
    $('#modal-root').innerHTML = `<div class="modal-backdrop" data-action="backdrop"><div class="sheet" role="dialog" aria-modal="true" aria-label="מידע ואפשרויות" tabindex="-1">${html}</div></div>`;
    $('#app').inert = true;
    $('.sheet').focus();
  }
  function closeModal() {
    $('#modal-root').innerHTML = ''; $('#app').inert = false;
    if (modalReturnFocus?.isConnected) modalReturnFocus.focus({preventScroll:true});
    modalReturnFocus = null;
  }
  function toast(text) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = text;
    $('#toast-root').appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  function openLessonModal(id) {
    const l = lessonById(id);
    const st = lessonStatus(l);
    if (st === 'locked') {
      return openModal(`<h2>🔒 ${esc(l.title)}</h2><p class="sub">השלימו את השיעורים הקודמים כדי לפתוח את השיעור הזה.</p>
        <div class="actions"><button class="btn block" data-action="close-modal">הבנתי</button></div>`);
    }
    const times = state.completed[l.id] || 0;
    openModal(`<div style="font-size:48px">${l.icon}</div>
      <h2>${mixed(l.title)}</h2>
      <p class="sub">יחידה ${l.unitIndex + 1} · שיעור ${l.indexInUnit + 1} ${times ? `· הושלם ${times}× ${state.perfect[l.id] ? '💯' : ''}` : ''}</p>
      <div class="tip-box"><b>💡 טיפ:</b> ${mixed(l.tip)}</div>
      <div class="chips" style="margin-top:12px">${l.words.map((w) => `<button class="chip en" data-action="speak" data-text="${esc(w.en)}">${w.emoji || ''} ${esc(w.en)}</button>`).join('')}</div>
      <div class="actions">
        <button class="btn primary block" data-action="start-lesson" data-id="${l.id}">${times ? 'תרגלו שוב' : 'התחילו'} <bdi dir="ltr">+${XP_LESSON} XP</bdi></button>
        <button class="btn ghost block" data-action="close-modal">לא עכשיו</button>
      </div>`);
  }

  function openUnitGuide(unitId) {
    const u = COURSE.units.find((x) => x.id === unitId);
    openModal(`<h2>📖 ${esc(u.title)}</h2><p class="sub">${esc(u.desc)}</p>
      ${u.lessons.map((l) => `<h3 style="margin:18px 0 4px">${l.icon} ${esc(l.title)}</h3>
        <div class="tip-box">${mixed(l.tip)}</div>
        ${l.words.map((w) => `<div class="word-row"><span class="emo">${w.emoji || '💬'}</span>
          <div class="txt"><div class="w-en en">${esc(w.en)}</div><div class="w-he">${esc(w.he)}${w.say ? ' · ' + esc(w.say) : ''}${w.ex ? ' · ' + esc(w.ex) + ' = ' + esc(w.exHe) : ''}</div></div>
          <button class="speak-sm" data-action="speak" data-text="${esc(w.en)}" aria-label="השמעה">🔊</button></div>`).join('')}`).join('')}
      <div class="actions"><button class="btn block" data-action="close-modal">סגירה</button></div>`);
  }

  function openHeartsModal() {
    regenHearts();
    const msg = state.settings.unlimitedHearts ? 'לבבות ללא הגבלה מופעלים – אפשר ללמוד בלי לחץ.'
      : state.hearts >= MAX_HEARTS ? 'יש לכם את כל הלבבות! כל טעות בשיעור עולה לב אחד.'
        : `לב חדש בעוד ${minutesToNextHeart()} דקות. כל תרגול מחזיר לב אחד.`;
    openModal(`<h2>❤️ <bdi dir="ltr">${heartsLabel()} / ${MAX_HEARTS}</bdi></h2><p class="sub">${msg}</p>
      <div class="actions">
        ${state.hearts < MAX_HEARTS && !state.settings.unlimitedHearts ? `<button class="btn blue block" data-action="practice" data-kind="weak" ${lessonsDone() ? '' : 'disabled'}>🧠 תרגול להרווחת לב</button>
        <button class="btn gold block" data-action="toggle-unlimited">♾️ לבבות ללא הגבלה</button>` : ''}
        <button class="btn block" data-action="close-modal">סגירה</button>
      </div>`);
  }

  function openStreakModal() {
    const st = currentStreak();
    openModal(`<div style="font-size:56px">🔥</div><h2>רצף של ${st} ${st === 1 ? 'יום' : 'ימים'}</h2>
      <p class="sub">${doneToday() ? 'כל הכבוד, למדתם היום! תחזרו מחר כדי להאריך את הרצף.' : 'השלימו שיעור היום כדי לשמור על הרצף!'}</p>
      <div class="tip-box">שיא רצף: <b>${state.bestStreak}</b> · היום: <b><bdi dir="ltr">${dailyXp()} / ${state.settings.dailyGoal} XP</bdi></b></div>
      <div class="actions"><button class="btn primary block" data-action="close-modal">יאללה!</button></div>`);
  }

  // ───────────────────────── 10. Events, PWA, boot ─────────────────────────
  const ACTIONS = {
    'choose-level': () => { placement = null; openLevelPicker(); },
    'set-level': d => setLevel(d.level),
    'placement-start': () => { placement = {index:0,answers:[],feedback:false}; renderPlacement(); },
    'placement-answer': d => answerPlacement(Number(d.option)),
    'placement-next': () => { if (placement?.feedback) { placement.index++; placement.feedback = false; renderPlacement(); } },
    'alphabet-guide': openAlphabetGuide,
    'export-progress': exportProgress,
    'import-progress': () => $('#progress-file').click(),
    'restore-progress': () => { if (pendingImport) { state = pendingImport; pendingImport = null; save(); closeModal(); render(); toast('ההתקדמות שוחזרה'); } },
    'visual-exercise': () => {
      if (!session || session.phase !== 'answer') return;
      const ex = session.cur;
      session.queue.unshift(ex.type === 'listen_pick' ? exEnHe(ex.word,[ex.options]) : visualExercise(ex));
      nextExercise();
    },
    nav: (d) => { view = d.view; closeModal(); render(); window.scrollTo(0, 0); },
    'open-lesson': (d) => openLessonModal(d.id),
    'start-lesson': (d) => startSession('lesson', d.id),
    practice: (d) => { if (!reviewLessons().length) return toast('השלימו שיעור ראשון או בחרו נקודת פתיחה מתאימה.'); closeModal(); session = null; startSession(d.kind); },
    'unit-guide': (d) => openUnitGuide(d.unit),
    'close-modal': closeModal,
    'welcome-done': () => { state.welcomed = true; save(); closeModal(); speak('Hello!'); },
    backdrop: (d, e) => { if (e.target.classList.contains('modal-backdrop')) closeModal(); },
    speak: (d) => speak(d.text, !!d.slow),
    check: () => { if (session && session.phase === 'feedback') onContinue(); else onCheck(); },
    'quit-lesson': () => openModal(`<div style="font-size:52px">${MASCOT}</div><h2>רגע, לא לוותר!</h2>
        <p class="sub">אם תצאו עכשיו, ההתקדמות בשיעור הזה תאבד.</p>
        <div class="actions"><button class="btn primary block" data-action="close-modal">להמשיך ללמוד</button>
        <button class="btn ghost block" style="color:var(--red)" data-action="quit-now">לצאת</button></div>`),
    'quit-now': () => { closeModal(); session = null; stopSpeech(); view = 'path'; render(); },
    'finish-continue': () => {
      view = 'path'; render();
    },
    'unlimited-continue': () => { state.settings.unlimitedHearts = true; save(); toast('♾️ לבבות ללא הגבלה הופעלו'); nextExercise(); },
    'toggle-unlimited': () => { state.settings.unlimitedHearts = true; save(); closeModal(); toast('♾️ לבבות ללא הגבלה הופעלו'); render(); },
    'hearts-info': openHeartsModal,
    'streak-info': openStreakModal,
    'set-goal': (d) => { state.settings.dailyGoal = +d.goal; save(); render(); },
    'set-theme': (d) => { state.settings.theme = d.theme; save(); render(); },
    'set-voice': (d) => {
      state.settings.voice = window.YallaAudio.setVoice(d.voice);
      save(); render();
      const v = window.YallaAudio.voices().find(x => x.key === state.settings.voice);
      toast(v ? 'הקול הוחלף: ' + v.label : 'הקול לא זמין');
      speak('Hello');
    },
    'preview-voice': (d) => {
      window.YallaAudio.play('Hello', { voice: d.voice, onError: () => toast('הדוגמה של הקול הזה עדיין לא הוקלטה.') });
    },
    install: async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      try { await installPrompt.userChoice; } catch (e) { /* ignore */ }
      installPrompt = null; render();
    },
    reset: () => openModal(`<h2>⚠️ איפוס התקדמות</h2><p class="sub">כל השיעורים, ה-XP והרצף יימחקו. אי אפשר לבטל את זה.</p>
        <div class="actions"><button class="btn red block" data-action="reset-confirm">כן, למחוק הכל</button>
        <button class="btn block" data-action="close-modal">ביטול</button></div>`),
    'reset-confirm': () => {
      state = clone(DEFAULT_STATE); state.heartsTs = Date.now(); save(); closeModal(); view = 'path'; render(); toast('ההתקדמות אופסה');
    }
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const fn = ACTIONS[el.dataset.action];
    if (fn) fn(el.dataset, e);
  });
  document.addEventListener('change', (e) => {
    const key = e.target.dataset && e.target.dataset.setting;
    if (!key) return;
    state.settings[key] = e.target.checked;
    save();
    if (key === 'unlimitedHearts') render();
  });
  document.addEventListener('keydown', (e) => {
    if ($('#modal-root').innerHTML) {
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key === 'Tab') {
        const focusable = $$('.sheet button:not(:disabled), .sheet input, .sheet [href]');
        const first = focusable[0], last = focusable[focusable.length-1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === $('.sheet'))) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
      return;
    }
    if (!session) return;
    const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement && document.activeElement.tagName);
    if (e.key === 'Enter' && !typing) {
      e.preventDefault();
      if (session.phase === 'feedback') onContinue(); else onCheck();
    } else if (!typing && session.phase === 'answer' && session.numberKeys && /^[1-9]$/.test(e.key)) {
      const b = session.numberKeys[+e.key - 1];
      if (b) b.click();
    }
  });
  // Refresh hearts/streak when returning to the app
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopSpeech(); else if (!session && !$('#modal-root').innerHTML) render(); });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e;
    if (view === 'profile' && !session) render();
  });

  // Debug hook for testing in the browser console: __yalla.session, __yalla.state
  window.__yalla = { get session() { return session; }, get state() { return state; }, LESSONS, normalize, gradeText, genLesson, genPractice, prepareLesson, cleanState, placementLevel, lessonStatus, currentLessonIndex, wordKey, recordWord, learnedWords, dueWords, vocabularyCount, visualExercise };

  render();
})();
