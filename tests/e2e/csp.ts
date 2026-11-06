import type { Page } from '@playwright/test'

/** Collects Content-Security-Policy violations and page errors for the test to assert on. */
export function watchForViolations(page: Page): string[] {
  const problems: string[] = []
  page.on('console', (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) problems.push(m.text())
  })
  page.on('pageerror', (e) => problems.push(e.message))
  return problems
}
