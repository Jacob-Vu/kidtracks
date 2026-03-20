# Firebase Production Deploy Playbook

Last updated: 2026-03-20

Project:
- Firebase project id: `kidstrack-71632`
- Hosting target: `production`

Dev environment:
- Use separate Firebase project alias: `dev`
- Setup guide: `docs/firebase-dev-environment-setup.md`

## One-command deploy

```powershell
npm run deploy:prod
```

This will:
1. Build frontend (`vite build --mode production` -> `dist/`)
2. Deploy Hosting (`hosting:production`)
3. Deploy Cloud Functions (`functions`)

Important:
- Do not use dev deploy commands for release.
- Use mode-specific env files (`.env.production.local`, `.env.development.local`) to avoid cross-environment config leakage.

## Split deploy commands

```powershell
# Only Hosting
npm run deploy:prod:hosting

# Only Functions
npm run deploy:prod:functions
```

## If Firebase CLI times out because of local proxy

Some environments set these vars to `http://127.0.0.1:9`, which causes Firebase CLI timeout.

Use this session-only bypass before deploy:

```powershell
$env:HTTP_PROXY=""
$env:HTTPS_PROXY=""
$env:ALL_PROXY=""
firebase deploy --project kidstrack-71632 --only hosting:production,functions
```

## Pre-deploy checklist

1. `npm run build:prod` passes
2. `npm run test:e2e` passes (recommended for release)
3. Correct Firebase project is active:

```powershell
firebase use kidstrack-71632
```

## Post-deploy verification

1. Open production URL and hard refresh:
   - `https://kidstrack-71632.web.app`
2. Verify login and parent dashboard
3. Check function logs:

```powershell
firebase functions:log --project kidstrack-71632 --limit 100
```
