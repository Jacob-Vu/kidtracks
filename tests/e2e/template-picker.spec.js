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
        templates: [],
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
    await expect(page.getByText('Brush teeth (morning)')).toBeVisible()
    await expect(page.getByText('Make your bed')).toBeVisible()

    await page.locator('.tpicker-search').fill('Wash')
    await expect(page.getByText('Wash hands before meals')).toBeVisible()
    await expect(page.getByText('Make your bed')).not.toBeVisible()
})

test('search filters templates by description', async ({ page }) => {
    await page.goto('/daily/kid-1/pick-templates?date=2026-03-17&e2e=1')
    await page.locator('.tpicker-search').fill('soap and water')
    await expect(page.getByText('Wash hands before meals')).toBeVisible()
    await expect(page.getByText('Make your bed')).not.toBeVisible()
})

test('search is diacritic-insensitive (Vietnamese)', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('kidstrack-lang', 'vi')
    })
    await page.goto('/daily/kid-1/pick-templates?date=2026-03-17&e2e=1')
    // "rua tay" (no diacritics) should match "Rửa tay bằng xà phòng" in VI description
    await page.locator('.tpicker-search').fill('rua tay')
    await expect(page.getByText('Wash hands before meals')).toBeVisible()
    await expect(page.getByText('Make your bed')).not.toBeVisible()
})

test('search shows no-results message for garbage input', async ({ page }) => {
    await page.goto('/daily/kid-1/pick-templates?date=2026-03-17&e2e=1')
    await page.locator('.tpicker-search').fill('xyzxyzxyz')
    await expect(page.locator('.tpicker-list')).toContainText(/no templates found/i)
})

test('filter chip by pack shows only tasks from that pack', async ({ page }) => {
    await page.goto('/daily/kid-1/pick-templates?date=2026-03-17&e2e=1')
    // Click the 🐣 Little Star pack chip to filter by that pack
    await page.getByRole('button', { name: /little star/i }).click()
    // Tasks from Little Star pack should be visible
    await expect(page.getByText('Brush teeth (morning)')).toBeVisible()
    await expect(page.getByText('Wash hands before meals')).toBeVisible()
    // Tasks from other packs should not be visible
    await expect(page.getByText('Make your bed')).not.toBeVisible()
    await expect(page.getByText('Morning exercise')).not.toBeVisible()
})

test('filter chip "All" shows tasks from multiple packs', async ({ page }) => {
    await page.goto('/daily/kid-1/pick-templates?date=2026-03-17&e2e=1')
    await page.getByRole('button', { name: /^all$/i }).click()
    // Tasks from different packs should all be visible
    await expect(page.getByText('Brush teeth (morning)')).toBeVisible()
    await expect(page.getByText('Make your bed')).toBeVisible()
    await expect(page.getByText('Morning exercise')).toBeVisible()
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
                title: 'Brush teeth (morning)', description: '', status: 'pending',
            }],
        },
    }
    await page.addInitScript((state) => {
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(state))
    }, stateWithTask)
    await page.goto('/daily/kid-1/pick-templates?date=2026-03-17&e2e=1')
    await page.getByRole('button', { name: /^all$/i }).click()
    // "Đã có" badge should appear on Brush teeth (morning) row
    const brushRow = page.locator('.tpicker-row', { hasText: 'Brush teeth (morning)' })
    await expect(brushRow).toHaveClass(/tpicker-row--done/)
})

test('preview panel shows secondary language', async ({ page }) => {
    await page.goto('/daily/kid-1/pick-templates?date=2026-03-17&e2e=1')
    await page.getByRole('button', { name: /^all$/i }).click()
    // Click 'Wash hands before meals' to trigger preview
    await page.locator('.tpicker-row-wrap', { hasText: 'Wash hands before meals' }).click()
    // In EN mode: primary = EN desc, secondary = VI desc
    await expect(page.locator('.tpicker-preview-desc')).toContainText('Use soap and water')
    await expect(page.locator('.tpicker-preview-secondary')).toContainText('Rửa tay bằng xà phòng')
})
