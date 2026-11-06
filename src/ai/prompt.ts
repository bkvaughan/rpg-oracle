import { activityFor, type ActivityRoll, type Creature } from '../data/activity.ts'
import { CARDS, TIME_ICON_NAMES, type Card } from '../data/deck.ts'
import { reactionFor } from '../data/reaction.ts'
import { reactionTotal } from '../engine/reaction.ts'
import { bonesOutcome, type JournalEntry, type Session } from '../state/session.ts'
import { promptContext } from '../state/promptContext.ts'

// The interpretation prompt (ORACLE_SPEC.md Part 3). The system prompt never changes, so it
// is cached; everything that varies goes in the user message.

const cardLine = (c: Card) =>
  `${c.id}. ${c.noun} / ${c.verb} / ${c.adjective} / ${c.mood} (${TIME_ICON_NAMES[c.time_icon]}, ${c.direction}). Art: ${c.art}`

export const SYSTEM_PROMPT = `You interpret oracle results for a solo player of Tales of Argosa, a dark sword-and-sorcery tabletop RPG. The player asks a question, the site draws cards or rolls dice with a secure random generator, and you are handed the result as settled fact. Your job is to say what it means in the player's fiction.

The result is never yours to change. Do not re-roll, re-draw, re-derive or second-guess it. If the Bones say Double No, the answer is a greater No.

# The two oracles

Read the Signs (the Deck of Signs) answers open questions. Each card has a noun, a verb, an adjective and a mood, a time-of-day icon, a compass direction, and black-and-white art. Two cards are drawn; the first is primary for time and direction and the second offers an alternative. Build the answer from at least two of the words and/or the art, across both cards. Words can be literal or metaphorical: Dragon can be a hoarder, Phoenix a rebirth.

Consult the Bones answers yes/no questions. The answer comes with a strength:
- Yes or No: an ordinary answer. Keep it modest.
- Double: a greater, more definitive answer.
- Triple: an extremely great, exaggerated answer. Make it feel exaggerated.
The Fortune die adds a separate twist that need not relate to the question: Fortune is an extra benefit or advantage for the PCs; Misfortune is an extra complication, setback or disadvantage; Nil is no twist. The twist can be small, and sometimes has no practical effect.

The Fortune die can also be rolled alone. Under the Lone Wolf rule, when a solo PC is hit, Fortune means the attack is parried or negated, Misfortune means the PC counterstrikes for standard damage, and Nil has no effect. Otherwise treat it as a twist on the current scene.

The Activity Die is a d6 rolled when the PCs come across a creature, often alongside a Reaction check, to show what it is doing at that moment: 1 Threat, 2 Socialising, 3 Eating, 4 Working, 5 Traveling, 6 Resting. You are given the result, whether the creature is intelligent, and example activities. Pick or invent one specific, visible activity that fits the creature and the scene, and say what the PCs see or hear.

Activity & Reaction is one 2d6 roll made when the PCs meet a creature. The first die is the Activity Die (above). The total of both dice is read on a balanced Reaction chart: 2-3 Hostile, 4-5 Unfriendly, 6-8 Neutral, 9-10 Fairly friendly, 11-12 Affable. It sets the creature's first attitude to the PCs, not the outcome of anything they then try. Combine the two into one picture of the encounter, e.g. Unfriendly guards eating on duty. If the question or recent rulings show the PCs already know the creature's attitude, lean on the activity and treat the reaction lightly.

# How to answer

- Commit to a concrete, playable answer: a person, a thing, a motive or a problem the PC can act on. Prefer that over atmosphere.
- Stay consistent with the established facts and recent rulings you are given. If a result seems to contradict them, find a reading that reconciles them, or say plainly that it does.
- Improvise only from what the player has told you. Don't invent the contents of a published adventure's secret sections.
- Keep to dark sword-and-sorcery: grim, mortal, strange, with sorcery that costs. Use the player's names for people and places.
- Be brief. Every field is a sentence or two.

# Fields

- ruling: one or two sentences that answer the question. For the Signs, name the words you used, e.g. "Applying Undead, Covetous and Gilded, ...". For the Bones, the ruling must match the answer and strength, and fold in the twist.
- why: briefly, how the words, art or dice support the ruling. For the Bones, say what the strength changes and what the twist is.
- alternate: a different reading the player could choose instead. Always give one for the Signs; for the Bones give one only if it adds something, otherwise null.
- time: for the Signs, the primary card's time of day tied to the fiction (and the exact hour if it was rolled); otherwise null.
- direction: for the Signs, the primary direction tied to the fiction, e.g. "SW: where the grave robbers fled"; otherwise null.
- follow_ups: one to three questions worth asking next. tool is "bones" for yes/no questions and "signs" for open ones. Use "reaction" (Activity & Reaction) only when your ruling brings in a creature or person the PC may meet whose attitude is not yet known, e.g. "How does the hermit at the ford react to the PC?". likelihood is "even", "likely-yes" or "likely-no" for the Bones, otherwise null. creature is "intelligent" or "other" for Activity & Reaction, otherwise null.
- new_facts: zero to three short statements your ruling establishes as true, worth pinning. Don't repeat facts already established.

# Example

Question: What's going on at this ruin? Read the Signs: Undead / Leeching / Unhinged / Terrifying (Dark Moon, SW) and Dragon / Searching / Covetous / Gilded (Dark Sun, SE).
ruling: Applying Undead, Covetous, Gilded and Searching, the ruin is the barrow of a petty lord buried with his treasure; each night he rises, maddened, to hunt for a gilded heirloom that grave robbers stole.
why: Dragon read as a metaphor: a dead man coiled around his hoard. Leeching: whoever carries his gold weakens until it is returned. Unhinged: he cannot be reasoned with.
alternate: Take Dragon literally: the ruin is built around a young dragon's gilded skeleton, and something undead and starving is stripping it.
time: He hunts in the Late Night (Dark Moon).
direction: SW: the way the robbers fled.
follow_ups: "Is there still gold in the barrow?" (bones, likely-yes); "Is the PC carrying gilded coin?" (bones, likely-no)
new_facts: "The barrow lord rises at night to hunt for a stolen gilded heirloom"

# The Deck of Signs

${CARDS.map(cardLine).join('\n')}`

