import { Link } from "react-router-dom"
import LegalPage from "../components/LegalPage"
import { ISSUES_URL, LEGAL_UPDATED } from "../legal"

const sections = [
  {
    id: "service", title: "The service",
    body: (
      <p>RevLens helps hosts understand their guest reviews. It is free and non-commercial, run by Abhinesh Gangwar as
        an independent project. It is provided as it is: features may change, and the service may be paused or
        stopped. We'll try to give notice before stopping it so you can delete or copy your data.</p>
    ),
  },
  {
    id: "account", title: "Your account",
    body: (
      <ul>
        <li>Give accurate details and keep your password private. You're responsible for what happens in your account.</li>
        <li>One account per person. You must be 18 or over.</li>
        <li>You can delete your account at any time in <Link to="/dashboard/settings">Settings</Link>.</li>
      </ul>
    ),
  },
  {
    id: "content", title: "Your content",
    body: (
      <>
        <p>You keep ownership of everything you add. You allow RevLens to store and process it only to run the service
          for you: labelling reviews, drafting replies and answering your questions. If you opt in to <strong>Help
          improve RevLens</strong>, you also allow your reviews and corrections to be used to train RevLens's model,
          as described in the <Link to="/privacy#training">Privacy Policy</Link>.</p>
        <p>Only add reviews you're entitled to use, such as reviews of your own properties, and follow the terms of
          the platforms you copy them from.</p>
      </>
    ),
  },
  {
    id: "ai", title: "AI output can be wrong",
    body: (
      <p>Labels, reply drafts and answers are produced by AI models and keyword rules, and can be wrong. Check them
        before you rely on them. RevLens never posts anything or contacts a guest for you: you decide what to send.</p>
    ),
  },
  {
    id: "acceptable-use", title: "Acceptable use",
    body: (
      <ul>
        <li>Don't use RevLens for anything unlawful, or to harass anyone.</li>
        <li>Don't try to break its security, overload it, or access other hosts' data.</li>
        <li>Don't upload personal information beyond what reviews normally contain.</li>
      </ul>
    ),
  },
  {
    id: "liability", title: "No warranty",
    body: (
      <p>RevLens is free and comes without warranties. As far as the law allows, we aren't liable for losses caused
        by using it, by mistakes in its output, or by it being unavailable.</p>
    ),
  },
  {
    id: "changes", title: "Changes and contact",
    body: (
      <>
        <p>If these terms change, the date at the top changes. We may suspend accounts that break them.</p>
        <p>Questions: open an issue on <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer">GitHub</a>.
          Issues are public, so don't include personal details.</p>
      </>
    ),
  },
]

export default function Terms() {
  return (
    <LegalPage
      label="Terms"
      title="Terms of Service"
      updated={LEGAL_UPDATED}
      intro="The rules for using RevLens, in plain language. By creating an account you agree to them and to the Privacy Policy."
      sections={sections}
    />
  )
}
