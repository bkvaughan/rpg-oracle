import { expect, test } from '@playwright/test'

test.use({ reducedMotion: 'reduce' })

const reading = {
  ruling: 'Applying Undead and Covetous, a dead lord hoards here.',
  why: 'The words point to a greedy corpse.',
  alternate: 'A literal dragon skeleton.',
  time: 'Late Night',
  direction: 'SW: where the robbers fled',
  follow_ups: [{ question: 'Is there still gold in the barrow?', tool: 'bones', likelihood: 'likely-yes' }],
  new_facts: ['A dead lord hoards in the ruin'],
}

// Intercepts the browser's call to the Anthropic API: proves the SDK request is made from the
// page with the player's key and the expected body, without spending real money.
test('Interpret calls the Anthropic API with the saved key and shows the reading', async ({ page }) => {
  let body: Record<string, unknown> | null = null
  let key: string | null = null
  await page.route('https://api.anthropic.com/**', async (route) => {
    const request = route.request()
    // The browser sends a CORS preflight first; answer it and record only the real call.
    if (request.method() === 'POST') {
      body = request.postDataJSON()
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

  await page.getByLabel('Your question').fill("What's going on at this ruin?")
  await page.getByRole('button', { name: 'Draw two cards' }).click()
  await page.getByRole('button', { name: 'Interpret' }).click()

  await expect(page.getByText(reading.ruling)).toBeVisible()
  // SDK 1.x with API version 2026-10-21 sends the key as a bearer token.
  expect(key).toBe('Bearer sk-ant-e2e')
  expect(body).toMatchObject({ model: 'claude-opus-5-5', fallbacks: 'default', output_config: { effort: 'medium' } })
  expect(JSON.stringify(body)).toContain("What's going on at this ruin?")

  await page.getByRole('button', { name: /Is there still gold in the barrow\?/ }).click()
  await expect(page.getByLabel('Your question')).toHaveValue('Is there still gold in the barrow?')
})
