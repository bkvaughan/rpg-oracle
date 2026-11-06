import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import ActivityResult from './ActivityResult.tsx'
import BonesResult from './BonesResult.tsx'
import ReactionResult from './ReactionResult.tsx'
import FortuneResult from './FortuneResult.tsx'
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
    expect(screen.getByRole('img', { name: 'd6: 2' })).toBeInTheDocument()
    expect(document.querySelector('.reaction-status')).toHaveTextContent('5 Unfriendly')
    expect(screen.getByText('Activity (the 3 on the Activity Die)')).toBeInTheDocument()
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
