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
  alternate: z.string().nullable(),
  time: z.string().nullable(),
  direction: z.string().nullable(),
  follow_ups: z.array(followUpSchema),
  new_facts: z.array(z.string()),
})

export type FollowUp = z.infer<typeof followUpSchema>
export type Reading = z.infer<typeof readingSchema>
