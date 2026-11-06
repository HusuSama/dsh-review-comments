# Demo media

- `demo.gif` — 900 px / 10 fps GIF of `demo.mp4`, embedded in the top-level README so it
  plays inline on GitHub (GitHub does not play repository MP4 files inline in Markdown).
- `demo.mp4` — the original 25.75 s recording (2.6 MB); GitHub shows a video player when the
  blob is opened.

## Want a better inline player?

GitHub renders **user-attachment** videos inline in Markdown, but repo-relative MP4 paths and
`<video>` tags are stripped/not played. For the best quality:

1. Open a new issue/PR/discussion comment in this repository and drag `demo.mp4` into it.
2. Copy the generated `https://github.com/user-attachments/assets/...` URL.
3. Replace the GIF line in the README with that URL on its own line (GitHub then shows a
   native video player).

The GIF keeps the README self-contained and always renders.
