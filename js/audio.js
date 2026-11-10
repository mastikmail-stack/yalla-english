/*
 * Shared playback engine for lessons and the audio review page.
 * Recordings come from the selected ElevenLabs voice (js/voice-audio.js). A missing item is
 * reported as missing: it never silently plays the other voice or an older recording set.
 * The device's speech engine is used only when the caller passes allowDeviceVoice (opt-in).
 * Stale play promises/events are cancelled during fast tapping.
 */
(function () {
  'use strict';
  const VOICES = window.YALLA_VOICES || { default: null, voices: [], files: {} };
  let voiceKey = VOICES.default;
  let current = null;
  let generation = 0;

  function stop() {
    generation++;
    if (current) { current.pause(); current.currentTime = 0; current = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
  const normalize = text => String(text).trim().toLowerCase().replace(/[.!?,]+$/g, '');
  const keyOf = text => /^[A-Z]$/.test(text) ? text : normalize(text);

  /** Voices that exist in this build: [{key,label,gender,count,total,complete}] */
  const voices = () => VOICES.voices.slice();
  const currentVoice = () => voiceKey;
  function setVoice(key) {
    if (!Object.hasOwn(VOICES.files, key) || key === voiceKey) return voiceKey;
    stop();
    voiceKey = key;
    return voiceKey;
  }
  function recording(text, key = voiceKey) {
    if (typeof text !== 'string') return null;
    return VOICES.files[key]?.[keyOf(text)] || null;
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
    audio.onplaying = () => { if (ticket === generation) onStart?.({ engine: 'voice-recording', voice: voiceKey, file }); };
    try { audio.play().catch(fail); } catch (e) { fail(); }
    return true;
  }
  function playLetter(letter, slow, onError, onEnd, onStart) {
    const file = /^[A-Z]$/.test(letter) ? recording(letter) : null;
    if (!file) { stop(); return false; }
    return playRecording(file, slow, onError, onEnd, onStart);
  }
  function voice() {
    const list = window.speechSynthesis?.getVoices().filter(v => /^en[-_]/i.test(v.lang)) || [];
    const prefer = /Google US English|Samantha|Aria|Jenny|Ava|Allison|Zira|Google UK English Female/i;
    return list.find(v => prefer.test(v.name)) || list.find(v => /en[-_]US/i.test(v.lang)) || list[0] || null;
  }
  /** options.voice plays one item in a specific voice (profile preview) without changing the selection. */
  function play(text, { slow = false, allowDeviceVoice = false, voice: only = null, onError, onEnd, onStart } = {}) {
    if (typeof text !== 'string' || !text.trim()) { stop(); return false; }
    const file = recording(text, only || voiceKey);
    if (file) return playRecording(file, slow, () => onError?.('recording'), onEnd, onStart);
    stop();
    // Letter names are never guessed by a speech engine (it confuses A/E/I/F).
    if (!allowDeviceVoice || only || /^[A-Z]$/.test(text)) { onError?.('missing-recording'); return false; }
    const selected = voice();
    if (!selected) { onError?.('voice'); return false; }
    const ticket = generation;
    try {
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = selected.lang;
      utterance.voice = selected;
      utterance.rate = slow ? 0.55 : 0.9;
      let reported = false;
      utterance.onstart = () => { if (ticket === generation) onStart?.({ engine: 'speechSynthesis', voice: selected.name, lang: selected.lang }); };
      utterance.onend = () => { if (ticket === generation) onEnd?.(); };
      utterance.onerror = e => {
        if (ticket === generation && !reported && !['canceled', 'interrupted'].includes(e.error)) { reported = true; onError?.('speech'); }
      };
      window.speechSynthesis.speak(utterance);
      return true;
    } catch { onError?.('speech'); return false; }
  }
  window.YallaAudio = Object.freeze({ stop, playLetter, play, voice, recording, voices, currentVoice, setVoice });
})();
