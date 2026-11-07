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

  test('includes the facts and earlier rulings, but not the entry itself in the history', () => {
    const session = sampleSession()
    const prompt = buildUserPrompt(session.journal[1], session)
    expect(prompt).toContain('- The barrow lord hunts at night')
    const history = prompt.split('# Recent questions')[1]
    expect(history).toContain("What's going on at this ruin?")
    expect(history).not.toContain('Is there a sentry?')
  })

  test('gives the player\'s notes: in the history, and for the entry itself', () => {
    const session = sampleSession()
    session.journal[0] = { ...session.journal[0], note: 'Thuel climbed the wall' }
    const entry = { ...session.journal[1], note: 'She fled into the crypt' }
    const prompt = buildUserPrompt(entry, session)
    expect(prompt).toContain("# What happened (player's note)\nShe fled into the crypt")
    expect(prompt.split('# Recent questions')[1]).toContain('. What happened: Thuel climbed the wall')
    expect(buildUserPrompt(session.journal[1], session)).not.toContain("player's note")
  })

  test('gives the session context first, and leaves the section out when there is none', () => {
    const session = { ...sampleSession(), context: '  Thuel, a barbarian, hunts the barrow lord.\n' }
    const prompt = buildUserPrompt(session.journal[1], session)
    expect(prompt.startsWith('# Session context (from the player)\nThuel, a barbarian, hunts the barrow lord.\n\n# Question')).toBe(true)
    expect(buildUserPrompt(session.journal[1], { ...session, context: '  ' })).not.toContain('# Session context')
  })

  test('the system prompt treats the session context as established', () => {
    expect(SYSTEM_PROMPT).toContain("The session context, if given, is the player's own background")
  })

  test('the system prompt treats player notes as established', () => {
    expect(SYSTEM_PROMPT).toContain('notes ("What happened") are what actually happened in play')
  })

  test('gives the Activity result, the creature type and the matching examples', () => {
    const entry = { ...bonesEntry('a'), question: 'The goblins at the ford', result: { tool: 'activity' as const, roll: 3 as const, creature: 'intelligent' as const } }
    const prompt = buildUserPrompt(entry, { ...sampleSession(), journal: [entry] })
    expect(prompt).toContain('Tool: the Activity Die, for an intelligent creature.')
    expect(prompt).toContain('Activity (settled): 3 Eating.')
    expect(prompt).toContain('Example activities: Eating, cooking or preparing food')
  })

  test('gives Activity & Reaction with its dice, band and the Activity read from the first die', () => {
    const entry = { ...bonesEntry('r'), question: 'The guards at the gate', result: { tool: 'reaction' as const, dice: [3, 2] as [3, 2], creature: 'intelligent' as const } }
    const prompt = buildUserPrompt(entry, { ...sampleSession(), journal: [entry] })
    expect(prompt).toContain('Tool: Activity & Reaction (2d6, balanced chart), for an intelligent creature; the first die is the Activity Die.')
    expect(prompt).toContain('Dice: 3 and 2.')
    expect(prompt).toContain('Reaction (settled): 5 Unfriendly.')
    expect(prompt).toContain('Activity (settled): 3 Eating.')
  })

  test('the system prompt explains Activity & Reaction', () => {
    expect(SYSTEM_PROMPT).toContain('2-3 Hostile, 4-5 Unfriendly, 6-8 Neutral, 9-10 Fairly friendly, 11-12 Affable')
  })

  test('the system prompt asks for no alternate, time or direction fields, and has the ruling tie in time or direction', () => {
    for (const field of ['- alternate:', '- time:', '- direction:', '\nalternate:', '\ntime:', '\ndirection:']) {
      expect(SYSTEM_PROMPT).not.toContain(field)
    }
    expect(SYSTEM_PROMPT).toContain("tie in the primary card's time or direction when it matters")
  })

  test('the system prompt explains the Activity Die', () => {
    expect(SYSTEM_PROMPT).toContain('1 Threat, 2 Socialising, 3 Eating, 4 Working, 5 Traveling, 6 Resting')
  })

  test('copes with an empty session and no question', () => {
    const entry = { ...bonesEntry('b'), question: '' }
    const prompt = buildUserPrompt(entry, { ...sampleSession(), facts: [], journal: [entry] })
    expect(prompt).toContain('(No question: interpret the result for the current scene.)')
    expect(prompt).not.toContain('# Session')
    expect(prompt).toContain('# Established facts\nNone yet.')
    expect(prompt).toContain('# Recent questions (oldest first)\nNone yet.')
  })
})
