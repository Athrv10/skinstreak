/**
 * api/routine.ts — API client for daily routine endpoints.
 */

import apiClient from './client'

export interface DailyRoutine {
  id: number
  user_id: number
  routine_date: string
  am_done: boolean
  pm_done: boolean
  streak_count: number
  notes: string | null
  created_at: string
}

export interface HealthStatus {
  status: string
}

/** Fetch today's routine record (auto-created if missing). */
export async function getTodayRoutine(): Promise<DailyRoutine> {
  const { data } = await apiClient.get<DailyRoutine>('/routine/today')
  return data
}

/** Toggle AM/PM completion and/or save notes for today. */
export async function updateTodayRoutine(updates: {
  am_done?: boolean
  pm_done?: boolean
  notes?: string
}): Promise<DailyRoutine> {
  const params = new URLSearchParams()
  if (updates.am_done !== undefined) params.append('am_done', String(updates.am_done))
  if (updates.pm_done !== undefined) params.append('pm_done', String(updates.pm_done))
  if (updates.notes !== undefined) params.append('notes', updates.notes)

  const { data } = await apiClient.patch<DailyRoutine>(`/routine/today?${params.toString()}`)
  return data
}

/** Health-check — useful for verifying backend is reachable. */
export async function getHealth(): Promise<HealthStatus> {
  const { data } = await apiClient.get<HealthStatus>('/health')
  return data
}
