import { useState } from "react"

/** Show a load error as a toast until the user dismisses it (derived from props, no state-syncing effect). */
export function useDismissibleError(error) {
  const [dismissed, setDismissed] = useState(null)
  const message = error && error !== dismissed ? error : null
  return [message, () => setDismissed(error)]
}
