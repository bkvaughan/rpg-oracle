import { expect, test } from '@playwright/test'
import { watchForViolations } from './csp.ts'

test.use({ reducedMotion: 'reduce' })

const reading = {
  ruling: 'A dead lord hoards here.',
  why: 'The words point to a greedy corpse.',
  follow_ups: [{ question: 'Is there still gold in the barrow?', tool: 'bones', likelihood: 'likely-yes' }],
  new_facts: ['A dead lord hoards in the ruin'],
}

// Intercepts the browser's call to the Anthropic API: proves the SDK request is made from the
// page with the player's key and the expected body, without spending real money.
test('Interpret calls the Anthropic API with the saved key and shows the reading', async ({ page }) => {
  const problems = watchForViolations(page)
  let body: Record<string, unknown> | null = null
  let key: string | null = null
  let posts = 0
  await page.route('https://api.anthropic.com/**', async (route) => {
    const request = route.request()
    // The browser sends a CORS preflight first; answer it and record only the real call.
    if (request.method() === 'POST') {
      body = request.postDataJSON()
      posts++
      key = await request.headerValue('authorization')
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' },
      body: JSON.stringify({
        id: 'msg_test',
        type: 'message',
        role: 'assistant',
        model: 'claude-opus-5-5',
        content: [{ type: 'text', text: JSON.stringify(reading) }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 10 },
      }),
    })
  })

  await page.goto('/')
  await page.getByLabel('Anthropic API key').fill('sk-ant-e2e')
  await page.locator('.ai-settings').getByRole('button', { name: 'Save' }).click()

  // The session context goes with every interpretation.
  await page.locator('.context-panel summary').click()
  await page.getByRole('textbox', { name: 'Session context' }).fill('Thuel, a barbarian, has come to the barrow at dusk')

  await page.getByLabel('Your question').fill("What's going on at this ruin?")
  await page.getByRole('button', { name: 'Draw two cards' }).click()
  await page.getByRole('button', { name: 'Interpret' }).click()

  await expect(page.getByRole('region', { name: 'Interpretation' }).getByText(reading.ruling)).toBeVisible()
  // SDK 1.x with API version 2026-10-21 sends the key as a bearer token.
  expect(key).toBe('Bearer sk-ant-e2e')
  expect(body).toMatchObject({ model: 'claude-opus-5-5', fallbacks: 'default', output_config: { effort: 'medium' } })
  expect(JSON.stringify(body)).toContain("What's going on at this ruin?")
  expect(JSON.stringify(body)).toContain('# Session context (from the player)\\nThuel, a barbarian, has come to the barrow at dusk')

  await page.getByRole('button', { name: /Is there still gold in the barrow\?/ }).click()
  await expect(page.getByLabel('Your question')).toHaveValue('Is there still gold in the barrow?')
  // The journal shows the ruling for each interpreted entry.
  await expect(page.getByRole('region', { name: 'Journal' })).toContainText(reading.ruling)

  // The reading shows no alternate, time or direction, and the structured output doesn't ask for them.
  await expect(page.getByRole('button', { name: 'Use this reading' })).toHaveCount(0)
  // `body` is set inside the route handler, so TypeScript can't see it isn't null here.
  const sent = body as unknown as { output_config: { format: { schema: { properties: object } } } }
  expect(Object.keys(sent.output_config.format.schema.properties)).toEqual([
    'ruling',
    'why',
    'follow_ups',
    'new_facts',
  ])

  // The player notes what happened; the next request carries the ruling and the note.
  await page.getByLabel('What happened').fill('Thuel found dragon bones in the crypt')
  await page.getByLabel('What happened').blur()
  await expect(page.getByRole('region', { name: 'Journal' })).toContainText('Thuel found dragon bones in the crypt')
  await page.getByRole('button', { name: 'Cast the Bones' }).click()
  await page.getByRole('button', { name: 'Interpret' }).click()
  await expect(page.getByLabel('What happened')).toHaveValue('')
  await expect.poll(() => posts).toBe(2)
  const history = JSON.stringify(body)
  expect(history).toContain(`Ruling: ${reading.ruling}`)
  expect(history).toContain('What happened: Thuel found dragon bones in the crypt')
  // The lazily loaded SDK chunk and the API call are both allowed by the policy.
  expect(problems).toEqual([])
})

test('with a key saved, the SDK is fetched before the first Interpret; without one, never', async ({ page }) => {
  const chunks: string[] = []
  page.on('request', (r) => {
    if (/\/assets\/client-[\w-]+\.js$/.test(r.url())) chunks.push(r.url())
  })
  await page.goto('/')
  await page.waitForTimeout(500)
  expect(chunks).toEqual([])

  await page.getByLabel('Anthropic API key').fill('sk-ant-e2e')
  await page.locator('.ai-settings').getByRole('button', { name: 'Save' }).click()
  await expect.poll(() => chunks.length, { timeout: 8000 }).toBe(1)
  await expect(page.getByRole('button', { name: 'Interpret' })).toHaveCount(0)
})
