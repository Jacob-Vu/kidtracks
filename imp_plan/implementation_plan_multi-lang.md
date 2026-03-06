# Internationalization (Vietnamese + English)

## Goal
Add Vietnamese 🇻🇳 and English 🇬🇧 language support with a toggle switch. Lightweight custom approach — no heavy i18n library.

## Architecture

```
src/i18n/
  ├── en.js      — English strings
  ├── vi.js      — Vietnamese strings
  └── I18nContext.jsx  — React context + useT() hook
```

**Usage in components:**
```jsx
const t = useT()
// t('dashboard.title')  → "Dashboard" or "Bảng điều khiển"
// t('btn.save')         → "Save" or "Lưu"
```

**Language preference:** Stored in `localStorage`, defaults to Vietnamese.

---

## Proposed Changes

### I18n Core

#### [NEW] `src/i18n/en.js`
English translation dictionary — flat dot-notation keys (~150 strings)

#### [NEW] `src/i18n/vi.js`
Vietnamese translation dictionary — same keys

#### [NEW] `src/i18n/I18nContext.jsx`
- `I18nProvider` — wraps app, reads localStorage, provides [t()](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/contexts/AuthContext.jsx#54-55) function
- `useT()` hook — returns translation function
- `useLang()` hook — returns `{ lang, setLang }` for the switcher

---

### Language Switcher

#### [MODIFY] [src/App.jsx](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/App.jsx) — ParentLayout sidebar
Add 🇻🇳/🇬🇧 toggle at bottom of sidebar (next to sign-out)

#### [MODIFY] [src/layouts/KidLayout.jsx](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/layouts/KidLayout.jsx)
Same switcher for kid sidebar

---

### Pages to Translate (all static UI strings)

| File | Key Strings |
|---|---|
| [Login.jsx](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/pages/Login.jsx) | Titles, tab labels, button text, error messages, placeholders |
| [Dashboard.jsx](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/pages/Dashboard.jsx) | Page title/subtitle, kid card labels, buttons |
| [Templates.jsx](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/pages/Templates.jsx) | Pack names/descriptions, section headers, buttons |
| [DailyView.jsx](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/pages/DailyView.jsx) | Page header, status badges, config modal, finalize messages |
| [Ledger.jsx](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/pages/Ledger.jsx) | Page title, entry labels, transaction types |
| [KidDashboard.jsx](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/pages/KidDashboard.jsx) | Hero section, today's tasks header, history labels |
| [KidProfile.jsx](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/pages/KidProfile.jsx) | Form labels, section titles, buttons |
| [KidAccountModal.jsx](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/components/KidAccountModal.jsx) | Modal title, form fields, hints |
| [App.jsx](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/App.jsx) | Nav labels, loading text, error messages |
| [KidLayout.jsx](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/layouts/KidLayout.jsx) | Nav labels |

### Data Translations

#### [MODIFY] [src/data/defaultTemplates.js](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/data/defaultTemplates.js)
Each pack and task gets both `name`/`nameVi` and `title`/`titleVi` fields. The Templates page reads the correct one based on current language.

---

## Verification Plan
1. Switch to English → all UI in English
2. Switch to Vietnamese → all UI in Vietnamese
3. Refresh page → language preference persists
4. Login page → correct language before login
5. Default template packs → names/descriptions in both languages
