import { describe, expect, test } from 'vitest'
import { bonesEntry, sampleSession, signsEntry } from '../state/fixtures.ts'
import { buildUserPrompt, SYSTEM_PROMPT } from './prompt.ts'

describe('SYSTEM_PROMPT', () => {
  test('lists every card with its words and art', () => {
    expect(SYSTEM_PROMPT).toContain('31. Magician / Conjuring / Learned / Enchanted (Light Moon, SE). Art: A robed, belted wizard')
    expect(SYSTEM_PROMPT).toContain('50. Betrayer / Scheming / Suspicious / Division')
  })

  test('tells the model the result is settled', () => {
    expect(SYSTEM_PROMPT).toMatch(/never yours to change/)
  })

  // Caching is a prefix match: the system prompt must not vary between requests.
  test('is static (no dates or ids)', () => {
    expect(SYSTEM_PROMPT).not.toMatch(/\d{4}-\d{2}-\d{2}T/)
  })
})

describe('buildUserPrompt', () => {
  test('states a Bones result as settled fact with the raw dice and reroll', () => {
    const session = sampleSession()
    const prompt = buildUserPrompt(session.journal[1], session)
    expect(prompt).toContain('# Question\nIs there a sentry?')
    expect(prompt).toContain('Tool: Consult the Bones, declared likely Yes.')
    expect(prompt).toContain('Cast: Judgment No, Twins Nil and Nil, Fortune Nil.')
    expect(prompt).toContain('Reroll: the Hammer of Judgment showed the unlikely No and was rerolled to Yes.')
    expect(prompt).toContain('Answer (settled): Yes.')
  })

  test('gives both Signs cards, the primary time and direction, and a rolled hour', () => {
    const entry = { ...signsEntry('s'), result: { tool: 'signs' as const, cardIds: [3, 41], hour: { roll: 3, hour: 3, label: '3am' } } }
    const prompt = buildUserPrompt(entry, { ...sampleSession(), journal: [entry] })
    expect(prompt).toContain('Primary card: 3. Undead / Leeching / Unhinged / Terrifying (Dark Moon, SW)')
    expect(prompt).toContain('Secondary card: 41. Dragon / Searching / Covetous / Gilded (Dark Sun, SE)')
    expect(prompt).toContain('Primary time: Late Night (Midnight–6am). Primary direction: SW.')
    expect(prompt).toContain('Exact hour rolled: 3am.')
  })

  test('includes the session, facts and earlier rulings, but not the entry itself in the history', () => {
    const session = sampleSession()
    const prompt = buildUserPrompt(session.journal[1], session)
    expect(prompt).toContain('PC: Thuel, Barbarian, level 2')
    expect(prompt).toContain('Location: hex 0412 / Small Ruin')
    expect(prompt).toContain('- The barrow lord hunts at night')
    const history = prompt.split('# Recent questions')[1]
    expect(history).toContain("What's going on at this ruin?")
    expect(history).not.toContain('Is there a sentry?')
  })

  test('gives the Activity result, the creature type and the matching examples', () => {
    const entry = { ...bonesEntry('a'), question: 'The goblins at the ford', result: { tool: 'activity' as const, roll: 3 as const, creature: 'intelligent' as const } }
    const prompt = buildUserPrompt(entry, { ...sampleSession(), journal: [entry] })
    expect(prompt).toContain('Tool: the Activity Die, for an intelligent creature.')
    expect(prompt).toContain('Result (settled): 3 Eating.')
    expect(prompt).toContain('Example activities: Eating, cooking or preparing food')
  })

  test('the system prompt explains the Activity Die', () => {
    expect(SYSTEM_PROMPT).toContain('1 Threat, 2 Socialising, 3 Eating, 4 Working, 5 Traveling, 6 Resting')
  })

  test('copes with an empty session and no question', () => {
    const entry = { ...bonesEntry('b'), question: '' }
    const prompt = buildUserPrompt(entry, { ...sampleSession(), pc: { name: '', class: '', level: 1 }, location: { hex: '', site: '', room: '' }, facts: [], journal: [entry] })
    expect(prompt).toContain('(No question: interpret the result for the current scene.)')
    expect(prompt).toContain('PC: not given')
    expect(prompt).toContain('# Established facts\nNone yet.')
    expect(prompt).toContain('# Recent questions (oldest first)\nNone yet.')
  })
})
