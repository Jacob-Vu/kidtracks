# Walkthrough: i18n (Vietnamese + English)

## What Was Done
Added bilingual support across the entire KidsTrack app:

### New Files
| File | Purpose |
|---|---|
| [en.js](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/i18n/en.js) | ~170 English translation strings |
| [vi.js](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/i18n/vi.js) | ~170 Vietnamese translation strings |
| [I18nContext.jsx](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/i18n/I18nContext.jsx) | React context with [useT()](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/i18n/I18nContext.jsx#34-40) + [useLang()](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/i18n/I18nContext.jsx#41-47) hooks |

### Translated Pages (all 10)
[Login](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/pages/Login.jsx#9-170) · [App](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/App.jsx#120-123) (nav + loading) · [Dashboard](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/pages/Dashboard.jsx#9-64) · [Templates](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/pages/Templates.jsx#8-231) · [DailyView](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/pages/DailyView.jsx#15-336) · [Ledger](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/pages/Ledger.jsx#10-149) · [KidDashboard](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/pages/KidDashboard.jsx#10-168) · [KidProfile](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/pages/KidProfile.jsx#11-134) · [KidLayout](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/layouts/KidLayout.jsx#8-53) · [KidAccountModal](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/components/KidAccountModal.jsx#12-126)

### Language Switcher
- **Parent sidebar** — bottom, next to sign-out
- **Kid sidebar** — bottom, next to log-out
- **Login page** — top-right corner of login card
- Persists in `localStorage` (key: `kidstrack-lang`)
- Default: Vietnamese 🇻🇳

## Verification
- ✅ `npm run build` — 0 errors, 389 modules transformed
- ✅ Deployed to **https://kidtracks-e50ac.web.app**
- ✅ Pushed to GitHub (`master`)
