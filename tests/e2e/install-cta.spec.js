import { expect, test } from '@playwright/test'

// Helper: inject beforeinstallprompt after page load
async function injectBeforeInstallPrompt(page) {
  await page.evaluate(() => {
    const fakePrompt = {
      preventDefault: () => {},
      prompt: () => Promise.resolve(),
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    }
    const event = Object.assign(new Event('beforeinstallprompt'), fakePrompt)
    window.dispatchEvent(event)
  })
}

test.describe('Install App CTA - landing hero', () => {
  test('CTA is hidden when already running standalone (display-mode: standalone)', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('kidstrack-lang', 'en')
      const origMatchMedia = window.matchMedia.bind(window)
      window.matchMedia = (query) => {
        if (query === '(display-mode: standalone)') {
          return Object.assign(origMatchMedia(query), { matches: true })
        }
        return origMatchMedia(query)
      }
    })

    await page.goto('/?e2e=1')
    await expect(page.getByTestId('landing-install-cta')).not.toBeVisible()
  })

  test('CTA stays visible even if legacy cooldown key exists', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('kidstrack-lang', 'en')
      window.localStorage.setItem('pwa_landing_cta_dismissed_until', String(Date.now() + 60 * 60 * 1000))
    })

    await page.goto('/?e2e=1')
    await page.waitForTimeout(300)
    await expect(page.getByTestId('landing-install-cta')).toBeVisible()
  })

  test('CTA has no dismiss button and can be enabled by beforeinstallprompt', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('kidstrack-lang', 'en')
    })

    await page.goto('/?e2e=1')
    const cta = page.getByTestId('landing-install-cta')
    await expect(cta).toBeVisible()
    await expect(cta.getByRole('button', { name: /dismiss/i })).toHaveCount(0)

    await injectBeforeInstallPrompt(page)
    await page.waitForTimeout(300)
    await expect(cta).toContainText(/install app|add to home screen/i)
  })

  test('disabled CTA shows helper copy explaining why install is unavailable', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('kidstrack-lang', 'en')
    })

    await page.goto('/?e2e=1')
    await page.waitForTimeout(300)
    const cta = page.getByTestId('landing-install-cta')
    await expect(cta).toBeVisible()
    await expect(cta.getByRole('button').first()).toBeDisabled()
    await expect(cta).toContainText(/direct install is not supported/i)
  })

  test('CTA renders in Vietnamese', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('kidstrack-lang', 'vi')
    })

    await page.goto('/?e2e=1')
    await page.waitForTimeout(300)

    const cta = page.getByTestId('landing-install-cta')
    await expect(cta).toBeVisible()
    await expect(cta).toContainText(/cài ứng dụng|thêm vào màn hình chính/i)
  })

  test('iOS: CTA shows Add to Home Screen label', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('kidstrack-lang', 'en')
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        configurable: true,
      })
      Object.defineProperty(navigator, 'standalone', { value: false, configurable: true })
    })

    await page.goto('/?e2e=1')
    await page.waitForTimeout(300)

    const cta = page.getByTestId('landing-install-cta')
    await expect(cta).toBeVisible()
    await expect(cta).toContainText('Add to Home Screen')
  })

  test('iOS: clicking CTA opens the install guide modal', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('kidstrack-lang', 'en')
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        configurable: true,
      })
      Object.defineProperty(navigator, 'standalone', { value: false, configurable: true })
    })

    await page.goto('/?e2e=1')
    await page.waitForTimeout(300)

    const ctaButton = page.getByTestId('landing-install-cta').getByRole('button').first()
    await expect(ctaButton).toBeEnabled()
    await ctaButton.click()

    const guide = page.getByTestId('ios-install-guide')
    await expect(guide).toBeVisible()
    await expect(guide).toContainText('Add to Home Screen')
    await expect(guide).toContainText('Share')
  })

  test('iOS guide: Got it closes modal', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('kidstrack-lang', 'en')
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        configurable: true,
      })
      Object.defineProperty(navigator, 'standalone', { value: false, configurable: true })
    })

    await page.goto('/?e2e=1')
    await page.waitForTimeout(300)

    await page.getByTestId('landing-install-cta').getByRole('button').first().click()
    await expect(page.getByTestId('ios-install-guide')).toBeVisible()

    await page.getByRole('button', { name: /got it/i }).click()
    await expect(page.getByTestId('ios-install-guide')).not.toBeVisible()
  })

  test('Primary CTA still visible alongside install CTA', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('kidstrack-lang', 'en')
    })

    await page.goto('/?e2e=1')
    await page.waitForTimeout(300)

    await expect(page.getByRole('button', { name: /start free/i })).toBeVisible()
    await expect(page.getByTestId('landing-install-cta')).toBeVisible()
  })
})
