# Default Template Library & Kid-Specific Templates

## Goal
Add a curated library of age/gender-appropriate default task templates. Parents can import defaults into family templates, assign templates to specific kids, and the "Load Templates" logic respects kid-specific overrides.

---

## How It Works

```
┌────────────────────────────┐
│  System Default Templates  │  (hardcoded in code, not Firestore)
│  Grouped by age + gender   │
└─────────┬──────────────────┘
          │ Parent clicks "Import"
          ▼
┌────────────────────────────┐
│   Family Templates         │  /families/{fid}/templates/{id}
│   Shared for all kids      │  { title, description, assignedKidIds?: [] }
└─────────┬──────────────────┘
          │ "Load Templates" for a day
          ▼
┌────────────────────────────┐
│   Daily Tasks              │  /families/{fid}/dailyTasks/{id}
│   Per kid, per date        │
└────────────────────────────┘
```

**Load Templates logic:**
1. Find templates where `assignedKidIds` includes this kid, OR `assignedKidIds` is empty/missing (= family-wide)
2. Skip any already loaded for that day
3. Create daily tasks

---

## Proposed Changes

### Default Template Data

#### [NEW] `src/data/defaultTemplates.js`
Hardcoded default template packs (not stored in Firestore — just a menu to import from):

| Pack | Age | Gender | Example Tasks |
|---|---|---|---|
| 🐣 Little Star | 4–6 | Neutral | Brush teeth (AM), Brush teeth (PM), Pick up toys, Say please & thank you, Drink water |
| 🎒 School Star | 7–10 | Neutral | Make bed, Pack school bag, Do homework, Read 15 mins, Practice handwriting |
| 📚 Young Achiever | 11–14 | Neutral | Make bed, Prepare uniform, Complete homework, Read 30 mins, Help with 1 chore |
| ⚽ Active Boy | 7–12 | Boy | Morning exercise, Practice sports, Shower after play, Tidy room |
| 💃 Active Girl | 7–12 | Girl | Morning stretch, Dance/exercise, Skincare routine, Organize desk |
| 🏠 Home Helper | All | Neutral | Set the table, Wash dishes, Sweep floor, Take out trash, Water plants |

Each pack: `{ id, name, icon, ageRange, gender, tasks: [{title, description}] }`

---

### Template Model Change

#### [MODIFY] Firestore `templates` collection
Add optional `assignedKidIds` field:
```js
{
  id: string,
  title: string,
  description: string,
  assignedKidIds: string[]  // empty = all kids, non-empty = only those kids
}
```

---

### Template Page Redesign

#### [MODIFY] [src/pages/Templates.jsx](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/pages/Templates.jsx)
**New layout (3 sections):**

1. **📦 Default Packs** — cards showing each default pack with task count and "Import" button. Clicking "Import" copies all tasks as family templates.

2. **📋 Family Templates** — current list with edit/delete, plus:
   - Each template row shows assigned kid avatars (or "All kids" pill)
   - "Assign" button opens a kid-picker to assign/unassign

3. **Add/Edit modal** — unchanged, but add kid assignment multi-select

---

### Load Templates Logic

#### [MODIFY] [src/store/useStore.js](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/store/useStore.js) → [buildLoadedTemplates](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/store/useStore.js#43-50)
Change from loading ALL templates → filter by:
```js
templates.filter(t =>
  !t.assignedKidIds?.length ||            // family-wide
  t.assignedKidIds.includes(kidId)         // assigned to this kid
)
```

---

### Sync Hook

#### [MODIFY] [src/hooks/useFirebaseSync.js](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/hooks/useFirebaseSync.js)
- [addTemplate](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/hooks/useFirebaseSync.js#54-57) → accept optional `assignedKidIds`
- `importDefaultPack` → bulk import: loop over pack tasks, create template doc for each
- `assignTemplateToKids` → update template's `assignedKidIds`

---

## New Files Summary

| File | Purpose |
|---|---|
| `src/data/defaultTemplates.js` | Hardcoded default task packs by age/gender |

## Modified Files Summary

| File | Change |
|---|---|
| [src/pages/Templates.jsx](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/pages/Templates.jsx) | Add default packs section, kid assignment UI |
| [src/store/useStore.js](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/store/useStore.js) | Filter templates by kidId in [buildLoadedTemplates](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/store/useStore.js#43-50) |
| [src/hooks/useFirebaseSync.js](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/hooks/useFirebaseSync.js) | Add `importDefaultPack`, `assignTemplateToKids` actions |
| [src/index.css](file:///d:/Docs/Learn%20Tech/AIAgent/Refs/TodoList/src/index.css) | Template pack card styles |

---

## Verification Plan
1. Import "🐣 Little Star" pack → tasks appear as family templates
2. Assign "Brush teeth" to only Kid A → load templates for Kid B → "Brush teeth" not included
3. Load templates for Kid A → "Brush teeth" included
4. Family-wide templates (no assignment) → load for any kid
5. Re-import same pack → no duplicate templates created
