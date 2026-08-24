/**
 * Dashboard.tsx
 * Main dashboard page — fetches today's routine, streak stats, today's photo thumbnail,
 * supports AM/PM toggles, displays streak counter, toast notifications,
 * milestone celebrations, and full app navigation.
 */

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { getPhotoFullUrl, getPhotos, type Photo } from '../api/photos'
import { getTodayRoutine, updateTodayRoutine, type DailyRoutine } from '../api/routine'
import { getStreakInfo, type StreakInfo } from '../api/streak'
import MilestoneModal from '../components/MilestoneModal'
import RoutineStatus from '../components/RoutineStatus'
import StreakCard from '../components/StreakCard'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'

type FetchState = 'idle' | 'loading' | 'success' | 'error'

const MILESTONES = [7, 14, 30] as const

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const [routine, setRoutine] = useState<DailyRoutine | null>(null)
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null)
  const [todayPhoto, setTodayPhoto] = useState<Photo | null>(null)
  const [fetchState, setFetchState] = useState<FetchState>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [milestoneStreak, setMilestoneStreak] = useState<number | null>(null)
  const seenMilestonesRef = useRef<Set<number>>(new Set())

  const fetchData = async () => {
    setFetchState('loading')
    setErrorMsg('')
    try {
      const [routineData, streakData, photosData] = await Promise.all([
        getTodayRoutine(),
        getStreakInfo(),
        getPhotos().catch(() => [] as Photo[]),
      ])
      setRoutine(routineData)
      setStreakInfo(streakData)

      // Find if user uploaded a photo today — match by the routine it's
      // linked to (as computed by the backend) rather than comparing date
      // strings. `captured_at` is stored in UTC while "today" is an IST
      // calendar day, so a raw string-prefix comparison would misclassify
      // photos taken in the ~5.5 hour window where the two dates disagree.
      const foundToday = photosData.find((p) => p.daily_routine_id === routineData.id)
      setTodayPhoto(foundToday ?? null)

      setFetchState('success')

      // Check for milestone — only trigger once per session per milestone
      const streak = streakData.current_streak
      if (
        MILESTONES.includes(streak as (typeof MILESTONES)[number]) &&
        !seenMilestonesRef.current.has(streak)
      ) {
        seenMilestonesRef.current.add(streak)
        setMilestoneStreak(streak)
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not reach the SkinStreak API.'
      setErrorMsg(message)
      setFetchState('error')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleToggleAm = async () => {
    if (!routine) return
    const newAm = !routine.am_done
    setRoutine((prev) => (prev ? { ...prev, am_done: newAm } : prev))
    try {
      const updated = await updateTodayRoutine({ am_done: newAm })
      setRoutine(updated)
      const updatedStreak = await getStreakInfo()
      setStreakInfo(updatedStreak)

      // Toast feedback
      if (newAm) {
        showToast('Morning routine completed! ☀️', 'success')
        // Milestone check on AM toggle
        const streak = updatedStreak.current_streak
        if (
          MILESTONES.includes(streak as (typeof MILESTONES)[number]) &&
          !seenMilestonesRef.current.has(streak)
        ) {
          seenMilestonesRef.current.add(streak)
          setMilestoneStreak(streak)
        }
      } else {
        showToast('Morning routine unchecked', 'info')
      }
    } catch {
      setRoutine((prev) => (prev ? { ...prev, am_done: !newAm } : prev))
      showToast('Failed to update routine', 'error')
    }
  }

  const handleTogglePm = async () => {
    if (!routine) return
    const newPm = !routine.pm_done
    setRoutine((prev) => (prev ? { ...prev, pm_done: newPm } : prev))
    try {
      const updated = await updateTodayRoutine({ pm_done: newPm })
      setRoutine(updated)
      const updatedStreak = await getStreakInfo()
      setStreakInfo(updatedStreak)

      // Toast feedback
      if (newPm) {
        showToast('Night routine completed! 🌙', 'success')
        // Check both done
        if (updated.am_done && newPm) {
          setTimeout(() => showToast("Full day routine done! You're glowing 🌟", 'milestone'), 800)
        }
        // Milestone check on PM toggle
        const streak = updatedStreak.current_streak
        if (
          MILESTONES.includes(streak as (typeof MILESTONES)[number]) &&
          !seenMilestonesRef.current.has(streak)
        ) {
          seenMilestonesRef.current.add(streak)
          setMilestoneStreak(streak)
        }
      } else {
        showToast('Night routine unchecked', 'info')
      }
    } catch {
      setRoutine((prev) => (prev ? { ...prev, pm_done: !newPm } : prev))
      showToast('Failed to update routine', 'error')
    }
  }

  const isLoading = fetchState === 'loading' || fetchState === 'idle'

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-mesh">
      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 border-b border-white/50 shadow-subtle">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-coral-400 to-coral-500 flex items-center justify-center shadow-card">
              <span className="text-white text-base sm:text-lg" aria-hidden="true">✦</span>
            </div>
            <span className="font-display font-bold text-lg sm:text-xl text-text-dark tracking-tight">
              SkinStreak
            </span>
          </div>

          {/* Navigation — icon-only on mobile, with labels on sm+ */}
          <nav className="flex items-center gap-1.5 sm:gap-2" aria-label="Main navigation">
            <Link
              to="/checkin"
              title="Check-in"
              className="flex items-center gap-1 text-xs font-semibold text-white bg-coral-400 hover:bg-coral-500 px-2.5 sm:px-3 py-1.5 rounded-full transition-all shadow-card"
            >
              <span aria-hidden="true">📸</span>
              <span className="hidden sm:inline">Check-in</span>
            </Link>

            <Link
              to="/journal"
              title="Journal"
              className="flex items-center gap-1 text-xs font-semibold text-text-dark hover:text-coral-500 bg-white hover:bg-cream-100 border border-cream-300 px-2.5 sm:px-3 py-1.5 rounded-full transition-all shadow-subtle"
            >
              <span aria-hidden="true">🖼️</span>
              <span className="hidden sm:inline">Journal</span>
            </Link>

            <Link
              to="/calendar"
              title="Calendar"
              className="flex items-center gap-1 text-xs font-semibold text-text-dark hover:text-coral-500 bg-white hover:bg-cream-100 border border-cream-300 px-2.5 sm:px-3 py-1.5 rounded-full transition-all shadow-subtle"
            >
              <span aria-hidden="true">📅</span>
              <span className="hidden sm:inline">Calendar</span>
            </Link>

            <Link
              to="/profile"
              title="Profile"
              className="flex items-center gap-1 text-xs font-semibold text-text-dark hover:text-coral-500 bg-white hover:bg-cream-100 border border-cream-300 px-2.5 sm:px-3 py-1.5 rounded-full transition-all shadow-subtle"
            >
              <span className="w-5 h-5 rounded-full bg-coral-100 text-coral-600 font-bold text-[10px] flex items-center justify-center">
                {user?.name ? user.name[0].toUpperCase() : user?.email?.[0]?.toUpperCase() ?? '?'}
              </span>
              <span className="hidden sm:inline">Profile</span>
            </Link>

            <button
              onClick={logout}
              className="text-xs font-semibold text-coral-500 hover:text-coral-600 bg-white hover:bg-cream-100 border border-coral-200 px-2.5 sm:px-3 py-1.5 rounded-full transition-all duration-200 shadow-subtle hidden xs:flex items-center"
            >
              <span className="sm:hidden">↩</span>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </nav>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col gap-8">

        {/* Hero greeting */}
        <section className="text-center animate-fade-in" aria-label="Welcome banner">
          <h1 className="font-display text-4xl sm:text-5xl font-black text-text-dark leading-tight">
            Good{' '}
            <span className="bg-gradient-to-r from-coral-400 to-coral-300 bg-clip-text text-transparent">
              {getTimeOfDay()}
            </span>
            {user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="mt-3 text-text-mid text-lg font-medium">
            Your skin deserves consistency. Let's keep the streak alive.
          </p>
          <p className="mt-2 text-sm text-text-soft">{dateStr}</p>
        </section>

        {/* ── Streak Broken Warning Banner ─────────────────────────────────── */}
        {!isLoading && streakInfo?.is_streak_broken && (
          <div
            role="alert"
            className="glass-card border-coral-300 bg-coral-50/70 p-5 flex items-center gap-4 animate-slide-up shadow-card"
          >
            <div className="w-11 h-11 rounded-2xl bg-coral-400 text-white text-2xl flex items-center justify-center flex-shrink-0 shadow-subtle">
              💔
            </div>
            <div className="flex-1">
              <p className="font-display font-bold text-coral-600 text-base">Streak Reset</p>
              <p className="text-xs text-text-mid mt-0.5">
                You missed yesterday's routine, but don't worry! Complete today's routine to start a fresh streak.
              </p>
            </div>
          </div>
        )}

        {/* ── Today's Check-in Photo Card ────────────────────────────────────── */}
        {!isLoading && (
          <section className="glass-card p-5 shadow-card flex items-center justify-between gap-4 animate-fade-in">
            {todayPhoto ? (
              <div className="flex items-center gap-4 w-full">
                <img
                  src={getPhotoFullUrl(todayPhoto.storage_url)}
                  alt="Today's skin check-in thumbnail"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-sage-300 shadow-subtle"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-text-dark text-base">Today's Photo</span>
                    <span className="status-badge status-done text-[11px] py-0.5 px-2">✓ Uploaded</span>
                  </div>
                  <p className="text-xs text-text-soft mt-0.5">Captured today. Track progress in your journal.</p>
                </div>
                <Link to="/journal" className="btn-secondary text-xs px-3.5 py-2 flex-shrink-0">
                  View 🖼️
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-coral-100 text-coral-500 text-2xl flex items-center justify-center flex-shrink-0">
                    📸
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-text-dark text-base">Daily Photo Check-in</h3>
                    <p className="text-xs text-text-soft mt-0.5">Snap a quick photo to document today's glow!</p>
                  </div>
                </div>
                <Link to="/checkin" className="btn-primary text-xs px-4 py-2 flex-shrink-0">
                  Check-in 📸
                </Link>
              </div>
            )}
          </section>
        )}

        {/* ── Error State ──────────────────────────────────────────────────── */}
        {fetchState === 'error' && (
          <div
            role="alert"
            className="glass-card border-red-200 bg-red-50/60 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-in"
          >
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <span className="text-red-500 text-xl">⚠</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-red-700">Couldn't load routine data</p>
              <p className="text-sm text-red-500 mt-0.5 break-all">{errorMsg}</p>
            </div>
            <button
              id="retry-btn"
              onClick={fetchData}
              className="btn-primary text-sm px-4 py-2 flex-shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Streak Card ──────────────────────────────────────────────────── */}
        <section
          className="glass-card p-8 flex flex-col items-center shadow-card"
          aria-label="Streak counter"
        >
          <StreakCard
            streakCount={streakInfo?.current_streak ?? routine?.streak_count ?? 0}
            longestStreak={streakInfo?.longest_streak ?? 0}
            loading={isLoading}
          />

          {!isLoading && routine && (
            <p className="mt-4 text-xs text-text-soft font-medium tracking-wide uppercase">
              Tracking since {formatDate(routine.created_at)}
            </p>
          )}
        </section>

        {/* ── Today's Routine ──────────────────────────────────────────────── */}
        <section aria-label="Today's routine status">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl text-text-dark">
              Today's Routine
            </h2>
            {!isLoading && routine && (
              <span className={`status-badge text-xs ${
                routine.am_done && routine.pm_done
                  ? 'status-done'
                  : routine.am_done || routine.pm_done
                  ? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                  : 'status-pending'
              }`}>
                {routine.am_done && routine.pm_done
                  ? '🌟 All done'
                  : routine.am_done || routine.pm_done
                  ? '⚡ In progress'
                  : '⏳ Not started'}
              </span>
            )}
          </div>

          <RoutineStatus
            amDone={routine?.am_done ?? false}
            pmDone={routine?.pm_done ?? false}
            loading={isLoading}
            onToggleAm={handleToggleAm}
            onTogglePm={handleTogglePm}
          />
        </section>

        {/* ── Quick Stats Row ──────────────────────────────────────────────── */}
        {!isLoading && routine && (
          <section
            className="grid grid-cols-3 gap-3 sm:gap-4 animate-slide-up"
            aria-label="Quick stats"
          >
            {[
              { label: 'Current Streak', value: `${streakInfo?.current_streak ?? routine.streak_count}d`, icon: '🔥' },
              { label: 'Longest Streak', value: `${streakInfo?.longest_streak ?? 0}d`, icon: '🏆' },
              {
                label: 'Today Status',
                value: routine.am_done && routine.pm_done ? '100%' : routine.am_done || routine.pm_done ? '50%' : '0%',
                icon: '✨',
              },
            ].map(({ label, value, icon }) => (
              <div key={label} className="glass-card p-3 sm:p-4 text-center shadow-subtle">
                <div className="text-xl sm:text-2xl mb-1" aria-hidden="true">{icon}</div>
                <div className="font-display font-bold text-base sm:text-lg text-text-dark">{value}</div>
                <div className="text-[10px] sm:text-xs text-text-soft font-medium">{label}</div>
              </div>
            ))}
          </section>
        )}

        {/* ── Motivational Footer ──────────────────────────────────────────── */}
        <footer className="text-center pb-6 animate-fade-in">
          <p className="text-sm text-text-soft">
            ✦ Consistency is the secret to glowing skin ✦
          </p>
        </footer>
      </main>

      {/* ── Milestone Modal ────────────────────────────────────────────────── */}
      {milestoneStreak !== null && (
        <MilestoneModal
          streakCount={milestoneStreak}
          onDismiss={() => setMilestoneStreak(null)}
        />
      )}
    </div>
  )
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function getTimeOfDay(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
