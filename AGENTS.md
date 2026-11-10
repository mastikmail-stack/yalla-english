# Shared app, stable URL

- Continue this application and repository. Do not create a replacement Site,
  Claude artifact, repository or download as the default delivery.
- Repository: https://github.com/mastikmail-stack/yalla-english
- Stable app URL: https://mastikmail-stack.github.io/yalla-english/
- Read HANDOFF.md and the current audio report before edits. Preserve lesson IDs,
  localStorage compatibility and the original Claude implementation history.
- Runtime changes require matching versions in js/version.js, version.json and
  sw.js. Add new offline assets to the worker. Never clear learner storage to update.
- Run review/checks.cjs, review/audio-checks.cjs and review/worker-checks.cjs before
  publication. The Pages workflow publishes main only after these pass.
- Do not equate file hashes, successful playback or automatic transcription with
  correct human-audited pronunciation. Do not regenerate robotic letter audio.
- Preserve source, author, license, modification notes and hashes for human audio.
  Missing or mismatched recordings must not be silently substituted with another word.
- Keep incident recordings, user backups, local test results and credentials out
  of Git and the published runtime. The build uses an explicit runtime allowlist.
- User-authorized updates go to this same GitHub Pages URL unless the user
  explicitly requests local-only work or no deployment.
