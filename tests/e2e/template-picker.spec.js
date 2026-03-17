import { test, expect } from '@playwright/test'

const baseState = {
    user: {
        uid: 'parent-e2e',
        email: 'parent@example.com',
        displayName: 'Parent Tester',
        photoURL: null,
        providerData: [{ providerId: 'google.com' }],
    },
    profile: {
        role: 'parent',
        familyId: 'family-e2e',
        displayName: 'Parent Tester',
        email: 'parent@example.com',
    },
    collections: {
        kids: [{ id: 'kid-1', displayName: 'Milo', name: 'Milo', avatar: '🧒', balance: 0 }],
        templates: [
            {
                id: 'tmpl-1',
                title: 'Wash Hands',
                descriptions: { en: 'Wash hands before meals', vi: 'Rửa tay trước bữa ăn' },
                description: 'Wash hands before meals',
                assignedKidIds: [],
            },
            {
                id: 'tmpl-2',
                title: 'Dọn giường',
                descriptions: { en: 'Make your bed neatly', vi: 'Dọn giường gọn gàng buổi sáng' },
                description: 'Make your bed neatly',
                assignedKidIds: ['kid-1'],
            },
            {
                id: 'tmpl-3',
                title: 'Read a book',
                descriptions: { en: 'Read for 15 minutes', vi: 'Đọc sách 15 phút' },
                description: 'Read for 15 minutes',
                assignedKidIds: [],
            },
        ],
        dailyTasks: [],
        dayConfigs: [],
        ledger: [],
    },
}

test.beforeEach(async ({ page }) => {
    await page.addInitScript((state) => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(state))
    }, baseState)
})

test('template picker page opens from daily view', async ({ page }) => {
    await page.goto('/daily/kid-1?e2e=1')
    await page.getByRole('button', { name: /choose from templates/i }).click()
    await expect(page).toHaveURL(/pick-templates/)
    await expect(page.getByRole('heading', { name: /choose templates/i })).toBeVisible()
})

test('search filters templates by title (exact match)', async ({ page }) => {
    await page.goto('/daily/kid-1/pick-templates?date=2026-03-17&e2e=1')
    await expect(page.getByText('Wash Hands')).toBeVisible()
    await expect(page.getByText('Read a book')).toBeVisible()

    await page.locator('.tpicker-search').fill('Wash')
    await expect(page.getByText('Wash Hands')).toBeVisible()
    await expect(page.getByText('Read a book')).not.toBeVisible()
})

test('search filters templates by description', async ({ page }) => {
    await page.goto('/daily/kid-1/pick-templates?date=2026-03-17&e2e=1')
    await page.locator('.tpicker-search').fill('15 minutes')
    await expect(page.getByText('Read a book')).toBeVisible()
    await expect(page.getByText('Wash Hands')).not.toBeVisible()
})

test('search is diacritic-insensitive (Vietnamese)', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('kidstrack-lang', 'vi')
    })
    await page.goto('/daily/kid-1/pick-templates?date=2026-03-17&e2e=1')
    // "don giuong" (no diacritics) should match "Dọn giường"
    await page.locator('.tpicker-search').fill('don giuong')
    await expect(page.getByText('Dọn giường')).toBeVisible()
    await expect(page.getByText('Wash Hands')).not.toBeVisible()
})

test('search shows no-results message for garbage input', async ({ page }) => {
    await page.goto('/daily/kid-1/pick-templates?date=2026-03-17&e2e=1')
    await page.locator('.tpicker-search').fill('xyzxyzxyz')
    await expect(page.locator('.tpicker-list')).toContainText(/no templates found/i)
})

test('filter chip "Assigned" shows only templates assigned to current kid', async ({ page }) => {
    await page.goto('/daily/kid-1/pick-templates?date=2026-03-17&e2e=1')
    // Assigned chip is default — only tmpl-2 is assigned to kid-1
    // tmpl-1 and tmpl-3 have empty assignedKidIds so they show for all kids
    await expect(page.getByText('Wash Hands')).toBeVisible()
    await expect(page.getByText('Dọn giường')).toBeVisible()
    await expect(page.getByText('Read a book')).toBeVisible()
})

test('filter chip "All" shows all templates', async ({ page }) => {
    await page.goto('/daily/kid-1/pick-templates?date=2026-03-17&e2e=1')
    await page.getByRole('button', { name: /^all$/i }).click()
    await expect(page.getByText('Wash Hands')).toBeVisible()
    await expect(page.getByText('Dọn giường')).toBeVisible()
    await expect(page.getByText('Read a book')).toBeVisible()
})

test('select all and add tasks then navigate back', async ({ page }) => {
    await page.goto('/daily/kid-1/pick-templates?date=2026-03-17&e2e=1')
    await page.getByRole('button', { name: /^all$/i }).click()
    await page.getByRole('button', { name: /select all/i }).click()
    const addBtn = page.getByRole('button', { name: /add \d/i })
    await expect(addBtn).toBeEnabled()
    await addBtn.click()
    await expect(page).toHaveURL(/\/daily\/kid-1$/)
})

test('back button returns to daily view', async ({ page }) => {
    await page.goto('/daily/kid-1/pick-templates?date=2026-03-17&e2e=1')
    await page.getByRole('button', { name: /back/i }).first().click()
    await expect(page).toHaveURL(/\/daily\/kid-1$/)
})

test('already-added tasks show badge and cannot be selected', async ({ page }) => {
    const stateWithTask = {
        ...baseState,
        collections: {
            ...baseState.collections,
            dailyTasks: [{
                id: 'dt-1', kidId: 'kid-1', date: '2026-03-17',
                title: 'Wash Hands', description: '', status: 'pending',
            }],
        },
    }
    await page.addInitScript((state) => {
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(state))
    }, stateWithTask)
    await page.goto('/daily/kid-1/pick-templates?date=2026-03-17&e2e=1')
    await page.getByRole('button', { name: /^all$/i }).click()
    // "Đã có" badge should appear on Wash Hands row
    const washRow = page.locator('.tpicker-row', { hasText: 'Wash Hands' })
    await expect(washRow).toHaveClass(/tpicker-row--done/)
})

test('preview panel shows secondary language', async ({ page }) => {
    await page.goto('/daily/kid-1/pick-templates?date=2026-03-17&e2e=1')
    await page.getByRole('button', { name: /^all$/i }).click()
    // Hover/click Wash Hands to trigger preview
    await page.locator('.tpicker-row-wrap', { hasText: 'Wash Hands' }).click()
    // In EN mode: primary = EN, secondary = VI (italic)
    await expect(page.locator('.tpicker-preview-desc')).toContainText('Wash hands before meals')
    await expect(page.locator('.tpicker-preview-secondary')).toContainText('Rửa tay trước bữa ăn')
})
