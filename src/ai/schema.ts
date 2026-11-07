import { z } from 'zod'

// The AI reading contract from ORACLE_SPEC.md Part 3. Defined here so sessions can store
// readings now; Part 7 sends it to the API as the structured-output format.

export const followUpSchema = z.object({
  question: z.string(),
  tool: z.enum(['signs', 'bones']),
  /** Only meaningful for the Bones. */
  likelihood: z.enum(['even', 'likely-yes', 'likely-no']).nullable(),
})

export const readingSchema = z.object({
  ruling: z.string(),
  why: z.string(),
  follow_ups: z.array(followUpSchema),
  new_facts: z.array(z.string()),
})

// Readings saved on 2026-11-06, while follow-ups could suggest Activity & Reaction, hold
// tool "reaction" and a creature. The session file still loads them and drops those
// follow-ups; the API schema above never offers "reaction".
export const storedReadingSchema = readingSchema.extend({
  follow_ups: z
    .array(followUpSchema.extend({ tool: z.enum(['signs', 'bones', 'reaction']) }))
    .transform((fs) => fs.filter((f): f is FollowUp => f.tool !== 'reaction')),
})

export type FollowUp = z.infer<typeof followUpSchema>
export type Reading = z.infer<typeof readingSchema>
