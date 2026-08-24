/**
 * api/client.ts — Centralized Axios instance for all SkinStreak API calls.
 *
 * Features:
 *   - Single shared instance (baseURL from VITE_API_BASE_URL env var)
 *   - Request interceptor: auto-attaches Bearer token from localStorage
 *   - Response interceptor: dispatches 'auth:logout' CustomEvent on 401
 *     so AuthContext can auto-logout without circular imports
 */

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const TOKEN_KEY = 'skinstreak_token'

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request: attach JWT Bearer token ─────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response: auto-logout on 401 Unauthorized ────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error?.config?.url ?? ''
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/signup')
    if (error?.response?.status === 401 && !isAuthEndpoint) {
      // Remove stale token and notify AuthContext via a custom event
      localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new CustomEvent('auth:logout'))
    }
    return Promise.reject(error)
  }
)

export { BASE_URL }
export default apiClient
