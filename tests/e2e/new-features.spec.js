import { expect, test } from '@playwright/test'

test('parent can quick-start with username then setup family', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.removeItem('kidstrack-e2e-state')
    })

    await page.goto('/login?e2e=1')

    await page.getByRole('button', { name: /quick start with username/i }).click()
    await page.getByPlaceholder(/e\.g\. myfamily/i).fill('familydemo')
    await page.getByRole('button', { name: /start now/i }).click()

    await expect(page.getByText(/set up your family/i)).toBeVisible()
    await page.getByPlaceholder(/the smiths/i).fill('Family Demo')
    await page.getByRole('button', { name: /create family/i }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
})

test('parent with kids and no linked account sees nudge and can link email', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify({
            user: {
                uid: 'parent-simple-e2e',
                displayName: 'Simple Parent',
                email: null,
                photoURL: null,
                providerData: [],
            },
            profile: {
                role: 'parent',
                familyId: 'family-simple-e2e',
                displayName: 'Simple Parent',
                email: null,
                simpleLogin: true,
            },
            collections: {
                kids: [
                    {
                        id: 'kid-1',
                        displayName: 'Milo',
                        name: 'Milo',
                        avatar: 'M',
                        balance: 0,
                    },
                ],
                templates: [],
                dailyTasks: [],
                dayConfigs: [],
                ledger: [],
            },
        }))
    })

    await page.goto('/?e2e=1')

    await expect(page.getByText(/protect your data/i)).toBeVisible()
    await page.getByRole('button', { name: /link account/i }).click()

    await page.locator('input[type="email"]').last().fill('parent+e2e@example.com')
    await page.locator('input[type="password"]').last().fill('secret123')
    await page.getByRole('button', { name: /link email/i }).click()

    await expect(page.getByText(/protect your data/i)).toHaveCount(0)
})

test('template description switches by selected language', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('kidstrack-lang', 'vi')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify({
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
                kids: [
                    {
                        id: 'kid-1',
                        displayName: 'Milo',
                        name: 'Milo',
                        avatar: 'M',
                        balance: 0,
                    },
                ],
                templates: [
                    {
                        id: 'tmpl-1',
                        title: 'Wash Hands',
                        descriptions: {
                            en: 'Wash hands before meals',
                            vi: 'Rửa tay trước bữa ăn',
                        },
                        description: 'Wash hands before meals',
                        assignedKidIds: [],
                    },
                ],
                dailyTasks: [],
                dayConfigs: [],
                ledger: [],
            },
        }))
    })

    await page.goto('/templates?e2e=1')

    // Family templates are shown in the 'Family Templates' tab
    await page.getByRole('button', { name: /family templates|mẫu gia đình/i }).click()
    await expect(page.getByText('Rửa tay trước bữa ăn')).toBeVisible()

    await page.locator('.lang-switch').first().click()
    await expect(page.getByText('Wash hands before meals')).toBeVisible()
})
