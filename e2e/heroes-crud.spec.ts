import { expect, test } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { api, API_KEY, uniqueName } from './helpers/api'

const FIXTURE_PATH = path.resolve(process.cwd(), 'e2e/fixtures/hero-128.png')

test.describe('Heroes — create flow', () => {
  test.skip(!API_KEY, 'VITE_PENTATHLON_API_KEY not configured in .env.local')

  let createdId: string | null = null

  test.afterEach(async () => {
    if (createdId) {
      try {
        await api.deleteHero(createdId)
      } catch {
        // best-effort cleanup
      }
      createdId = null
    }
  })

  test('creates a hero via the form and the new card appears', async ({ page }) => {
    const heroName = uniqueName('E2E Hero')

    await page.goto('/heroes')
    await page.getByRole('button', { name: /Inscribir héroe/i }).first().click()

    await page.getByLabel(/Nombre/i).fill(heroName)

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(FIXTURE_PATH)

    // Submit the form
    await page.getByRole('button', { name: /Inscribir héroe/i }).last().click()

    // The new hero card should appear with the chosen name
    const newCard = page.getByRole('heading', { name: heroName, exact: true })
    await expect(newCard).toBeVisible({ timeout: 15_000 })

    // Toast region announces success
    const toast = page.getByText(/Héroe inscrito correctamente/i)
    await expect(toast).toBeVisible()

    // Capture the id for cleanup by listing heroes from the API
    const all = await api.listHeroes()
    const match = all.find((h) => h.name === heroName)
    if (match) createdId = match.id
    expect(match).toBeDefined()

    // Sanity: fixture file is present so the upload actually had a payload
    expect(fs.existsSync(FIXTURE_PATH)).toBe(true)
  })
})
