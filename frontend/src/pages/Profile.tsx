/**
 * Profile.tsx — User profile page.
 * Shows name, email, member since, total routines completed, longest streak,
 * and Email Reminder Settings (AM/PM times & ON/OFF toggle).
 */

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProfileStats, type ProfileStats } from '../api/auth'
import {
  getReminderSettings,
  updateReminderSettings,
  type ReminderSettings,
} from '../api/reminders'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, logout } = useAuth()
  const { showToast } = useToast()

  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Reminder settings state
  const [remindersEnabled, setRemindersEnabled] = useState(true)
  const [amTime, setAmTime] = useState('06:00')
  const [pmTime, setPmTime] = useState('20:00')
  const [isLoadingReminders, setIsLoadingReminders] = useState(true)
  const [isSavingReminders, setIsSavingReminders] = useState(false)
  const [reminderError, setReminderError] = useState('')

  useEffect(() => {
    async function fetchData() {
      // Fetch Profile Stats
      try {
        const statsData = await getProfileStats()
        setStats(statsData)
      } catch {
        setErrorMsg('Could not load profile stats.')
      } finally {
        setIsLoadingStats(false)
      }

      // Fetch Reminder Settings
      try {
        const reminderData: ReminderSettings = await getReminderSettings()
        setRemindersEnabled(reminderData.reminders_enabled)
        setAmTime(reminderData.am_reminder_time)
        setPmTime(reminderData.pm_reminder_time)
      } catch {
        setReminderError('Could not load email reminder settings.')
      } finally {
        setIsLoadingReminders(false)
      }
    }

    fetchData()
  }, [])

  const handleSaveReminders = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingReminders(true)
    setReminderError('')

    try {
      const updated = await updateReminderSettings({
        reminders_enabled: remindersEnabled,
        am_reminder_time: amTime,
        pm_reminder_time: pmTime,
      })
      setRemindersEnabled(updated.reminders_enabled)
      setAmTime(updated.am_reminder_time)
      setPmTime(updated.pm_reminder_time)
      showToast('Reminder settings saved! 🔔', 'success')
    } catch {
      setReminderError('Failed to save reminder settings. Please try again.')
      showToast('Failed to save reminder settings', 'error')
    } finally {
      setIsSavingReminders(false)
    }
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  const memberSince = stats?.member_since
    ? new Date(stats.member_since).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '—'

  const statCards = [
    {
      label: 'Total Routines Completed',
      value: stats?.total_routines_completed ?? '—',
      icon: '✅',
      sub: 'days with AM or PM done',
    },
    {
      label: 'Longest Streak',
      value: stats ? `${stats.longest_streak}d` : '—',
      icon: '🏆',
      sub: 'consecutive days',
    },
    {
      label: 'Current Streak',
      value: stats ? `${stats.current_streak}d` : '—',
      icon: '🔥',
      sub: 'days in a row',
    },
  ]

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
          <span className="font-display font-bold text-base sm:text-lg text-text-dark truncate">My Profile</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* Avatar + Identity Card */}
        <section className="glass-card p-8 shadow-card flex flex-col items-center gap-4 animate-fade-in text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-coral-300 to-coral-500 flex items-center justify-center shadow-glow">
            <span className="font-display font-black text-3xl text-white">{initials}</span>
          </div>

          <div>
            <h1 className="font-display text-2xl font-black text-text-dark">
              {user?.name || 'Glow Setter'}
            </h1>
            <p className="text-sm text-text-soft font-medium mt-1">{user?.email}</p>
          </div>

          <div className="flex items-center gap-2 bg-cream-200 rounded-full px-4 py-1.5">
            <span className="text-xs text-text-soft">Member since</span>
            <span className="text-xs font-bold text-text-dark">{memberSince}</span>
          </div>
        </section>

        {/* Error stats */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Stats Grid */}
        <section aria-label="Profile statistics" className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
          {statCards.map(({ label, value, icon, sub }) => (
            <div key={label} className="glass-card p-5 shadow-card flex flex-col items-center text-center gap-2">
              {isLoadingStats ? (
                <div className="w-full flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full shimmer" />
                  <div className="w-16 h-6 rounded-lg shimmer" />
                  <div className="w-24 h-3 rounded shimmer" />
                </div>
              ) : (
                <>
                  <span className="text-3xl" aria-hidden="true">{icon}</span>
                  <span className="font-display font-black text-2xl text-coral-400">{value}</span>
                  <div>
                    <p className="text-xs font-bold text-text-dark">{label}</p>
                    <p className="text-xs text-text-soft mt-0.5">{sub}</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </section>

        {/* ── Email Reminder Settings Card ───────────────────────────────────── */}
        <section className="glass-card p-6 shadow-card flex flex-col gap-5 animate-slide-up">
          <div className="flex items-center justify-between border-b border-cream-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-coral-100 text-coral-500 text-xl flex items-center justify-center shadow-subtle">
                🔔
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-text-dark">Email Reminders</h2>
                <p className="text-xs text-text-soft">Receive daily skincare routine notifications</p>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={remindersEnabled}
                onChange={(e) => setRemindersEnabled(e.target.checked)}
                className="sr-only peer"
                disabled={isLoadingReminders || isSavingReminders}
              />
              <div className="w-12 h-6 bg-cream-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-cream-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral-400"></div>
            </label>
          </div>

          {reminderError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
              ⚠️ {reminderError}
            </div>
          )}

          {isLoadingReminders ? (
            <div className="flex flex-col gap-4">
              <div className="h-12 rounded-xl shimmer" />
              <div className="h-12 rounded-xl shimmer" />
            </div>
          ) : (
            <form onSubmit={handleSaveReminders} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* AM Time Picker */}
                <div className="p-4 rounded-2xl bg-cream-100/60 border border-cream-200 flex flex-col gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-text-dark uppercase tracking-wider">
                    <span>☀️ Morning Reminder</span>
                  </label>
                  <input
                    type="time"
                    value={amTime}
                    onChange={(e) => setAmTime(e.target.value)}
                    disabled={!remindersEnabled || isSavingReminders}
                    className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white text-text-dark font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-coral-400 disabled:opacity-50 transition-all"
                    required
                  />
                  <p className="text-[11px] text-text-soft">Preferred AM notification time</p>
                </div>

                {/* PM Time Picker */}
                <div className="p-4 rounded-2xl bg-cream-100/60 border border-cream-200 flex flex-col gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-text-dark uppercase tracking-wider">
                    <span>🌙 Evening Reminder</span>
                  </label>
                  <input
                    type="time"
                    value={pmTime}
                    onChange={(e) => setPmTime(e.target.value)}
                    disabled={!remindersEnabled || isSavingReminders}
                    className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white text-text-dark font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-coral-400 disabled:opacity-50 transition-all"
                    required
                  />
                  <p className="text-[11px] text-text-soft">Preferred PM notification time</p>
                </div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={isSavingReminders}
                className="btn-primary py-3 text-sm font-semibold flex items-center justify-center gap-2 mt-1"
              >
                {isSavingReminders ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Saving Settings...</span>
                  </>
                ) : (
                  <span>Save Reminder Settings 🔔</span>
                )}
              </button>
            </form>
          )}
        </section>

        {/* Quick Links Section */}
        <section className="glass-card p-5 shadow-card flex flex-col gap-3 animate-slide-up">
          <h2 className="font-display font-bold text-base text-text-dark">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/calendar"
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-cream-100 hover:bg-cream-200 border border-cream-300 text-sm font-semibold text-text-dark transition-all"
            >
              <span>📅</span> Calendar
            </Link>
            <Link
              to="/journal"
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-cream-100 hover:bg-cream-200 border border-cream-300 text-sm font-semibold text-text-dark transition-all"
            >
              <span>🖼️</span> Journal
            </Link>
            <Link
              to="/checkin"
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-cream-100 hover:bg-cream-200 border border-cream-300 text-sm font-semibold text-text-dark transition-all"
            >
              <span>📸</span> Check-in
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-cream-100 hover:bg-cream-200 border border-cream-300 text-sm font-semibold text-text-dark transition-all"
            >
              <span>🏠</span> Dashboard
            </Link>
          </div>
        </section>

        {/* Sign out */}
        <div className="animate-slide-up">
          <button
            onClick={logout}
            className="w-full py-3.5 rounded-xl border-2 border-coral-300 text-coral-500 font-display font-bold hover:bg-coral-50 transition-all duration-200"
          >
            Sign Out
          </button>
        </div>
      </main>
    </div>
  )
}
