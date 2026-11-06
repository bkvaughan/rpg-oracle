import { expect, test } from '@playwright/test'

test('loads the app', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('RPG Oracle')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('RPG Oracle')
})
