/* All actual curriculum utterances, deduplicated by meaning/type, with provenance. */
(function () {
  'use strict';
  const entries = new Map();
  function add(type, text, meaning, hint, lesson) {
    const id = type + ':' + text;
    if (!entries.has(id)) entries.set(id, {id, type, text, meaning, hint:hint || '', lessons:[]});
    if (!entries.get(id).lessons.some(l => l.id === lesson.id)) entries.get(id).lessons.push({id:lesson.id,title:lesson.title});
  }
  for (const unit of window.COURSE.units) for (const lesson of unit.lessons) {
    for (const word of lesson.words) {
      add(word.ex ? 'letter' : 'word', word.en, word.he, word.ex ? word.he : word.say, lesson);
      if (word.ex) add('word', word.ex, word.exHe, '', lesson);
    }
    for (const sentence of lesson.sentences) add('sentence', sentence.en, sentence.he, '', lesson);
  }
  window.YALLA_AUDIO_CATALOG = Object.freeze(Array.from(entries.values()).map(Object.freeze));
})();
