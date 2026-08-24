/**
 * api/auth.ts — Authentication API client functions.
 */

import apiClient, { BASE_URL } from './client'

export interface User {
  id: number
  email: string
  name: string | null
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface ProfileStats {
  total_routines_completed: number
  longest_streak: number
  current_streak: number
  member_since: string
}

/** Registers a new user account. */
export async function signupApi(payload: { name: string; email: string; password: string }): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/signup', payload)
  return data
}

/** Authenticates user with email and password. */
export async function loginApi(payload: { email: string; password: string }): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload)
  return data
}

/** Logs out user on server (stateless). */
export async function logoutApi(): Promise<void> {
  await apiClient.post('/auth/logout')
}

/** Fetches current user profile using JWT token. */
export async function getMeApi(token: string): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

/** Fetches profile statistics for the current authenticated user. */
export async function getProfileStats(): Promise<ProfileStats> {
  const { data } = await apiClient.get<ProfileStats>('/auth/profile-stats')
  return data
}

export { BASE_URL }
