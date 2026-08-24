/**
 * api/streak.ts — API client for streak statistics and monthly calendar.
 */

import apiClient from './client'

export interface StreakInfo {
  current_streak: number
  longest_streak: number
  last_completed_date: string | null
  is_streak_broken: boolean
}

export interface CalendarDay {
  date: string
  status: 'completed' | 'missed' | 'pending' | 'future'
  am_done: boolean
  pm_done: boolean
  is_today: boolean
}

/** Fetches current and longest streak statistics. */
export async function getStreakInfo(): Promise<StreakInfo> {
  const { data } = await apiClient.get<StreakInfo>('/streak')
  return data
}

/** Fetches monthly calendar days for given year and month. */
export async function getCalendarData(year?: number, month?: number): Promise<CalendarDay[]> {
  const params = new URLSearchParams()
  if (year) params.append('year', String(year))
  if (month) params.append('month', String(month))

  const queryStr = params.toString() ? `?${params.toString()}` : ''
  const { data } = await apiClient.get<CalendarDay[]>(`/streak/calendar${queryStr}`)
  return data
}
