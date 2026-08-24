/**
 * Login.tsx — SkinStreak Login Page
 */

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')

    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const resErr = err as { response?: { data?: { detail?: string } } }
        setErrorMsg(resErr.response?.data?.detail || 'Invalid email or password.')
      } else {
        setErrorMsg('Network error. Please make sure the backend server is running.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-mesh flex flex-col justify-center items-center px-6 py-12">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-coral-400 to-coral-500 flex items-center justify-center shadow-glow mb-3">
          <span className="text-white text-2xl font-bold">✦</span>
        </div>
        <h1 className="font-display font-bold text-3xl text-text-dark tracking-tight">SkinStreak</h1>
        <p className="text-sm text-text-mid font-medium mt-1">Welcome back! Sign in to keep your streak glowing.</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md glass-card p-8 shadow-card animate-slide-up">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold text-text-mid uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-white/90 text-text-dark placeholder-text-soft focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-mid uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-white/90 text-text-dark placeholder-text-soft focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-3.5 mt-2 flex items-center justify-center gap-2 font-display text-base tracking-wide"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-cream-200 pt-6">
          <p className="text-sm text-text-mid font-medium">
            Don't have an account?{' '}
            <Link to="/signup" className="text-coral-500 font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      <p className="text-xs text-text-soft mt-8 text-center">
        ✦ SkinStreak — Your Personal Skincare Habit Tracker ✦
      </p>
    </div>
  )
}
