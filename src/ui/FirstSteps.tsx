// Shown where the result goes until the first question is asked: what each oracle is for,
// in our own words with page references, never the book's prose.

export default function FirstSteps() {
  return (
    <section className="panel first-steps" aria-labelledby="first-steps-title">
      <h2 id="first-steps-title" className="panel-title">
        How to ask
      </h2>
      <ul>
        <li>
          <strong>Read the Signs</strong> for open questions: who, what, why. Two cards are drawn; build the answer from
          their words and art (<em>Tales of Argosa</em> p.213).
        </li>
        <li>
          <strong>Consult the Bones</strong> for yes or no. Say how likely a Yes is; the dice add strength and a twist
          (p.212).
        </li>
        <li>
          <strong>Interpret</strong> turns a result into a ruling for your scene. It's optional and needs your own
          Anthropic key, set in AI settings.
        </li>
      </ul>
      <p className="secondary">
        Press <kbd>/</kbd> to jump to the question.
      </p>
    </section>
  )
}
