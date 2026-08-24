/**
 * PageTransition.tsx — Smooth fade+slide animation on route changes.
 *
 * Wrap route content with this component using the route pathname as the key
 * so React remounts it on navigation, triggering the CSS animation.
 */

import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: React.ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  const [displayed, setDisplayed] = useState(children)
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
    setTransitioning(true)
    const t = setTimeout(() => {
      setDisplayed(children)
      setTransitioning(false)
    }, 120) // brief cross-fade delay
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <div
      className={`transition-all duration-200 ease-out ${
        transitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      }`}
    >
      {displayed}
    </div>
  )
}
