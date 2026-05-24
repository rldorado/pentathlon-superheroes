import { expect, test } from '@playwright/test'
import { api, API_KEY, loadHeroFixtureBase64, makeAttributes, uniqueName } from './helpers/api'

test.describe('Pentathlon — full simulation', () => {
  test.skip(!API_KEY, 'VITE_PENTATHLON_API_KEY not configured in .env.local')

  const seededIds: string[] = []
  const seededNames: string[] = []

  test.beforeAll(async () => {
    const picture = loadHeroFixtureBase64()
    for (let i = 0; i < 3; i++) {
      const name = uniqueName(`E2E P${i + 1}`)
      const hero = await api.createHero({
        name,
        picture,
        attributes: makeAttributes(i * 2 + 1),
      })
      seededIds.push(hero.id)
      seededNames.push(name)
    }
  })

  test.afterAll(async () => {
    for (const id of seededIds) {
      try {
        await api.deleteHero(id)
      } catch {
        // best-effort
      }
    }
  })

  test('selects 3 heroes, runs all 5 events, lands on podium', async ({ page }) => {
    await page.goto('/pentatlon')

    // Wait for the roster to render (it loads on mount). Find each seeded hero
    // by name and click its selection card.
    for (const name of seededNames) {
      const card = page.getByRole('listitem').filter({ hasText: name }).first()
      await expect(card).toBeVisible({ timeout: 15_000 })
      await card.click()
    }

    await page.getByRole('button', { name: /Simular pentatlón/i }).click()

    // Walk through 5 events. After event 5, CTA changes to "Ver clasificación".
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: /Siguiente prueba/i }).click()
    }
    await page.getByRole('button', { name: /Ver clasificación/i }).click()

    // Podium assertions: header + 3 medal labels visible.
    await expect(page.getByText(/Clasificación final/i)).toBeVisible()
    await expect(page.getByText('Oro', { exact: true })).toBeVisible()
    await expect(page.getByText('Plata', { exact: true })).toBeVisible()
    await expect(page.getByText('Bronce', { exact: true })).toBeVisible()

    // All 3 seeded heroes should appear in the classification.
    for (const name of seededNames) {
      await expect(page.getByText(name).first()).toBeVisible()
    }
  })
})
