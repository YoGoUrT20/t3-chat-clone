import { useEffect } from "react"

export function useClickAway(refs, handler) {
  useEffect(() => {
    const listener = (event) => {
      // Support both single ref and array of refs
      const refArray = Array.isArray(refs) ? refs : [refs]
      if (refArray.some(ref => !ref.current || ref.current.contains(event.target))) {
        return
      }
      handler(event)
    }

    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)

    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [refs, handler])
}
