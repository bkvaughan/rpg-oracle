export default function App() {
  return (
    <>
      <header className="site-header">
        <a className="site-title" href="./">
          <svg className="flame" viewBox="0 0 24 32" aria-hidden="true">
            <path d="M12 1c1 6 8 9 8 18a8 8 0 0 1-16 0c0-5 3-7 4-11 1 3 2 4 3 4-1-4 0-8 1-11z" />
          </svg>
          RPG Oracle
        </a>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">Tales of Argosa</p>
          <h1 className="display">RPG Oracle</h1>
          <p className="lede">Read the Signs. Consult the Bones. Let the dark answer.</p>
          <hr className="rule" />
        </section>
      </main>

      <footer className="site-footer">
        <p>
          Unofficial fan tool; not affiliated with Pickpocket Press. Card art credited on the{' '}
          <a href="https://perchance.org/tales-of-argosa-read-the-signs">official Deck of Signs</a>.
        </p>
      </footer>
    </>
  )
}
