# HANDOFF — Yalla English (current, 2026-11-10)

Read this file before editing. Current release: 2026.11.10.6 (ElevenLabs narration in two voices). Read AUDIO_QA_REPORT_HE.md and CLAUDE_ELEVENLABS_HANDOFF_HE.md for the latest user decision. REVIEW_REPORT_HE.md describes the earlier curriculum review. Original backups exist locally only and are excluded from Git.

## Product and constraints

English from Hebrew, mobile first (375px, also verify 320px). Intended both for an adult starting from zero literacy in English and for learners who already know some English. Keep Hebrew RTL, plural imperative, safe escaping, large touch targets, accessible controls, and isolated English text. Preserve the fox identity; do not copy Duolingo artwork.

The app is static HTML/CSS/classic JavaScript, with no framework, npm or build requirement. Keep it that way unless explicitly requested otherwise. Existing lesson IDs and localStorage key yallaEnglish.v1 MUST remain compatible. Do not treat choice of a level as course completion or award XP for skipped lessons.

## Run and deliver

- Double-click index.html, or run start-local.cmd and open http://127.0.0.1:8766/.
- Install/offline support requires HTTP(S), with localhost accepted for development. Phones require HTTPS hosting for PWA installation; a LAN HTTP URL is only a basic preview.
- Deploy the entire app together, including audio/letters, js/learning.js, js/audio.js and css/learning.css.
- Shared repository: https://github.com/mastikmail-stack/yalla-english
- Permanent Pages URL: https://mastikmail-stack.github.io/yalla-english/
- Push authorized updates to the same main branch. The Pages workflow runs all three check scripts, copies the runtime allowlist to site-dist, and publishes only after success. Never deliver a new artifact/link by default.

## Files and load order

