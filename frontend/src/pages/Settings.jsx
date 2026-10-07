import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import Modal from "../components/ui/Modal"
import Input from "../components/ui/Input"
import Button from "../components/ui/Button"

const formatDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })

function Section({ title, children, tone }) {
  return (
    <section className="grid md:grid-cols-[16rem_1fr] gap-4 md:gap-10 py-8 border-t border-(--color-border) dark:border-(--color-border-dark)">
      <h2 className={`font-heading text-base font-bold ${tone === "danger" ? "text-red-700 dark:text-red-400" : "text-(--color-ink) dark:text-white"}`}>{title}</h2>
      <div className="max-w-[60ch]">{children}</div>
    </section>
  )
}

export default function Settings() {
  const { user, setTrainingConsent, deleteAccount, logout } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [consentError, setConsentError] = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const consented = !!user?.trainingConsentAt
  const emailMatches = confirmEmail.trim().toLowerCase() === (user?.email || "").toLowerCase()

  const toggleConsent = async () => {
    setSaving(true)
    setConsentError("")
    try {
      await setTrainingConsent(!consented)
    } catch (err) {
      setConsentError(`Couldn't save your choice (${err.message || "network error"}). Nothing changed.`)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    setDeleteError("")
    try {
      await deleteAccount(confirmEmail)
      // Leave the protected page first, then clear the session and caches (same render, so no /login bounce)
      navigate("/", { replace: true })
      logout()
    } catch (err) {
      setDeleteError(err.message || "Couldn't delete the account. Nothing was deleted.")
      setDeleting(false)
    }
  }

  const closeDelete = () => {
    if (deleting) return
    setDeleteOpen(false)
    setConfirmEmail("")
    setDeleteError("")
  }

  return (
    <>
      <div className="mb-2">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-(--color-ink) dark:text-white">Settings</h1>
        <p className="text-sm text-(--color-muted) dark:text-(--color-muted-dark) mt-1">Your account and how your data is used.</p>
      </div>

      <div className="mt-8">
        <Section title="Account">
          <dl className="grid grid-cols-[7rem_1fr] gap-y-2 text-sm">
            <dt className="text-(--color-muted) dark:text-(--color-muted-dark)">Name</dt>
            <dd className="text-(--color-ink) dark:text-white">{user?.fullName || "Not set"}</dd>
            <dt className="text-(--color-muted) dark:text-(--color-muted-dark)">Email</dt>
            <dd className="text-(--color-ink) dark:text-white break-all">{user?.email}</dd>
            <dt className="text-(--color-muted) dark:text-(--color-muted-dark)">Sign-in</dt>
            <dd className="text-(--color-ink) dark:text-white">{user?.googleId ? "Google" : "Email and password"}</dd>
          </dl>
        </Section>

        <Section title="Help improve RevLens">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p id="consent-label" className="text-sm font-semibold text-(--color-ink) dark:text-white">
                Let my reviews and corrections train RevLens&rsquo;s model
              </p>
              <p id="consent-desc" className="mt-2 text-sm leading-relaxed text-(--color-muted) dark:text-(--color-muted-dark)">
                Helps build a model that understands homestays. Guest names and contact details are removed first.
                Off unless you turn it on, and you can turn it off at any time.{" "}
                <Link to="/privacy#training" className="font-semibold text-(--color-brand-600) dark:text-(--color-brand-300) underline underline-offset-4">How it works</Link>
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={consented}
              aria-labelledby="consent-label"
              aria-describedby="consent-desc"
              disabled={saving}
              onClick={toggleConsent}
              className="press shrink-0 inline-flex items-center justify-center w-14 h-11 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              <span className={`relative w-11 h-6 rounded-full transition-colors ${consented ? "bg-(--color-brand-600)" : "bg-zinc-300 dark:bg-zinc-600"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${consented ? "translate-x-5" : ""}`} />
              </span>
            </button>
          </div>
          <p aria-live="polite" className="mt-3 text-sm text-(--color-muted) dark:text-(--color-muted-dark)">
            {consented ? `On since ${formatDate(user.trainingConsentAt)}.` : "Off. Your data is not used for training."}
          </p>
          {consentError && <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">{consentError}</p>}
        </Section>

        <Section title="Delete account" tone="danger">
          <p className="text-sm leading-relaxed text-(--color-muted) dark:text-(--color-muted-dark)">
            Permanently deletes your account, your properties and all their reviews. This can&rsquo;t be undone.
          </p>
          <Button variant="danger" size="sm" className="mt-4" onClick={() => setDeleteOpen(true)}>Delete account</Button>
        </Section>
      </div>

      <Modal
        isOpen={deleteOpen}
        onClose={closeDelete}
        title="Delete your account?"
        footer={
          <>
            <Button variant="ghost" onClick={closeDelete} disabled={deleting}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete} disabled={!emailMatches || deleting}>
              {deleting ? "Deleting..." : "Delete everything"}
            </Button>
          </>
        }
      >
        <p>This deletes your account, your properties and every review on them. It can&rsquo;t be undone.</p>
        <div className="mt-5">
          <Input
            label={`Type ${user?.email} to confirm`}
            type="email"
            autoComplete="off"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            fullWidth
          />
        </div>
        {deleteError && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-400">{deleteError}</p>}
      </Modal>
    </>
  )
}
