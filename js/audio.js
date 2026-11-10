/* One immutable file per letter; cancel stale play promises during fast tapping. */
(function () {
  'use strict';
  const files = Object.freeze(Object.fromEntries('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => [letter, 'audio/letters/' + letter + '.wav'])));
  let current = null;
  let generation = 0;
  function stop() {
    generation++;
    if (current) { current.pause(); current.currentTime = 0; current = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
  function playRecording(file, slow, onError, onEnd, onStart) {
    stop();
    const ticket = generation;
    const audio = new Audio(file);
    current = audio;
    audio.playbackRate = slow ? 0.75 : 1;
    audio.preservesPitch = true;
    let reported = false;
    const fail = () => { if (ticket === generation && !reported) { reported = true; onError?.(); } };
    audio.onerror = fail;
    audio.onended = () => { if (ticket === generation) onEnd?.(); };
    audio.onplaying = () => { if (ticket === generation) onStart?.({engine:'human-recording', file}); };
    try { audio.play().catch(fail); } catch (e) { fail(); }
    return true;
  }
  function playLetter(letter, slow, onError, onEnd, onStart) {
    if (!Object.hasOwn(files, letter)) { stop(); return false; }
    return playRecording(files[letter], slow, onError, onEnd, onStart);
  }
  const normalize = text => String(text).trim().toLowerCase().replace(/[.!?,]+$/g,'');
  function recording(text) {
    if (/^[A-Z]$/.test(text)) return files[text];
    return window.YALLA_HUMAN_AUDIO?.[normalize(text)]?.file || null;
  }
  function voice() {
    const voices = window.speechSynthesis?.getVoices().filter(v => /^en[-_]/i.test(v.lang)) || [];
    const prefer = /Google US English|Samantha|Aria|Jenny|Ava|Allison|Zira|Google UK English Female/i;
    return voices.find(v => prefer.test(v.name)) || voices.find(v => /en[-_]US/i.test(v.lang)) || voices[0] || null;
  }
  function play(text, {slow=false, allowDeviceVoice=false, onError, onEnd, onStart} = {}) {
    if (typeof text !== 'string' || !text.trim()) { stop(); return false; }
    const file = recording(text);
    if (file) return playRecording(file, slow, () => onError?.('recording'), onEnd, onStart);
    stop();
    if (!allowDeviceVoice) { onError?.('missing-recording'); return false; }
    const selected = voice();
    if (!selected) { onError?.('voice'); return false; }
    const ticket = generation;
    try {
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = selected.lang;
      utterance.voice = selected;
      utterance.rate = slow ? 0.55 : 0.9;
      let reported = false;
      utterance.onstart = () => { if (ticket === generation) onStart?.({engine:'speechSynthesis', voice:selected.name, lang:selected.lang}); };
      utterance.onend = () => { if (ticket === generation) onEnd?.(); };
      utterance.onerror = e => {
        if (ticket === generation && !reported && !['canceled','interrupted'].includes(e.error)) { reported = true; onError?.('speech'); }
      };
      window.speechSynthesis.speak(utterance);
      return true;
    } catch { onError?.('speech'); return false; }
  }
  window.YallaAudio = Object.freeze({ files, stop, playLetter, play, voice, recording });
})();
