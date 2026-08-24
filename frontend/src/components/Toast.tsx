/**
 * Toast.tsx — Top-right toast notification system.
 *
 * Usage:
 *   const { showToast } = useToast()
 *   showToast('Routine completed! 🔥', 'success')
 *   showToast('Upload failed', 'error')
 *   showToast('Streak milestone! 🎉', 'milestone')
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'milestone'

export interface ToastMessage {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

// eslint-disable-next-line react-refresh/only-export-components -- hook is tightly coupled to ToastProvider below; not worth a separate file
export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const TOAST_DURATION = 3500 // ms

function SingleToast({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setVisible(true), 10)
    // Start exit animation before removal
    const exitTimer = setTimeout(() => setVisible(false), TOAST_DURATION - 400)
    // Remove from DOM
    const removeTimer = setTimeout(() => onRemove(toast.id), TOAST_DURATION)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(exitTimer)
      clearTimeout(removeTimer)
    }
  }, [toast.id, onRemove])

  const iconMap: Record<ToastType, string> = {
    success:   '✓',
    error:     '⚠',
    info:      'ℹ',
    milestone: '🎉',
  }

  const colorMap: Record<ToastType, string> = {
    success:   'bg-sage-400 text-white',
    error:     'bg-red-500 text-white',
    info:      'bg-coral-400 text-white',
    milestone: 'bg-gradient-to-r from-coral-400 to-amber-400 text-white',
  }

  const bgMap: Record<ToastType, string> = {
    success:   'bg-white border-sage-200 text-sage-700',
    error:     'bg-white border-red-200 text-red-700',
    info:      'bg-white border-coral-200 text-coral-700',
    milestone: 'bg-white border-amber-200 text-amber-700',
  }

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-card backdrop-blur-md
        min-w-[280px] max-w-[380px] cursor-pointer select-none
        transition-all duration-300 ease-out
        ${bgMap[toast.type]}
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}
      `}
      role="alert"
      aria-live="polite"
      onClick={() => onRemove(toast.id)}
    >
      <span
        className={`
          w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
          text-sm font-bold ${colorMap[toast.type]}
        `}
      >
        {iconMap[toast.type]}
      </span>
      <span className="text-sm font-semibold flex-1">{toast.message}</span>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const counterRef = useRef(0)

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${counterRef.current++}`
    setToasts((prev) => {
      // Max 3 stacked toasts — drop oldest if needed
      const next = [...prev, { id, message, type }]
      return next.length > 3 ? next.slice(next.length - 3) : next
    })
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container — fixed top-right */}
      <div
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <SingleToast toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
