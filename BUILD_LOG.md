# Build Log

Project: `Hardik-S/student-assignment-checker-web`
Source: `https://github.com/samman41/student--assignment-checker`
Started: 2026-06-24
Operator: Codex on Hardik's local Windows workspace

## Decisions

- New owner: `Hardik-S`
- New repo visibility: public
- New repo name: `student-assignment-checker-web`
- Import style: clean history, not source commit history
- Attribution: source repository credited in `README.md`
- Deployment target: Hardik's Vercel account/team
- UI plan: preserve the original Python CLI in `legacy/`, add a browser-first interface, and include a `Modern` / `Legacy CLI` toggle
- Secrets plan: do not expose Anthropic or other API keys in the browser; keep AI feedback only in the preserved CLI until a backend is added

## Actions

1. Ran GitHub/deploy preflight from the active `Nepal` workspace.
   - Result: `auth-ok,dirty-worktree`
   - Reason for isolation: the active workspace had unrelated dirty files and an existing Vercel project link.
2. Confirmed the source repository was reachable with `git ls-remote`.
3. Confirmed `Hardik-S/student-assignment-checker-web` did not already exist.
4. Cloned the source into a sibling folder:
   ```powershell
   git clone --depth 1 https://github.com/samman41/student--assignment-checker.git C:\Users\hshre\OneDrive\Documents\42 - Agents\Codex\May\student-assignment-checker-web
   ```
5. Removed only the imported `.git` directory to start clean history.
6. Moved original project files into `legacy/`.
7. Added a Vite + React + TypeScript web app.
8. Ported the original rule checks into browser-side TypeScript.
9. Added `README.md`, `BUILD_LOG.md`, and `REPEATABLE_WORKFLOW.md`.
10. Installed dependencies with `npm install`.
11. Updated Vite, the Vite React plugin, and Vitest to remove dev-server advisories reported by `npm audit`.
12. Ran local Browser QA at `http://127.0.0.1:5187`.
13. Initialized a fresh git repository on `main`.

## Verification Log

- `npm test` -> passed, 1 test file / 5 tests.
- `npm run lint` -> passed.
- `npm run build` -> passed, Vite production build generated `dist/`.
- `npm audit --audit-level=moderate` -> passed, 0 vulnerabilities.
- Browser desktop QA -> passed:
  - page title: `Assignment Checker`
  - URL: `http://127.0.0.1:5187/`
  - console warnings/errors: none
  - `Run checks` regenerated the report JSON
  - `Legacy CLI` toggle displayed the preserved Python command
  - returning to `Modern` restored the checker workspace
- Browser mobile QA at `390x844` -> passed:
  - no horizontal overflow
  - topbar, run button, and results were visible
  - console warnings/errors: none

## Deployment Log

- GitHub repo created and pushed:
  - `https://github.com/Hardik-S/student-assignment-checker-web`
  - initial commit: `159029d`
- Vercel link:
  ```powershell
  vercel link --yes --project student-assignment-checker-web --scope batb4016-9101s-projects
  ```
- Vercel production deploy:
  ```powershell
  vercel --prod --yes --scope batb4016-9101s-projects
  ```
- Initial CLI deployment ID: `dpl_DcGZqoNaL6cTL5Dv1Q6vfmpWVq5R`
- Production alias: `https://student-assignment-checker-web.vercel.app`
- Verification:
  - `vercel inspect https://student-assignment-checker-web.vercel.app --scope batb4016-9101s-projects` -> status `Ready`
  - `Invoke-WebRequest https://student-assignment-checker-web.vercel.app` -> HTTP `200`, expected page title found
- Note: after GitHub was connected, each push to `main` created a new Vercel production deployment ID. Treat the alias as the stable student-facing URL and run `vercel inspect` when the exact current deployment ID matters.
