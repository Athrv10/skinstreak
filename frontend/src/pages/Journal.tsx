/**
 * Journal.tsx — Progress Photo Journal & Gallery Page
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPhotoFullUrl, getPhotos, type Photo } from '../api/photos'

export default function Journal() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')

  const fetchPhotos = async () => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      const data = await getPhotos()
      setPhotos(data)
    } catch {
      setErrorMsg('Failed to load progress photos.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPhotos()
  }, [])

  // Lock background scroll and support Escape-to-close while the lightbox is open
  useEffect(() => {
    if (!selectedPhoto) return

    document.body.style.overflow = 'hidden'
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPhoto(null)
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedPhoto])

  return (
    <div className="min-h-screen bg-mesh pb-12">
      {/* Topbar */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 border-b border-white/50 shadow-subtle">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold text-coral-500 hover:text-coral-600 transition-colors"
          >
            <span>← Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-lg text-text-dark">Photo Journal</span>
            <Link
              to="/checkin"
              className="btn-primary py-1.5 px-3.5 text-xs font-semibold flex items-center gap-1.5"
            >
              <span>+ Check-in</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Hero Banner */}
        <div className="glass-card p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="font-display text-2xl font-black text-text-dark">Skin Progress Gallery</h1>
            <p className="text-sm text-text-mid font-medium mt-0.5">
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'} captured on your skin journey
            </p>
          </div>

          <Link
            to="/checkin"
            className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <span>📸 Snap Today's Photo</span>
          </Link>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Photos Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl shimmer" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="glass-card p-12 text-center flex flex-col items-center gap-4 animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-cream-200 text-coral-400 text-3xl flex items-center justify-center shadow-subtle">
              🖼️
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-text-dark">No Photos Yet</h2>
              <p className="text-sm text-text-soft max-w-sm mt-1">
                Take your first daily check-in photo to start tracking your visual skin progress over time!
              </p>
            </div>
            <Link to="/checkin" className="btn-primary px-6 py-2.5 text-sm mt-2">
              Take First Photo 📸
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-slide-up">
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="glass-card overflow-hidden group cursor-pointer shadow-subtle hover:shadow-card hover:-translate-y-1 transition-all duration-300 relative border border-cream-200"
              >
                {/* Photo Aspect Square */}
                <div className="aspect-square w-full bg-cream-100 relative overflow-hidden">
                  <img
                    src={getPhotoFullUrl(photo.storage_url)}
                    alt={`Progress photo from ${formatDate(photo.captured_at)}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Day Badge Overlay */}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    Day {photo.streak_day}
                  </div>
                </div>

                {/* Card Footer Info */}
                <div className="p-3 bg-white/90 flex items-center justify-between">
                  <span className="text-xs font-medium text-text-mid">
                    {formatDate(photo.captured_at)}
                  </span>
                  <div className="flex items-center gap-1 text-xs">
                    {photo.am_done && <span title="AM Routine Done">☀️</span>}
                    {photo.pm_done && <span title="PM Routine Done">🌙</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Details Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="glass-card bg-white max-w-lg w-full overflow-hidden shadow-2xl rounded-3xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image */}
            <div className="relative aspect-square w-full bg-black">
              <img
                src={getPhotoFullUrl(selectedPhoto.storage_url)}
                alt="Selected progress check-in"
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white text-lg flex items-center justify-center hover:bg-black transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-cream-200 pb-3">
                <div>
                  <h3 className="font-display font-bold text-xl text-text-dark">
                    {formatFullDate(selectedPhoto.captured_at)}
                  </h3>
                  <p className="text-xs text-text-soft">
                    Captured at {formatTime(selectedPhoto.captured_at)}
                  </p>
                </div>
                <span className="bg-coral-100 text-coral-600 font-display font-bold text-sm px-3.5 py-1 rounded-full">
                  Streak Day {selectedPhoto.streak_day}
                </span>
              </div>

              {/* Status Row */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-mid font-medium">Routine Status:</span>
                <div className="flex items-center gap-3">
                  <span className={`status-badge text-xs ${selectedPhoto.am_done ? 'status-done' : 'status-pending'}`}>
                    ☀️ AM {selectedPhoto.am_done ? '✓' : '○'}
                  </span>
                  <span className={`status-badge text-xs ${selectedPhoto.pm_done ? 'status-done' : 'status-pending'}`}>
                    🌙 PM {selectedPhoto.pm_done ? '✓' : '○'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
