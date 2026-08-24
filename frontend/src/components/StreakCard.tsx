/**
 * StreakCard.tsx
 * Animated streak counter with a circular progress ring and longest streak metric.
 */

interface StreakCardProps {
  streakCount: number
  longestStreak?: number
  loading?: boolean
}

export default function StreakCard({ streakCount, longestStreak = 0, loading = false }: StreakCardProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-44 h-44 rounded-full shimmer" />
        <div className="w-32 h-5 rounded-lg shimmer" />
      </div>
    )
  }

  // Map streak to a motivational message
  const getMessage = (n: number) => {
    if (n === 0) return 'Start your journey today ✨'
    if (n < 3)   return 'You\'re getting started! 🌱'
    if (n < 7)   return 'Building momentum! 🔥'
    if (n < 14)  return 'One week streak! ⚡'
    if (n < 30)  return 'Unstoppable! 💪'
    return 'Skincare legend! 👑'
  }

  // Progress: cap ring at 30 days = 100%
  const progress = Math.min((streakCount / 30) * 100, 100)

  return (
    <div className="flex flex-col items-center gap-5 animate-fade-in w-full">
      {/* Circular ring */}
      <div className="relative w-44 h-44">
        {/* Background ring */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 176 176">
          <circle
            cx="88" cy="88" r="76"
            fill="none"
            stroke="#f0e8da"
            strokeWidth="12"
          />
          <circle
            cx="88" cy="88" r="76"
            fill="none"
            stroke="url(#coralGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 76}`}
            strokeDashoffset={`${2 * Math.PI * 76 * (1 - progress / 100)}`}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="coralGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff9f96" />
              <stop offset="100%" stopColor="#ff6b6b" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-5xl font-black text-coral-400 leading-none">
            {streakCount}
          </span>
          <span className="text-sm font-medium text-text-soft mt-1">
            {streakCount === 1 ? 'day' : 'days'}
          </span>
        </div>
      </div>

      {/* Labels */}
      <div className="text-center flex flex-col items-center gap-2">
        <div>
          <p className="font-display text-xl font-bold text-text-dark">Current Streak</p>
          <p className="text-sm text-text-soft mt-0.5">{getMessage(streakCount)}</p>
        </div>

        {/* Longest streak pill */}
        <div className="inline-flex items-center gap-1.5 bg-cream-100 border border-coral-200/60 px-3.5 py-1 rounded-full text-xs font-semibold text-text-mid mt-1 shadow-subtle">
          <span>🏆 Best Streak:</span>
          <span className="text-coral-500 font-bold">{longestStreak} {longestStreak === 1 ? 'day' : 'days'}</span>
        </div>
      </div>
    </div>
  )
}
