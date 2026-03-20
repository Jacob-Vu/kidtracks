# Firebase Dev Environment Separation Setup

Date: 2026-03-20

## Goal
Use a dedicated Firebase project for development so local/dev deploys do not affect production (`kidstrack-71632`).

## 1) Configure projects
- Production project id: `kidstrack-71632`
- Development project id: `kidtracks-e50ac`
- Ensure both projects have required products: Auth, Firestore, Functions, Hosting, Analytics (optional in dev).

## 2) Update `.firebaserc`
File: `.firebaserc`

Confirm aliases:
- `default` -> `kidstrack-71632`
- `dev` -> `kidtracks-e50ac`

## 3) Configure environment files
Create local env files from templates:

```powershell
Copy-Item .env.development.local.example .env.development.local
Copy-Item .env.production.local.example .env.production.local
```

Then fill values:
- `.env.development.local` -> dev Firebase app config
- `.env.production.local` -> production Firebase app config

Important:
- Keep `VITE_ALLOW_PROD_IN_DEV=false` in development.
- Do not keep Firebase config only in `.env.local` because it applies to all modes.

## 4) Commands
Dev deploy commands:

```powershell
npm run deploy:dev
npm run deploy:dev:hosting
npm run deploy:dev:functions
```

Prod deploy commands:

```powershell
npm run deploy:prod
npm run deploy:prod:hosting
npm run deploy:prod:functions
```

## 5) Safety checks
- Local dev server (`npm run dev`) now throws an error if it detects production project id and `VITE_ALLOW_PROD_IN_DEV` is not set to `true`.
- This is intentional to prevent accidental writes to production during development.

## 6) Recommended workflow
1. Build/test features against dev Firebase project.
2. Validate flows on dev hosting URL.
3. Promote to production only through `deploy:prod*` scripts.
