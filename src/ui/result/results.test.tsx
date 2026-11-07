import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import ActivityResult from './ActivityResult.tsx'
import BonesResult from './BonesResult.tsx'
import ReactionResult from './ReactionResult.tsx'
import FortuneResult from './FortuneResult.tsx'
import Interpretation from './Interpretation.tsx'
import ReadingView from './ReadingView.tsx'
import ResultView from './ResultView.tsx'
import SignsResult from './SignsResult.tsx'

describe('SignsResult', () => {
  // ORACLE_SPEC.md Part 4 draw: #3 Undead (Dark Moon, SW) and #41 Dragon (Dark Sun, SE).
  test('shows both cards, the primary time and direction, and the secondary as an option', () => {
    render(<SignsResult result={{ tool: 'signs', cardIds: [3, 41], hour: null }} />)
    expect(screen.getByRole('img', { name: /^Undead · Leeching · Unhinged · Terrifying\. A robed skeletal lich/ })).toHaveAttribute(
      'src',
      'cards/03.webp',
    )
    expect(screen.getByRole('img', { name: /^Dragon · Searching/ })).toBeInTheDocument()
    expect(screen.getByText('Late Night (Midnight–6am)')).toBeInTheDocument()
    expect(screen.getByText(/or Dark Sun: Afternoon/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Compass: primary direction SW, secondary SE' })).toBeInTheDocument()
  })

  test('offers to roll the exact hour, then shows it', async () => {
    const onRollHour = vi.fn()
    const { rerender } = render(<SignsResult result={{ tool: 'signs', cardIds: [3, 41], hour: null }} onRollHour={onRollHour} />)
    await userEvent.click(screen.getByRole('button', { name: 'Roll exact hour' }))
    expect(onRollHour).toHaveBeenCalledOnce()
    rerender(<SignsResult result={{ tool: 'signs', cardIds: [3, 41], hour: { roll: 3, hour: 3, label: '3am' } }} onRollHour={onRollHour} />)
    expect(screen.getByText('3am')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Roll exact hour' })).not.toBeInTheDocument()
  })
})

describe('BonesResult', () => {
  // ORACLE_SPEC.md Part 4: even odds, Judgment No, Twins No and Nil, Fortune -> Double No with Fortune.
  test('shows the cast, a Double answer and the Fortune twist', () => {
    const dice = { judgment: 'No', fate: ['No', 'Nil'], fortune: 'Fortune' } as const
    render(<BonesResult result={{ tool: 'bones', likelihood: 'even', cast: { ...dice, fate: [...dice.fate] }, reroll: null, final: { ...dice, fate: [...dice.fate] } }} />)
    expect(screen.getByText('Even odds')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Hammer of Judgment: No' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Twin of Fate: blank' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Fortune die: Fortune (sun)' })).toBeInTheDocument()
    expect(screen.getByText('Double')).toBeInTheDocument()
    expect(screen.getByText(/greater, more definitive/)).toBeInTheDocument()
    expect(screen.getByText(/^Fortune: an extra benefit/)).toBeInTheDocument()
  })

  test('shows a reroll as the original face and what it became', () => {
    render(
      <BonesResult
        result={{
          tool: 'bones',
          likelihood: 'likely-yes',
          cast: { judgment: 'No', fate: ['Nil', 'Nil'], fortune: 'Nil' },
          reroll: { die: 'judgment', from: 'No', to: 'Yes' },
          final: { judgment: 'Yes', fate: ['Nil', 'Nil'], fortune: 'Nil' },
        }}
      />,
    )
    expect(screen.getByText(/Judgment showed the unlikely No → rerolled to/)).toHaveTextContent('rerolled to Yes')
    expect(screen.getByRole('img', { name: 'Hammer of Judgment: Yes' })).toBeInTheDocument()
    expect(screen.getByText('Yes', { selector: '.bones-answer' })).toBeInTheDocument()
    expect(screen.getByText('No twist.')).toBeInTheDocument()
  })
})

describe('ActivityResult', () => {
  test('shows the roll and status, the chosen creature type first, and the other type too', () => {
    render(<ActivityResult result={{ tool: 'activity', roll: 1, creature: 'other' }} />)
    expect(screen.getByRole('img', { name: 'Activity Die: 1, Threat' })).toBeInTheDocument()
    expect(screen.getByText('Other creature', { selector: '.label' })).toBeInTheDocument()
    expect(screen.getByText(/^Ambushing, fighting, caught by a trap/)).toBeInTheDocument()
    expect(screen.getByText(/^Intelligent creature: Ambushing, fighting someone/)).toBeInTheDocument()
  })
})

describe('ReactionResult', () => {
  test('book example: 3 and 2 is Unfriendly, and the 3 on the Activity Die is Eating', () => {
    render(<ReactionResult result={{ tool: 'reaction', dice: [3, 2], creature: 'intelligent' }} />)
    expect(screen.getByText('Reaction (3 + 2 = 5)')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Activity Die: 3, Eating' })).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: /^d6/ }).map((d) => d.getAttribute('aria-label'))).toEqual(['d6 (Activity Die): 3', 'd6: 2'])
    expect(document.querySelector('.reaction-status')).toHaveTextContent('5 Unfriendly')
    // Activity comes first, Reaction underneath.
    const parts = screen.getAllByRole('region').map((r) => r.getAttribute('aria-label'))
    expect(parts).toEqual(['Activity', 'Reaction'])
    expect(screen.getByText(/^Eating, cooking or preparing food/)).toBeInTheDocument()
  })
})

describe('FortuneResult', () => {
  test('explains the face and its Lone Wolf meaning', () => {
    render(<FortuneResult face="Misfortune" />)
    expect(screen.getByRole('img', { name: 'Fortune die: Misfortune (skull)' })).toBeInTheDocument()
    expect(screen.getByText(/counterstrikes for standard damage/)).toBeInTheDocument()
  })
})

describe('Interpretation', () => {
  test('Escape cancels a running request, quietly', async () => {
    const user = userEvent.setup()
    const { AiError } = await import('../../ai/errors.ts')
    const onInterpret = (signal: AbortSignal) =>
      new Promise<void>((_, reject) => signal.addEventListener('abort', () => reject(new AiError('cancelled', 'Cancelled.'))))
    render(
      <Interpretation reading={null} hasKey onInterpret={onInterpret} onPinFact={() => {}} onFollowUp={() => {}} />,
    )
    await user.click(screen.getByRole('button', { name: 'Interpret' }))
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('aria-keyshortcuts', 'Escape')
    await user.keyboard('{Escape}')
    expect(await screen.findByRole('button', { name: 'Interpret' })).toBeEnabled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('re-interpreting keeps the old reading visible but dimmed, with a way to cancel', async () => {
    const user = userEvent.setup()
    const reading = { ruling: 'A sentry.', why: 'Yes.', follow_ups: [], new_facts: [] }
    const { container } = render(
      <Interpretation
        reading={reading}
        hasKey
        onInterpret={() => new Promise<void>(() => {})}
        onPinFact={() => {}}
        onFollowUp={() => {}}
      />,
    )
    expect(container.querySelector('.reading-stale')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Interpret again' }))
    expect(screen.getByRole('status')).toHaveTextContent('The oracle considers')
    expect(container.querySelector('.interpretation')).toHaveAttribute('aria-busy', 'true')
    expect(container.querySelector('.reading-stale')).toHaveTextContent('A sentry.')
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  test('closing the result cancels a running request', async () => {
    const user = userEvent.setup()
    let signal: AbortSignal | undefined
    const onInterpret = vi.fn((s: AbortSignal) => {
      signal = s
      return new Promise<void>(() => {})
    })
    const { unmount } = render(
      <Interpretation reading={null} hasKey onInterpret={onInterpret} onPinFact={() => {}} onFollowUp={() => {}} />,
    )
    await user.click(screen.getByRole('button', { name: 'Interpret' }))
    expect(signal?.aborted).toBe(false)
    unmount()
    expect(signal?.aborted).toBe(true)
  })
})

describe('ReadingView', () => {
  test('shows the ruling and why, with no alternate, time or direction', () => {
    const reading = { ruling: 'A sentry, but she is distracted.', why: 'Single Yes with Fortune.', follow_ups: [], new_facts: [] }
    const { container } = render(<ReadingView reading={reading} onPinFact={() => {}} onFollowUp={() => {}} />)
    expect(container.querySelector('.reading-ruling')).toHaveTextContent(reading.ruling)
    expect(screen.getByText(reading.why)).toBeInTheDocument()
    for (const label of ['Or', 'When', 'Where']) expect(screen.queryByText(label)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Use this reading/ })).not.toBeInTheDocument()
  })
})

describe('ResultView note', () => {
  test('saves what happened on blur, only when it changed', async () => {
    const user = userEvent.setup()
    const onSaveNote = vi.fn()
    const entry = {
      id: 'e',
      at: '2026-11-06T20:00:00.000Z',
      question: 'Is there a sentry?',
      result: { tool: 'fortune' as const, face: 'Fortune' as const },
      reading: null,
      note: '',
    }
    render(
      <ResultView
        entry={entry}
        onRollHour={() => {}}
        onSaveNote={onSaveNote}
        hasKey={false}
        onInterpret={async () => {}}
        onPinFact={() => {}}
        onFollowUp={() => {}}
      />,
    )
    const box = screen.getByLabelText('What happened')
    await user.click(box)
    await user.tab()
    expect(onSaveNote).not.toHaveBeenCalled()
    await user.type(box, 'She raised the alarm')
    await user.tab()
    expect(onSaveNote).toHaveBeenCalledWith('She raised the alarm')
  })
})
