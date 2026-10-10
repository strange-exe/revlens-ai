import { Link } from "react-router-dom"
import LegalPage from "../components/LegalPage"
import { ISSUES_URL, PRIVACY_UPDATED } from "../legal"

// Keep in step with the backend: TRAINING_CONSENT_VERSION in backend/app/main.py names this wording.
const sections = [
  {
    id: "what-we-store", title: "What we store",
    body: (
      <>
        <ul>
          <li><strong>Your account:</strong> your email address and name, and either a hashed password (never the
            password itself) or, if you sign in with Google, your Google account ID and profile picture.</li>
          <li><strong>Your properties:</strong> the name, location and any details you enter.</li>
          <li><strong>Reviews you add or import:</strong> the guest's name as written on the review, the rating, date,
            platform and text; the labels RevLens adds (sentiment, spam, aspects) and where each label came from; and
            any reply you save.</li>
          <li><strong>Your training-data choice:</strong> whether you opted in, when, and which version of this policy
            you agreed to.</li>
        </ul>
        <p>In your browser, RevLens keeps your sign-in token, a copy of your profile, your light or dark theme, and a
          temporary copy of your dashboard data that is cleared when you sign out. There are no analytics, advertising
          or tracking cookies.</p>
      </>
    ),
  },
  {
    id: "who-processes", title: "Who else handles your data",
    body: (
      <>
        <p>RevLens doesn't sell your data or show ads. These services run parts of RevLens for us:</p>
        <ul>
          <li><strong>Supabase</strong> hosts the database, in Mumbai, India.</li>
          <li><strong>Render</strong> runs the RevLens server. Our own AI model, which labels your reviews, runs there
            too, so labelling doesn't send your reviews anywhere else.</li>
          <li><strong>Cloudflare</strong> serves the website.</li>
          <li><strong>Google</strong> handles "Sign in with Google" if you use it. Google's <strong>Gemini API</strong>
            drafts replies, answers your questions about your reviews, and labels reviews if our model is unavailable.
            For this, the review text and property name are sent to Gemini, with names, email addresses and phone
            numbers replaced by placeholders first; guest names are never sent. Our name detection catches most names
            but not every one (for example, a name that is also an ordinary word). RevLens uses Gemini's
            free tier, and under Google's terms for that tier Google may use what is sent to improve its products, and
            human reviewers may read it.</li>
          <li><strong>Hugging Face</strong> stores our model files privately. None of your data goes there.</li>
        </ul>
      </>
    ),
  },
  {
    id: "training", title: "Training our model (off unless you opt in)",
    body: (
      <>
        <p>RevLens's model learned from public hotel reviews licensed for research only. To build a model that knows
          homestays, we'd like to learn from real hosts, but only with permission.</p>
        <p>If you turn on <strong>Help improve RevLens</strong> in Settings, the reviews you've added and the
          corrections you make to labels may be used to train future versions of the model. Before any of it is used,
          guest names and contact details are removed.</p>
        <p>It is off by default. You can turn it off at any time: your data is then left out of every future training
          set. A model that was already trained can't un-learn what it saw, but it won't be trained on your data again.</p>
      </>
    ),
  },
  {
    id: "retention", title: "How long we keep it, and deleting it",
    body: (
      <>
        <p>We keep your data until you delete it. You can delete single reviews at any time, and delete your whole
          account in <Link to="/dashboard/settings">Settings</Link>. Deleting your account immediately removes your
          account, your properties and their reviews from our database. Copies may remain in our hosting providers'
          backups for a limited time before they expire.</p>
        <p>Text already sent to Gemini is handled under Google's terms and can't be recalled by us.</p>
      </>
    ),
  },
  {
    id: "guests", title: "Guests' information",
    body: (
      <p>Reviews contain guests' names and words. We use them only to run RevLens for you: to label them, draft
        replies and answer your questions. Guest names are never sent to Gemini; names, email addresses and phone
        numbers inside review text are replaced with placeholders before it is sent, and put back only in what you
        see. Names and contact details are removed before any training use.</p>
    ),
  },
  {
    id: "choices", title: "Your choices",
    body: (
      <ul>
        <li>See everything we hold about your properties and reviews in your dashboard.</li>
        <li>Correct any label or review, or delete it.</li>
        <li>Turn training-data use on or off in Settings.</li>
        <li>Delete your account in Settings.</li>
      </ul>
    ),
  },
  {
    id: "changes", title: "Changes and contact",
    body: (
      <>
        <p>If this policy changes, the date at the top changes. If the training-data section changes, we'll ask
          hosts who opted in to agree again before using their data under the new wording.</p>
        <p>RevLens is run by Abhinesh Gangwar, an independent developer. For questions, open an issue on <a
          href={ISSUES_URL} target="_blank" rel="noopener noreferrer">GitHub</a>. Issues are public, so don't include
          personal details there; to delete your data, use Settings.</p>
        <p>RevLens is not intended for anyone under 18.</p>
      </>
    ),
  },
]

export default function Privacy() {
  return (
    <LegalPage
      label="Privacy"
      title="Privacy Policy"
      updated={PRIVACY_UPDATED}
      intro="RevLens is a free, non-commercial tool for homestay and small-hotel hosts. This page explains what it stores, who else handles it, and what you can do about it."
      sections={sections}
    />
  )
}
