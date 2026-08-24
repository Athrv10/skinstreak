/**
 * RoutineStatus.tsx
 * AM / PM routine status cards with interactive toggle support.
 */

interface RoutineStatusProps {
  amDone: boolean
  pmDone: boolean
  loading?: boolean
  onToggleAm?: () => void
  onTogglePm?: () => void
}

function StatusCard({
  label,
  emoji,
  done,
  timeRange,
  loading,
  onToggle,
}: {
  label: string
  emoji: string
  done: boolean
  timeRange: string
  loading: boolean
  onToggle?: () => void
}) {
  if (loading) {
    return <div className="w-full h-36 rounded-2xl shimmer" />
  }

  return (
    <div
      onClick={onToggle}
      className={`
        glass-card p-6 flex flex-col gap-3 transition-all duration-300 cursor-pointer select-none
        ${done
          ? 'border-sage-300 bg-sage-50/40 shadow-md ring-1 ring-sage-300/60'
          : 'hover:shadow-card hover:-translate-y-1'
        }
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onToggle?.()}
      aria-label={`Toggle ${label} routine. Currently ${done ? 'completed' : 'pending'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">{emoji}</span>
          <span className="font-display font-bold text-lg text-text-dark">{label}</span>
        </div>
        <div
          className={`
            w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
            ${done
              ? 'bg-sage-400 text-white scale-110 shadow-sm'
              : 'bg-cream-200 border-2 border-dashed border-cream-400 text-transparent hover:border-coral-400'
            }
          `}
          aria-hidden="true"
        >
          {done ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="text-xs">✦</span>
          )}
        </div>
      </div>

      {/* Time range */}
      <p className="text-xs text-text-soft font-medium">{timeRange}</p>

      {/* Status badge & action callout */}
      <div className="flex items-center justify-between mt-1">
        <span className={`status-badge ${done ? 'status-done' : 'status-pending'}`}>
          {done ? '✓ Completed' : '○ Pending'}
        </span>
        <span className="text-xs text-coral-400 font-semibold opacity-80 hover:opacity-100">
          {done ? 'Tap to uncheck' : 'Tap to mark done →'}
        </span>
      </div>
    </div>
  )
}

export default function RoutineStatus({
  amDone,
  pmDone,
  loading = false,
  onToggleAm,
  onTogglePm,
}: RoutineStatusProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full animate-slide-up">
      <StatusCard
        label="Morning Routine"
        emoji="☀️"
        done={amDone}
        timeRange="6:00 AM – 10:00 AM"
        loading={loading}
        onToggle={onToggleAm}
      />
      <StatusCard
        label="Night Routine"
        emoji="🌙"
        done={pmDone}
        timeRange="8:00 PM – 11:00 PM"
        loading={loading}
        onToggle={onTogglePm}
      />
    </div>
  )
}