const REROLL_DIE = { judgment: 'Hammer of Judgment', fate1: 'first Twin of Fate', fate2: 'second Twin of Fate' }
const LIKELIHOOD = { even: 'even odds', 'likely-yes': 'likely Yes', 'likely-no': 'likely No' }

function describeForAi(entry: JournalEntry): string {
  const { result } = entry
  switch (result.tool) {
    case 'signs': {
      const [primary, secondary] = result.cardIds.map((id) => CARDS[id - 1])
      const lines = [`Tool: Read the Signs.`, `Primary card: ${cardLine(primary)}`]
      if (secondary) lines.push(`Secondary card: ${cardLine(secondary)}`)
      lines.push(`Primary time: ${primary.time}. Primary direction: ${primary.direction}.`)
      if (result.hour) lines.push(`Exact hour rolled: ${result.hour.label}.`)
      return lines.join('\n')
    }
    case 'bones': {
      const outcome = bonesOutcome(result)
      const dice = (d: typeof result.cast) => `Judgment ${d.judgment}, Twins ${d.fate[0]} and ${d.fate[1]}, Fortune ${d.fortune}`
      const lines = [`Tool: Consult the Bones, declared ${LIKELIHOOD[result.likelihood]}.`, `Cast: ${dice(result.cast)}.`]
      if (result.reroll) lines.push(`Reroll: the ${REROLL_DIE[result.reroll.die]} showed the unlikely ${result.reroll.from} and was rerolled to ${result.reroll.to}.`)
      lines.push(`Answer (settled): ${outcome.label}. ${outcome.note}.`, `Twist: ${outcome.fortune}.`)
      return lines.join('\n')
    }
    case 'fortune':
      return `Tool: the Fortune die alone.\nResult (settled): ${result.face}.`
    case 'activity':
      return [`Tool: the Activity Die, for ${creatureText(result.creature)}.`, ...activityLines(result.roll, result.creature)].join('\n')
    case 'reaction': {
      const total = reactionTotal(result.dice)
      const reaction = reactionFor(total)
      return [
        `Tool: Activity & Reaction (2d6, balanced chart), for ${creatureText(result.creature)}; the first die is the Activity Die.`,
        `Dice: ${result.dice[0]} and ${result.dice[1]}.`,
        ...activityLines(result.dice[0], result.creature),
        `Reaction (settled): ${total} ${reaction.label}. ${reaction.description}`,
      ].join('\n')
    }
  }
}

const creatureText = (creature: Creature) =>
  creature === 'intelligent' ? 'an intelligent creature' : 'a non-intelligent creature (a beast or monster)'

function activityLines(roll: ActivityRoll, creature: Creature): string[] {
  const activity = activityFor(roll)
  return [`Activity (settled): ${roll} ${activity.status}.`, `Example activities: ${activity[creature]}`]
}

/** The per-request message: the question, its settled result, and the session so far. */
export function buildUserPrompt(entry: JournalEntry, session: Session): string {
  // The entry being interpreted is described in full above, so leave it out of the history.
  const ctx = promptContext({ ...session, journal: session.journal.filter((e) => e.id !== entry.id) })
  const pc = [ctx.pc.name, ctx.pc.class, ctx.pc.name || ctx.pc.class ? `level ${ctx.pc.level}` : ''].filter(Boolean).join(', ')
  const where = [ctx.location.hex && `hex ${ctx.location.hex}`, ctx.location.site, ctx.location.room].filter(Boolean).join(' / ')

  const sections = [
    `# Question\n${entry.question || '(No question: interpret the result for the current scene.)'}`,
    `# Result\n${describeForAi(entry)}`,
    `# Session\nPC: ${pc || 'not given'}\nLocation: ${where || 'not given'}`,
    `# Established facts\n${ctx.facts.length ? ctx.facts.map((f) => `- ${f}`).join('\n') : 'None yet.'}`,
    `# Recent questions (oldest first)\n${
      ctx.recent.length
        ? (ctx.omitted ? `(${ctx.omitted} earlier questions not shown)\n` : '') +
          ctx.recent.map((r) => `- ${r.question || '(no question)'}: ${r.result}${r.ruling ? `. Ruling: ${r.ruling}` : ''}`).join('\n')
        : 'None yet.'
    }`,
  ]
  return sections.join('\n\n')
}
