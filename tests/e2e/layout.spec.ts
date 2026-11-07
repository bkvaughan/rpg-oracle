import { expect, test, type Locator, type Page } from '@playwright/test'

// Responsive layout: on wide screens each result puts its two halves side by side; on a
// phone they stack. Checked by position, so a CSS regression fails here, not just by eye.

test.use({ reducedMotion: 'reduce' })

const RESULTS = [
  { tool: /Read the Signs/, ask: 'Draw two cards', question: 'What waits here?', halves: ['.sign-cards', '.sign-details'] },
  { tool: /Consult the Bones/, ask: 'Cast the Bones', question: 'Is it awake?', halves: ['.bones-cast', '.bones-verdict'] },
  { tool: /Activity & Reaction/, ask: 'Roll Activity & Reaction', question: '', halves: ['.reaction-part >> nth=0', '.reaction-part >> nth=1'] },
]

async function ask(page: Page, r: (typeof RESULTS)[number]) {
  await page.getByRole('radio', { name: r.tool }).check({ force: true })
  if (r.question) await page.getByLabel('Your question').fill(r.question)
  await page.getByRole('button', { name: r.ask }).click()
}

const box = async (l: Locator) => (await l.boundingBox())!

for (const r of RESULTS) {
  test(`${r.ask}: halves side by side on desktop`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/')
    await ask(page, r)
    const [a, b] = await Promise.all(r.halves.map((h) => box(page.locator('.result').locator(h))))
    expect(b.x).toBeGreaterThanOrEqual(a.x + a.width)
    expect(b.y).toBeLessThan(a.y + a.height)
  })

  test(`${r.ask}: halves stacked on a phone, with no sideways scroll`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await ask(page, r)
    const [a, b] = await Promise.all(r.halves.map((h) => box(page.locator('.result').locator(h))))
    expect(b.y).toBeGreaterThanOrEqual(a.y + a.height - 1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  })
}

test('on a phone, the ask button is on the first screen once AI settings are closed', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  // A saved key keeps AI settings closed, as for a returning player.
  await page.addInitScript(() => localStorage.setItem('rpg-oracle-ai-settings', JSON.stringify({ apiKey: 'k', model: 'claude-opus-5-5' })))
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Draw two cards' })).toBeInViewport({ ratio: 1 })
})

test('long unbroken words wrap instead of pushing the page sideways', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const word = 'Supercalifragilisticexpialidociousandthensomemorewithoutanybreaksatall'
  await page.getByRole('textbox', { name: 'Session' }).fill(`The ${word}`)
  await page.getByLabel('Your question').fill(`What does ${word} want?`)
  await page.getByRole('button', { name: 'Draw two cards' }).click()
  await page.getByLabel('What happened').fill(word + word)
  await page.getByLabel('What happened').blur()
  await page.getByLabel('New fact').fill(word)
  await page.getByRole('button', { name: 'Pin', exact: true }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
