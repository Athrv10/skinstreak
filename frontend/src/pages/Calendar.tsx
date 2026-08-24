/**
 * Calendar.tsx — Monthly Routine History Calendar Page.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCalendarData, type CalendarDay } from '../api/streak'
import { useAuth } from '../context/AuthContext'

export default function CalendarPage() {
  const { user } = useAuth()
  const today = new Date()
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1) // 1-12
  const [days, setDays] = useState<CalendarDay[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [errorMsg, setErrorMsg] = useState<string>('')

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  const fetchCalendar = async (y: number, m: number) => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      const data = await getCalendarData(y, m)
      setDays(data)
    } catch {
      setErrorMsg('Could not load calendar data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCalendar(currentYear, currentMonth)
  }, [currentYear, currentMonth])

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  // Calculate day offset for 1st of the month (0 = Sun, 1 = Mon, ...)
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay()
  const completedCount = days.filter((d) => d.status === 'completed').length
  const isCurrentMonth =
    currentYear === today.getFullYear() && currentMonth === today.getMonth() + 1
  const hasNoActivity =
    !isLoading &&
    !errorMsg &&
    days.length > 0 &&
    days.every((d) => d.status === 'future' || d.status === 'pending')
  const isNewUser = isCurrentMonth && hasNoActivity

  return (
    <div className="min-h-screen bg-mesh pb-12">
      {/* Topbar */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 border-b border-white/50 shadow-subtle">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Link
            to="/"
            className="flex items-center gap-1 sm:gap-2 text-sm font-semibold text-coral-500 hover:text-coral-600 transition-colors flex-shrink-0"
          >
            <span aria-hidden="true">←</span>
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>
          <span className="font-display font-bold text-base sm:text-lg text-text-dark truncate">Streak Calendar</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* Month Selector Card */}
        <div className="glass-card p-6 shadow-card flex items-center justify-between animate-fade-in">
          <button
            onClick={handlePrevMonth}
            className="w-10 h-10 rounded-xl bg-white hover:bg-cream-100 border border-cream-300 flex items-center justify-center font-bold text-text-dark shadow-subtle transition-all"
            aria-label="Previous month"
          >
            ←
          </button>

          <div className="text-center">
            <h2 className="font-display text-2xl font-black text-text-dark">
              {monthNames[currentMonth - 1]} {currentYear}
            </h2>
            <p className="text-xs text-text-soft font-medium mt-0.5">
              {completedCount} {completedCount === 1 ? 'day' : 'days'} completed this month
            </p>
          </div>

          <button
            onClick={handleNextMonth}
            className="w-10 h-10 rounded-xl bg-white hover:bg-cream-100 border border-cream-300 flex items-center justify-center font-bold text-text-dark shadow-subtle transition-all"
            aria-label="Next month"
          >
            →
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs font-semibold text-text-mid flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sage-300 border border-sage-400" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-coral-200 border border-coral-300" />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-white border border-cream-300" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-cream-100 border border-cream-200" />
            <span>Future</span>
          </div>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* New user empty state */}
        {isNewUser && (
          <div className="glass-card p-8 shadow-card text-center flex flex-col items-center gap-4 animate-fade-in">
            <span className="text-5xl">🌱</span>
            <div>
              <h3 className="font-display font-bold text-xl text-text-dark">Your Journey Starts Here!</h3>
              <p className="text-sm text-text-mid font-medium mt-1 max-w-xs">
                Complete your first AM or PM routine today to start filling this calendar with green check marks!
              </p>
            </div>
            <Link to="/" className="btn-primary px-6 py-2.5 text-sm">
              Start Today's Routine ✦
            </Link>
          </div>
        )}

        {/* Calendar Grid Card */}
        <div className="glass-card p-6 shadow-card animate-slide-up">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4 text-center font-display font-bold text-xs text-text-soft uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl shimmer" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {/* Empty leading padding slots */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Month Days */}
              {days.map((dayItem) => {
                const dayNumber = new Date(dayItem.date + 'T00:00:00').getDate()
                let statusClasses = ''

                if (dayItem.status === 'completed') {
                  statusClasses = 'bg-sage-100 border-sage-300 text-sage-800 font-bold shadow-subtle'
                } else if (dayItem.status === 'missed') {
                  statusClasses = 'bg-red-50 border-red-200 text-red-600 font-medium'
                } else if (dayItem.status === 'future') {
                  statusClasses = 'bg-cream-100/50 border-cream-200 text-text-soft opacity-60'
                } else {
                  // Pending
                  statusClasses = 'bg-white border-cream-300 text-text-dark font-semibold'
                }

                return (
                  <div
                    key={dayItem.date}
                    className={`
                      aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all duration-200
                      ${statusClasses}
                      ${dayItem.is_today ? 'ring-2 ring-coral-400 ring-offset-2 scale-105' : ''}
                    `}
                    title={`${dayItem.date}: ${dayItem.status}`}
                  >
                    <span className="text-sm font-display">{dayNumber}</span>
                    {dayItem.status === 'completed' && (
                      <span className="text-[10px] leading-none mt-0.5">✓</span>
                    )}
                    {dayItem.status === 'missed' && (
                      <span className="text-[10px] leading-none mt-0.5 opacity-60">✕</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Motivational Card */}
        <div className="glass-card p-5 text-center">
          <p className="text-sm text-text-mid font-medium">
            🌿 <span className="font-bold text-text-dark">{user?.name || 'Glow Setter'}</span>, every green check mark brings you closer to healthy, glowing skin!
          </p>
        </div>
      </main>
    </div>
  )
}
