import { test, expect } from '@playwright/test'

const parentState = {
    user: {
        uid: 'parent-e2e',
        email: 'parent@example.com',
        displayName: 'Parent Tester',
        photoURL: null,
    },
    profile: {
        role: 'parent',
        familyId: 'family-e2e',
        displayName: 'Parent Tester',
        email: 'parent@example.com',
    },
    collections: {
        kids: [],
        templates: [],
        dailyTasks: [],
        dayConfigs: [],
        ledger: [],
    },
}

test('unauthenticated users see the landing page at root', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.removeItem('kidstrack-e2e-state')
    })

    await page.goto('/?e2e=1')

    // App shows the landing page for unauthenticated users at '/'
    await expect(page).toHaveURL(/\/$|\/\?e2e/)
    await expect(page.getByRole('heading', { name: /build great habits/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i }).first()).toBeVisible()
})

test('parent can sign out back to landing page', async ({ page }) => {
    const stateWithKid = {
        ...parentState,
        collections: {
            ...parentState.collections,
            kids: [{ id: 'kid-1', displayName: 'Milo', name: 'Milo', avatar: '🧒', balance: 0 }],
        },
    }
    await page.addInitScript((state) => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(state))
    }, stateWithKid)

    await page.goto('/?e2e=1')

    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await page.getByRole('button', { name: /sign out/i }).click()

    // After sign-out, the app shows the landing page at '/'
    await expect(page.getByRole('heading', { name: /build great habits/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i }).first()).toBeVisible()
})

test('kid parent email input accepts the full email while editing', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.setItem('kidstrack-parent-email', 'saved@example.com')
        window.localStorage.removeItem('kidstrack-e2e-state')
    })

    await page.goto('/login?e2e=1')

    await page.getByRole('tab', { name: /kid/i }).click()
    await expect(page.getByText(/family account:\s*saved@example\.com/i)).toBeVisible()

    await page.getByRole('button', { name: /change/i }).click()
    const parentEmailInput = page.getByPlaceholder(/dad@gmail\.com/i)

    await parentEmailInput.fill('parent@example.com')
    await expect(parentEmailInput).toHaveValue('parent@example.com')
})

test('kid can log in from the login form', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.removeItem('kidstrack-parent-email')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify({
            user: null,
            profile: null,
            collections: {
                kids: [
                    {
                        id: 'kid-1',
                        displayName: 'Milo',
                        name: 'Milo',
                        avatar: 'M',
                        balance: 15000,
                    },
                ],
                templates: [],
                dailyTasks: [
                    {
                        id: 'task-1',
                        kidId: 'kid-1',
                        date: '2026-03-13',
                        title: 'Read book',
                        description: '20 minutes',
                        status: 'pending',
                    },
                ],
                dayConfigs: [],
                ledger: [],
            },
            authFixtures: {
                familyLookup: {
                    'parent@example,com': {
                        familyId: 'family-e2e',
                        parentName: 'Parent Tester',
                    },
                },
                kidAccounts: [
                    {
                        username: 'milo',
                        password: 'secret123',
                        familyId: 'family-e2e',
                        user: {
                            uid: 'kid-e2e',
                            email: 'milo@family-e2e.kidstrack',
                            displayName: 'Milo',
                            photoURL: null,
                        },
                        profile: {
                            role: 'kid',
                            familyId: 'family-e2e',
                            kidId: 'kid-1',
                            displayName: 'Milo',
                            email: 'milo@family-e2e.kidstrack',
                        },
                    },
                ],
            },
        }))
    })

    await page.goto('/login?e2e=1')

    await page.getByRole('tab', { name: /kid/i }).click()
    await page.getByPlaceholder(/dad@gmail\.com/i).fill('parent@example.com')
    await page.getByPlaceholder(/your username/i).fill('milo')
    await page.locator('input[type="password"]').first().fill('secret123')
    await page.getByRole('button', { name: /log in/i }).click()

    await expect(page).toHaveURL(/\/kid/)
    await expect(page.locator('.kid-hero-name')).toHaveText('Milo')
    await expect(page.getByText(/today's tasks/i)).toBeVisible()
})
