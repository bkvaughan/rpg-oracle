import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

test.use({ reducedMotion: 'reduce' })

async function expectNoViolations(page: Page, view: string) {
  const { violations } = await new AxeBuilder({ page }).analyze()
  const summary = violations.map((v) => `${view}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target.join(' ')}`)
  expect(summary).toEqual([])
}

const reading = {
  ruling: 'A sentry, but she is distracted.',
  why: 'Single Yes with Fortune.',
  alternate: null,
  time: null,
  direction: null,
  follow_ups: [{ question: 'Is she armed?', tool: 'bones', likelihood: 'likely-yes', creature: null }],
  new_facts: ['A sentry watches the ruin gate'],
}

async function mockApi(page: Page) {
  await page.route('https://api.anthropic.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' },
      body: JSON.stringify({
        id: 'm',
        type: 'message',
        role: 'assistant',
        model: 'claude-opus-5-5',
        content: [{ type: 'text', text: JSON.stringify(reading) }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 1, output_tokens: 1 },
      }),
    }),
  )
}

async function everyView(page: Page) {
  await mockApi(page)
  await page.goto('/')
  await page.locator('.session-details summary').click()
  await expectNoViolations(page, 'start, settings and details open')

  await page.getByLabel('Your question').fill('What does the leader want?')
  await page.getByRole('button', { name: 'Draw two cards' }).click()
  await page.getByRole('button', { name: 'Roll exact hour' }).click()
  await expectNoViolations(page, 'Signs result')

  await page.locator('label.choice', { hasText: 'Consult the Bones' }).click()
  await page.locator('label.choice', { hasText: 'Likely Yes' }).click()
  await page.getByLabel('Your question').fill('Is the sentry awake?')
  await page.getByRole('button', { name: 'Cast the Bones' }).click()
  await expectNoViolations(page, 'Bones result')

  await page.getByLabel('Anthropic API key').fill('sk-ant-test')
  await page.locator('.ai-settings').getByRole('button', { name: 'Save' }).click()
  await page.getByRole('button', { name: 'Interpret' }).click()
  await expect(page.getByText(reading.ruling)).toBeVisible()
  await expectNoViolations(page, 'AI reading')

  await page.locator('.suggested').getByRole('button', { name: 'Pin', exact: true }).click()
  await page.locator('label.choice', { hasText: 'Fortune die' }).click()
  await page.getByRole('button', { name: 'Roll the Fortune die' }).click()
  await page.getByRole('region', { name: 'Journal' }).getByRole('button', { name: /^Delete/ }).first().click()
  await expectNoViolations(page, 'Fortune result, facts, delete confirmation')

  await page.locator('label.choice', { hasText: 'Activity & Reaction' }).click()
  await page.getByRole('button', { name: 'Roll Activity & Reaction' }).click()
  await expectNoViolations(page, 'Activity & Reaction result')

  await page.reload()
  await expect(page.getByRole('alert')).toBeVisible()
  await expectNoViolations(page, 'recovery banner')
}

test('no accessibility violations on any view (desktop)', async ({ page }) => {
  await everyView(page)
})

test('no accessibility violations on any view (phone)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await everyView(page)
})
