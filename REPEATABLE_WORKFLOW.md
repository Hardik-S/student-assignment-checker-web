# Repeatable Student Project Web-App Workflow

Use this checklist when turning a small student repo into a clean, deployable web app.

## 1. Clarify The Target

- Confirm the new GitHub owner.
- Confirm public vs private.
- Confirm the new repo name.
- Decide whether to preserve commit history or create clean history.
- Confirm attribution wording.
- Confirm deployment account or team.
- Decide whether to deploy as-is or improve the UI first.
- Check for secrets, real student data, private school material, or API keys.

## 2. Preflight The Local Environment

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\hshre\.codex\scripts\github-deploy-preflight.ps1 -TargetPath . -TargetProject Hardik-S/<new-repo-name> -AttemptsUsed 0
gh auth status
gh api user
git ls-remote <source-repo-url> HEAD
```

If the active folder is dirty or linked to a different deployment project, use a clean sibling folder.

## 3. Clean Import

```powershell
git clone --depth 1 <source-repo-url> <new-folder>
Remove-Item -LiteralPath <new-folder>\.git -Recurse -Force
```

Before deleting `.git`, verify the resolved path is inside the new folder.

## 4. Preserve The Original Work

- Move original CLI/scripts/docs into `legacy/`.
- Keep the original README as `legacy/README.original.md`.
- Add source attribution in the new README.
- If the source has no license, say that plainly.

## 5. Build The Web Surface

For small tools, a static Vite app is usually enough:

```powershell
npm install
npm run dev
```

Keep secrets out of browser code. If AI feedback or private APIs are needed, add a serverless function and configure environment variables in Vercel.

## 6. Verify Before Publishing

```powershell
npm test
npm run lint
npm run build
git diff --check
```

Also open the local app and verify:

- first screen is not blank
- no framework error overlay
- no relevant console errors
- primary interaction works
- mobile layout is usable

## 7. Publish To GitHub

```powershell
git init
git branch -M main
git add .
git commit -m "Create web assignment checker"
gh repo create Hardik-S/<new-repo-name> --public --source . --remote origin --push
```

Use `--private` instead if secrets, personal data, or sensitive project logic are present.

## 8. Deploy To Vercel

```powershell
vercel link --yes --project <new-repo-name>
vercel --prod --yes
```

If Vercel infers an invalid name from a Windows folder path, link explicitly with the lowercase project slug.

## 9. Final Handoff

Record:

- GitHub URL
- Vercel production URL
- exact verification commands
- any deployment blockers
- files the student should read first
