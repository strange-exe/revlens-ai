import { useRef, useCallback } from "react"

export function useEffectEvent(callback) {
  const ref = useRef(callback)
  ref.current = callback
  return useCallback((...args) => {
    return ref.current?.(...args)
  }, [])
}
