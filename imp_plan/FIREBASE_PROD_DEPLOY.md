# Firebase Production Deploy Playbook

Last updated: 2026-03-17

Project:
- Firebase project id: `kidtracks-e50ac`
- Hosting target: `production`

## One-command deploy

```powershell
npm run deploy:prod
```

This will:
1. Build frontend (`vite build` -> `dist/`)
2. Deploy Hosting (`hosting:production`)
3. Deploy Cloud Functions (`functions`)

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
firebase deploy --project kidtracks-e50ac --only hosting:production,functions
```

## Pre-deploy checklist

1. `npm run build` passes
2. `npm run test:e2e` passes (recommended for release)
3. Correct Firebase project is active:

```powershell
firebase use kidtracks-e50ac
```

## Post-deploy verification

1. Open production URL and hard refresh:
   - `https://kidtracks-e50ac.web.app`
2. Verify login and parent dashboard
3. Check function logs:

```powershell
firebase functions:log --project kidtracks-e50ac --limit 100
```
