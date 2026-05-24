import { test, expect } from '@playwright/test'

test('app boots and lands on /heroes', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Pentatlón/)
  await expect(page).toHaveURL(/\/heroes$/)
})
