/**
 * MilestoneModal.tsx — Full-screen confetti celebration modal.
 * Shown when user hits 7, 14, or 30 day streak milestones.
 */

import { useEffect, useRef } from 'react'

interface MilestoneModalProps {
  streakCount: number
  onDismiss: () => void
}

const MILESTONE_CONFIG: Record<number, { emoji: string; title: string; subtitle: string; color: string }> = {
  7:  { emoji: '🔥', title: 'One Week Strong!',     subtitle: 'Seven days of consistent skincare. Your skin is loving you!',    color: 'from-orange-400 to-coral-400' },
  14: { emoji: '⚡', title: 'Two Week Warrior!',    subtitle: 'Fourteen days in! Real results start showing at two weeks.',     color: 'from-coral-400 to-pink-400' },
  30: { emoji: '👑', title: 'Skincare Legend!',     subtitle: 'A full month of consistency! You\'ve built a lifelong habit.',    color: 'from-amber-400 to-coral-400' },
}

// Simple CSS confetti using randomized particles
function Confetti() {
  const colors = ['#ff6b6b', '#a8d5a2', '#ffd9a0', '#ff9f96', '#78be70', '#ffc670']

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {Array.from({ length: 40 }).map((_, i) => {
        const color = colors[i % colors.length]
        const left = `${Math.random() * 100}%`
        const delay = `${Math.random() * 1.5}s`
        const duration = `${1.5 + Math.random() * 1.5}s`
        const size = `${6 + Math.random() * 8}px`
        const rotate = `${Math.random() * 360}deg`

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '-20px',
              left,
              width: size,
              height: size,
              backgroundColor: color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              transform: `rotate(${rotate})`,
              animation: `confetti-fall ${duration} ${delay} ease-in forwards`,
            }}
          />
        )
      })}
    </div>
  )
}

export default function MilestoneModal({ streakCount, onDismiss }: MilestoneModalProps) {
  const config = MILESTONE_CONFIG[streakCount]
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape key, and lock background scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handler)
    }
  }, [onDismiss])

  if (!config) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
      onClick={(e) => e.target === overlayRef.current && onDismiss()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="milestone-title"
    >
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-scale-up">
        <Confetti />

        {/* Gradient header */}
        <div className={`bg-gradient-to-br ${config.color} p-10 flex flex-col items-center gap-3 relative z-10`}>
          <span className="text-6xl drop-shadow-lg" aria-hidden="true">{config.emoji}</span>
          <span className="text-white/90 text-xs font-bold uppercase tracking-widest">
            🎉 Streak Milestone
          </span>
        </div>

        {/* Content */}
        <div className="p-7 flex flex-col items-center gap-4 text-center">
          <div>
            <h2
              id="milestone-title"
              className="font-display text-2xl font-black text-text-dark"
            >
              {config.title}
            </h2>
            <p className="text-sm text-text-mid font-medium mt-2 leading-relaxed">
              {config.subtitle}
            </p>
          </div>

          {/* Streak badge */}
          <div className="flex items-center gap-2 bg-cream-200 rounded-full px-5 py-2">
            <span className="text-2xl font-black text-coral-400 font-display">{streakCount}</span>
            <span className="text-sm font-semibold text-text-mid">day streak</span>
          </div>

          <button
            onClick={onDismiss}
            className="btn-primary w-full py-3 font-display text-base mt-1"
            autoFocus
          >
            Keep the streak going! ✨
          </button>
        </div>
      </div>
    </div>
  )
}
