import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.use({ reducedMotion: 'reduce' })

test('no accessibility violations with a Signs and a Bones result', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Your question').fill('What does the leader want?')
  await page.getByRole('button', { name: 'Draw two cards' }).click()
  await page.getByLabel('New fact').fill('A sentry watches the gate')
  await page.getByRole('button', { name: 'Pin', exact: true }).click()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])

  await page.locator('label.choice', { hasText: 'Consult the Bones' }).click()
  await page.getByLabel('Your question').fill('Is the sentry awake?')
  await page.getByRole('button', { name: 'Cast the Bones' }).click()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})
