/**
 * api/reminders.ts — API client for email reminder settings.
 */

import apiClient from './client'

export interface ReminderSettings {
  am_reminder_time: string // "HH:MM" e.g. "06:00"
  pm_reminder_time: string // "HH:MM" e.g. "20:00"
  reminders_enabled: boolean
}

export interface ReminderSettingsUpdatePayload {
  am_reminder_time?: string
  pm_reminder_time?: string
  reminders_enabled?: boolean
}

/** Fetches current user's email reminder settings. */
export async function getReminderSettings(): Promise<ReminderSettings> {
  const { data } = await apiClient.get<ReminderSettings>('/reminders/settings')
  return data
}

/** Updates user's email reminder settings. */
export async function updateReminderSettings(
  payload: ReminderSettingsUpdatePayload
): Promise<ReminderSettings> {
  const { data } = await apiClient.patch<ReminderSettings>('/reminders/settings', payload)
  return data
}
