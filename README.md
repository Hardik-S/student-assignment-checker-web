# Assignment Checker Web

Interactive web version of a student assignment checker. It runs a first-pass review for word count, required sections, APA-style citations, text similarity, and simple grammar heuristics.

## Source Attribution

This project is a clean-history web adaptation of [`samman41/student--assignment-checker`](https://github.com/samman41/student--assignment-checker), imported on 2026-06-24. The original Python CLI files are preserved in [`legacy/`](legacy/).

No license file was present in the source repository at import time. Treat this as an educational adaptation and get the original author's permission before using or redistributing the original code beyond this project context.

## Web App

- Paste or load a `.txt` assignment.
- Edit the rubric JSON in the browser.
- Paste or load reference submissions for similarity checks.
- Export the generated report as JSON.
- Toggle to **Legacy CLI** to see the original Python workflow.

The browser app does not call the Anthropic API because this repository is public and client-side secrets would be exposed. The original optional AI feedback path remains in `legacy/assignment_checker.py`.

## Local Development

```powershell
npm install
npm run dev
```

## Verification

```powershell
npm test
npm run lint
npm run build
```

## Deploy

This app is configured as a static Vite app and deploys cleanly to Vercel.

```powershell
vercel link --yes --project student-assignment-checker-web
vercel --prod --yes
```

Live URL: _added after deployment_

## Repeatable Build Notes

See [`BUILD_LOG.md`](BUILD_LOG.md) for the exact build log from this conversion and [`REPEATABLE_WORKFLOW.md`](REPEATABLE_WORKFLOW.md) for a reusable checklist for future student projects.
