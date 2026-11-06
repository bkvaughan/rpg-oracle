import type { TimeIcon as Icon } from '../../data/deck.ts'

// Sun or moon, light or dark, echoing the icons printed on the cards. Decorative: the
// period is always given in text beside it.

export default function TimeIcon({ icon }: { icon: Icon }) {
  const dark = icon.startsWith('dark')
  const sun = icon.endsWith('sun')
  return (
    <svg className={`time-icon ${dark ? 'dark' : 'light'}`} viewBox="0 0 24 24" aria-hidden="true">
      {sun ? (
        <>
          <circle cx="12" cy="12" r="5" />
          {Array.from({ length: 8 }, (_, i) => (
            <line key={i} x1="12" y1="2.5" x2="12" y2="5.5" transform={`rotate(${i * 45} 12 12)`} />
          ))}
        </>
      ) : (
        <path d="M15 3a9 9 0 1 0 6 15A7.5 7.5 0 0 1 15 3z" />
      )}
    </svg>
  )
}
