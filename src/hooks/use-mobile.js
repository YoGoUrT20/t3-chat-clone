import * as React from "react"

const MOBILE_BREAKPOINT = 1024

export function useIsMobile() {
  const getIsMobile = () =>
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  const [isMobile, setIsMobile] = React.useState(getIsMobile)

  React.useEffect(() => {
    const onResize = () => setIsMobile(getIsMobile())
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener("change", onResize)
    window.addEventListener("resize", onResize)
    setIsMobile(getIsMobile())
    return () => {
      mql.removeEventListener("change", onResize)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  return isMobile
}
