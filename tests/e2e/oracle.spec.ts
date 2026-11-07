import { expect, test } from '@playwright/test'
import { watchForViolations } from './csp.ts'

test.use({ reducedMotion: 'reduce' })

test('loads the app under the Content-Security-Policy', async ({ page }) => {
  const problems = watchForViolations(page)
  await page.goto('/')
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1)
  await expect(page).toHaveTitle('RPG Oracle')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('RPG Oracle')
  // Fonts, card art and the atmosphere's data: textures all load under the policy.
  await page.getByLabel('Your question').fill('What is here?')
  await page.getByRole('button', { name: 'Draw two cards' }).click()
  await expect(page.locator('.sign-card img').first()).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.fonts.check('1em "Pirata One"'))).toBe(true)
  expect(problems).toEqual([])
})

test('ask, draw, and the journal records it', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Your question').fill("What's going on at this ruin?")
  await page.getByRole('button', { name: 'Draw two cards' }).click()

  const result = page.getByRole('article')
  await expect(result.getByRole('heading', { name: "What's going on at this ruin?" })).toBeVisible()
  await expect(result.locator('.sign-card img')).toHaveCount(2)
  // The art actually loads from public/ in the production build.
  const loaded = await result.locator('.sign-card img').evaluateAll((imgs) => imgs.every((i) => (i as HTMLImageElement).naturalWidth > 0))
  expect(loaded).toBe(true)

  await result.getByRole('button', { name: 'Roll exact hour' }).click()
  await expect(result.getByText(/Exact hour:/)).toBeVisible()

  const journal = page.getByRole('region', { name: 'Journal' })
  await expect(journal.getByText(/Read the Signs: .*exact hour/)).toBeVisible()
})

test('Consult the Bones with a likelihood, then reselect an older entry', async ({ page }) => {
  await page.goto('/')
  await page.locator('label.choice', { hasText: 'Consult the Bones' }).click()
  await page.locator('label.choice', { hasText: 'Likely No' }).click()
  await page.getByLabel('Your question').fill('Is the dead lord stirring?')
  await page.getByRole('button', { name: 'Cast the Bones' }).click()
  await expect(page.getByRole('article').getByText('Likely No')).toBeVisible()
  await expect(page.locator('.bones-answer')).toHaveText(/(Double |Triple )?(Yes|No)/)

  await page.locator('label.choice', { hasText: 'Fortune die' }).click()
  await page.getByRole('button', { name: 'Roll the Fortune die' }).click()
  await expect(page.getByRole('article').getByText('Fortune die', { exact: true })).toBeVisible()

  await page.getByRole('region', { name: 'Journal' }).getByRole('button', { name: /^Is the dead lord stirring/ }).click()
  await expect(page.getByRole('article').getByRole('heading', { name: 'Is the dead lord stirring?' })).toBeVisible()
})

test('Activity & Reaction for an encountered creature', async ({ page }) => {
  await page.goto('/')
  await page.locator('label.choice', { hasText: 'Activity & Reaction' }).click()
  await page.getByLabel('Your question').fill('The guards at the gate')
  await page.getByRole('button', { name: 'Roll Activity & Reaction' }).click()
  const result = page.getByRole('article')
  await expect(result.locator('.reaction-status')).toHaveText(/^\d+ (Hostile|Unfriendly|Neutral|Fairly friendly|Affable)$/)
  await expect(result.getByRole('img', { name: /^Activity Die: [1-6], (Threat|Socialising|Eating|Working|Traveling|Resting)$/ })).toBeVisible()
  await expect(result.getByRole('img', { name: /^d6 \(Activity Die\): [1-6]$/ })).toBeVisible()
  await expect(result.getByRole('img', { name: /^d6: [1-6]$/ })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Journal' }).getByText(/Activity & Reaction \(intelligent creature\)/)).toBeVisible()
})

test('unsaved work survives a reload through the recovery copy', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('New fact').fill('The barrow lord hunts at night')
  await page.getByRole('button', { name: 'Pin', exact: true }).click()
  // The recovery copy is written asynchronously; wait for it before reloading.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            const open = indexedDB.open('rpg-oracle', 1)
            open.onsuccess = () => {
              const get = open.result.transaction('recovery').objectStore('recovery').get('current')
              get.onsuccess = () => resolve(get.result?.session.facts.length ?? 0)
            }
          }),
      ),
    )
    .toBe(1)
  await page.reload()
  const banner = page.getByRole('alert')
  await expect(banner).toContainText('Found unsaved changes')
  await banner.getByRole('button', { name: 'Restore' }).click()
  await expect(page.getByLabel('Fact 1', { exact: true })).toHaveValue('The barrow lord hunts at night')
})

test('keyboard: the first-visit guide, "/" to the question, Escape to cancel an interpretation', async ({ page }) => {
  // The API call never answers, so the interpretation stays running until cancelled.
  await page.route('https://api.anthropic.com/**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } })
    }
  })
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'How to ask' })).toBeVisible()
  await page.getByLabel('Anthropic API key').fill('sk-ant-e2e')
  await page.locator('.ai-settings').getByRole('button', { name: 'Save' }).click()

  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('/')
  await expect(page.getByLabel('Your question')).toBeFocused()
  await page.keyboard.type('What waits here?')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('region', { name: 'How to ask' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Interpret' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'The oracle considers' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Interpret' })).toBeEnabled()
  await expect(page.getByRole('alert')).toHaveCount(0)
})