1. js/data.js — original 28 lessons, corrected starter phrases and selected tips. window.COURSE.
2. js/learning.js — inserts 4 phonics lessons (up) and 4 grammar lessons (uf), sets explicit unit.stage, defines LEARNING_LEVELS and PLACEMENT_QUESTIONS.
3. js/voice-audio.js (generated) + js/audio.js — selected-voice text -> MP3 map; stops previous playback, suppresses stale events, never crosses voices.
4. js/app.js — course indexing, validated local state, audio orchestration, grading, lesson generators/renderers, sessions, UI and events.
5. css/style.css + css/learning.css — original styles plus current learning UI and accessibility improvements.
6. audio/letters/*.wav + manifest.json — 26 human letter-name recordings, IPA reference, provenance and hashes.
7. sw.js — yalla-english-2026.11.10.4, coherent cache-first shell including all current recordings.
8. review/checks.cjs, review/audio-checks.cjs, review/worker-checks.cjs — Node regression checks.
9. audio/voices/<bella|eric>/*.mp3 + manifest.json — the narration (425 items per voice). js/human-audio.js, audio/human and audio/letters are earlier recordings kept for provenance only; they are not loaded or cached.
10. audio-review.html — review of all 425 audio items, exportable results. No automatic human approval.
11. js/version.js, version.json, js/updates.js — visible build, explicit update application without deleting learner data.
12. audio/production/utterances.json — exact recording brief (425 items). review/generate-elevenlabs.cjs produces it per voice; review/voices.config.json holds voice/model/settings and per-letter overrides chosen by ear; review/build-voice-map.cjs regenerates js/voice-audio.js and the sw.js audio list.

## Current curriculum

9 units x 4 lessons = 36 lessons; 272 word/letter entries (including repeated vocabulary), 181 sentences/phrases. This is a foundations/basic conversation course, not a complete CEFR-certified A1–C2 curriculum.

Order: ua (letters), ub (short words), up (phonics), u1 (introductions), uf (sentence foundations), u2 (daily life), u3 (verbs/questions), u4 (town), u5 (basic conversations).

Phonics lessons cover SH/CH, voiced/unvoiced TH, EE/EA/OO with exceptions, and silent E with cap/cape, kit/kite, not/note, have/give. Hebrew pronunciation is approximate; do not present it as phonetic transcription.

Grammar lessons cover am/is/are, a/an/the (based on sound), plurals/adjective order, have/has, in/on/under and simple present do/does. Original time/conversation units still teach some expressions as chunks; they are not a systematic course in every tense.

Each unit has stage: letters, starter, guided, or independent. Generators MUST use stage, not numerical unit indices; inserting units must not accidentally introduce early typing. Every lesson word must appear as a target. First completion includes study cards before testing each new word and sentence. Study cards do not earn XP, inflate graded exercise counts or record mastery.

All original lesson IDs remain unchanged. Original progress survives. Newly inserted bridge lessons may become the next uncompleted lesson; users can choose a later starting point without losing completions.

## Audio: ElevenLabs narration (critical regression area)

All playback goes through YallaAudio in js/audio.js (lessons, practice, profile preview and audio-review.html). Two voices, both ElevenLabs premade voices: bella (Bella, female, default) and eric (Eric, male). The choice is settings.voice in yallaEnglish.v1 and is chosen in Profile; switching stops playback. Each voice has 425/425 items as MP3 (mp3_44100_64), about 5 MB per voice; both are precached by sw.js for offline use.

A missing item in the selected voice reports missing-recording. It never plays the other voice or the old human/letter files. Single capital letters (A–Z and the pronoun I) never use the device speech engine. The device voice stays opt-in (settings.deviceVoice) for non-letter text only.

Letter names: the default text sent is "X." (full stop, so it is read as a name). Human listening on 2026-11-10 found G/H/I/W/Y misread on their own, so the generator sends Gee./Aitch./Eye./Double-you./Why. for those. G (both voices) and Z, W (Eric) were then chosen by ear from alternative takes and are pinned as overrides in review/voices.config.json (G = "G." on eleven_multilingual_v2). Never reintroduce browser TTS aliases for letters. Do not regenerate the 26 letters without a new listening pass.

File names include the first 8 hex chars of the content hash (<assetId>-<sha8>.mp3). A replaced take therefore gets a new URL, and audio-review.html treats a mark as valid only for the exact file that was heard. Review results are stored per build AND per voice.

To regenerate: set ELEVENLABS_API_KEY in the environment (never in the repo or chat), then node review/generate-elevenlabs.cjs [--voice bella|eric] [--only letter|word|sentence] [--ids ...] [--force]. It is resumable and skips items whose file, hash, text and model match. Afterwards bump the version (js/version.js, version.json, sw.js CACHE). audio-checks.cjs refuses to pass unless both voices are complete (ALLOW_INCOMPLETE_VOICES=1 only for local work).

Human listening status (owner, 2026-11-10): all 26 letters in Bella and in Eric (after the chosen takes). Words and sentences have NOT been listened to yet. A valid hashed MP3 is not a pronunciation check.

## State and progress

State remains under yallaEnglish.v1. cleanState validates nested data, preserves known completed IDs and settings, and fills new defaults. Existing unlimited-hearts preference is preserved; new users default to unlimited hearts.

New fields: startLessonId, levelId. Earlier skipped lessons have available status, not done. Current lesson searches from the chosen starting point. Completed counts/XP/achievements reflect only actual completions. reviewLessons includes completed and self-declared familiar earlier lessons; learnedWords includes actual completed content only. Explain that distinction if changing UI copy.

wordStats keys are normal English words, or letter:X for alphabet items. A letter is identified by its example-word metadata, never just an uppercase regex. Old letter counts are migrated when possible; legacy I statistics cannot be reliably separated retrospectively, since the previous version used the same key for both meanings.

wordStats records c, w, box, due, reviewed. Successful retrieval advances the box at most once per local day, using intervals 1/3/7/14/30 days. A mistake resets the box and schedules review in 10 minutes. This is a simple product heuristic, not an experimentally calibrated personalized learning model. due practice prioritizes overdue items; when all are fresh it still permits additional practice.

Backup format: {app:'yalla-english', version:2, state}. JSON import limits size, validates the envelope, sanitizes state, previews the replacement and requires an in-app restore click. Export uses a local Blob download. No accounts or cloud sync. There is one learner per browser storage context. In-progress session state is not restored after closing/reloading; completed-course progress is.

## Placement

Seven self-select start points and a 12-item routing check (6 gates, 2 questions per gate). placementLevel requires consecutive passed gates, so guessing advanced items cannot skip an early gap. The check measures basic recognition/reading, not standardized overall proficiency or pronunciation. It awards no XP/hearts/mastery and only changes the start when accepted. Advanced labels must keep the explicit explanation that an advanced course is not yet available.

## Grading and sessions

normalize handles case, punctuation and configured contractions. gradeText accepts declared alternatives, one small unknown-token typo in a word of length >=4, but rejects known different words and common grammar-form changes. It is not a comprehensive dictionary or an AI grader; extend alternatives based on real valid answers.

Translation exercises may accept semantic alternatives. Listening transcription only accepts the canonical spoken sentence (plus normalization/typing tolerance); do not accept synonyms as if they were heard. Homophone groups are excluded from listening distractors.

Match pairs are unique, immediately disabled on success, and timer callbacks are guarded by session/exercise identity. Wrong matches count toward mistakes and prevent a perfect bonus but do not cost hearts. Tile-bank buttons are actually disabled when used and re-enabled on removal. Incorrect graded exercises rejoin the queue. No-hearts practice cannot abandon a session when no practice content exists.

Explanations are authored templates and lesson tips, displayed after errors or expandable after correct answers. They are not individualized model-generated diagnoses. Study cards display sentence explanations where available. Keep explanations factually appropriate to the item.

Modals make the app background inert, trap keyboard focus, and restore it on close. Feedback/toasts announce updates. Reduced-motion preferences disable animations/confetti. Keep all interpolated content escaped; mixed() must isolate English before escaping so apostrophes and punctuation remain inside the English span.

## PWA update contract

CACHE = yalla-english-2026.11.10.6. Cache-first keeps runtime versions together. A waiting worker activates only after the explicit update button or after old tabs close. The button posts ACTIVATE_UPDATE; controllerchange reloads that tab. No silent lesson interruption. Delete only cache names starting with yalla-english-. Never substitute HTML for missing JS/CSS/audio or intercept foreign origins.

After runtime edits, bump CACHE, js/version.js and version.json together, and include new runtime files in FILES. Profile has version/check-update controls. Never clear site storage as an update procedure: that deletes progress.

## Verification completed in this review

- node review/checks.cjs: 16 groups; 100 generations x 36 lessons; target coverage, early typing, canonical/alternative answers, grammar errors, tile multiplicities, practice boundaries, legacy state, level routing, review timing, audio mapping/hash checks and RTL escaping.
- node review/worker-checks.cjs: simulated offline routing, cached audio, missing media, navigation fallback and unrelated-cache preservation.
- Browser at 375x812: full alphabet lesson with intentional choice and matching errors -> 88%, 10 XP, no perfect bonus; a full SH/CH lesson -> 100%, 15 XP.
- All 12 placement questions with an intentional phonics gap -> conservative recommendation; accepting it preserved XP/completions.
- Light/dark, dictionary search, persistence on reload; no horizontal overflow in the path at widths 320/375/768.
- Downloaded a backup, inspected JSON, imported it through the file chooser and confirmed restore -> 2 completed lessons, 25 XP, matching level and settings.
- Stopped the local HTTP server, reloaded the app successfully and loaded A/E recordings without audio errors from the service-worker cache.
- The localhost preview contains test progress only. The user's other browser/device progress was not edited.

Before broad release: actual iPhone/Android installation and audio listening, teacher review of curriculum/translations, and real learner trials. Two completed sample lessons and generator tests are not proof of teaching effectiveness or full browser/device coverage.

## Prioritized next work

See REVIEW_REPORT_HE.md for full findings. Prioritize human phonetics QA, stable audio for words/sentences, more accepted answer variants, session resume, unit mastery checks, richer A1/A2 curriculum and dialogues. Later: microphone exercises with consent and fallback, multi-user accounts/cloud sync, stories, social features and reminders. Do not describe these as implemented yet.
