/**
 * Checkin.tsx — Daily Photo Check-in Page
 * Camera capture with face guidance overlay & file upload fallback.
 * Includes notes textarea, MIME type validation, and detailed camera error messages.
 */

import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { uploadPhoto, validatePhotoFile } from '../api/photos'
import { updateTodayRoutine } from '../api/routine'
import { useToast } from '../components/Toast'

type CameraErrorType = 'permission_denied' | 'not_found' | 'generic' | null

export default function Checkin() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraErrorType, setCameraErrorType] = useState<CameraErrorType>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  const cameraError = cameraErrorType !== null

  // Initialize camera stream
  useEffect(() => {
    let activeStream: MediaStream | null = null

    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
          audio: false,
        })
        activeStream = s
        setStream(s)
        if (videoRef.current) {
          videoRef.current.srcObject = s
        }
      } catch (err: unknown) {
        console.warn('Camera access error:', err)
        // Classify the camera error for a more helpful message
        if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setCameraErrorType('permission_denied')
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setCameraErrorType('not_found')
          } else {
            setCameraErrorType('generic')
          }
        } else {
          setCameraErrorType('generic')
        }
      }
    }

    startCamera()

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // Revoke the captured-photo preview's blob URL whenever it changes and on
  // unmount, so navigating away (e.g. "Back to Dashboard") mid-preview
  // doesn't leak the blob for the rest of the page's lifetime.
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Capture current video frame to Canvas
  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 640

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `checkin_${Date.now()}.jpg`, { type: 'image/jpeg' })
      setCapturedFile(file)
      setPreviewUrl(URL.createObjectURL(blob))
    }, 'image/jpeg', 0.9)
  }

  // Handle file input upload fallback — with client-side validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validatePhotoFile(file)
    if (validationError) {
      setErrorMsg(validationError)
      e.target.value = '' // reset input
      return
    }

    setErrorMsg('')
    setCapturedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  // Clear preview and retake — the object URL is revoked by the cleanup
  // effect above once previewUrl changes.
  const handleRetake = () => {
    setCapturedFile(null)
    setPreviewUrl(null)
    setErrorMsg('')
  }

  // Submit photo + notes to backend API
  const handleUpload = async () => {
    if (!capturedFile) return
    setIsUploading(true)
    setErrorMsg('')

    try {
      // Upload the photo
      await uploadPhoto(capturedFile)

      // Save notes if provided (fire-and-forget — don't block on this)
      if (notes.trim()) {
        updateTodayRoutine({ notes: notes.trim() }).catch(() => {
          // Non-critical, don't block navigation
        })
      }

      showToast('Photo uploaded! Your progress is saved 📸', 'success')
      navigate('/journal', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Photo upload failed.'
      setErrorMsg(msg)
      showToast('Upload failed. Please try again.', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const cameraErrorMessages: Record<NonNullable<CameraErrorType>, { title: string; detail: string }> = {
    permission_denied: {
      title: 'Camera Permission Denied',
      detail: 'Please allow camera access in your browser settings to use this feature.',
    },
    not_found: {
      title: 'No Camera Found',
      detail: 'We couldn\'t detect a camera on your device. Upload a photo from your gallery below.',
    },
    generic: {
      title: 'Camera Unavailable',
      detail: 'Your camera couldn\'t start. Upload a photo from your gallery below.',
    },
  }

  return (
    <div className="min-h-screen bg-mesh pb-12">
      {/* Topbar */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 border-b border-white/50 shadow-subtle">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold text-coral-500 hover:text-coral-600 transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <span className="font-display font-bold text-lg text-text-dark">Daily Check-in</span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Header Title */}
        <div className="text-center animate-fade-in">
          <h1 className="font-display text-3xl font-black text-text-dark">Capture Progress Photo</h1>
          <p className="text-sm text-text-mid font-medium mt-1">
            Track your skin transformation day by day.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium animate-fade-in">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Viewfinder / Preview Container */}
        <div className="glass-card overflow-hidden shadow-card relative animate-slide-up flex flex-col items-center justify-center min-h-[360px] bg-black/90 rounded-3xl">
          {previewUrl ? (
            /* Photo Preview State */
            <div className="relative w-full aspect-square">
              <img
                src={previewUrl}
                alt="Captured skin check-in preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full">
                ✓ Photo Ready
              </div>
            </div>
          ) : !cameraError ? (
            /* Live Camera View with Oval Guidance Overlay */
            <div className="relative w-full aspect-square flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />

              {/* Guidance Oval Overlay */}
              <div className="absolute inset-0 border-[36px] border-black/40 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-56 h-72 rounded-[50%] border-2 border-dashed border-white/80 shadow-glow flex items-end justify-center pb-4">
                  <span className="text-[11px] font-semibold text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">
                    Face centered, consistent lighting
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Camera Access Error / Fallback State */
            <div className="p-8 text-center flex flex-col items-center gap-4 text-white">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
                cameraErrorType === 'permission_denied' ? 'bg-red-500/20' : 'bg-white/10'
              }`}>
                {cameraErrorType === 'permission_denied' ? '🔒' : '📷'}
              </div>
              <div>
                <p className="font-bold text-lg">
                  {cameraErrorType ? cameraErrorMessages[cameraErrorType].title : 'Camera Unavailable'}
                </p>
                <p className="text-xs text-white/70 mt-1 max-w-[240px] leading-relaxed">
                  {cameraErrorType ? cameraErrorMessages[cameraErrorType].detail : 'Upload a photo from your gallery below.'}
                </p>
              </div>
              {cameraErrorType === 'permission_denied' && (
                <div className="text-xs text-white/60 bg-white/10 rounded-xl px-4 py-3 text-left leading-relaxed">
                  <p className="font-bold text-white/80 mb-1">How to enable camera:</p>
                  <p>Chrome: Click the 🔒 or ⓘ icon in the address bar → Site settings → Camera → Allow</p>
                </div>
              )}
            </div>
          )}

          {/* Hidden Canvas for Frame Capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Notes Input */}
        <div className="flex flex-col gap-2 animate-fade-in">
          <label
            htmlFor="checkin-notes"
            className="text-xs font-semibold text-text-mid uppercase tracking-wider"
          >
            Today's Notes (optional)
          </label>
          <textarea
            id="checkin-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How does your skin feel today? Any new products, reactions, or observations..."
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-white/90 text-text-dark placeholder-text-soft focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent transition-all resize-none text-sm"
          />
          <p className="text-xs text-text-soft text-right">{notes.length}/500</p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-3 animate-fade-in">
          {previewUrl ? (
            <>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="btn-primary py-3.5 flex items-center justify-center gap-2 font-display text-base"
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Saving Check-in...</span>
                  </>
                ) : (
                  <span>Upload & Save Check-in 📸</span>
                )}
              </button>

              <button
                onClick={handleRetake}
                disabled={isUploading}
                className="btn-secondary py-3 text-sm font-semibold"
              >
                Retake Photo
              </button>
            </>
          ) : (
            <>
              {!cameraError && (
                <button
                  onClick={handleSnap}
                  className="btn-primary py-3.5 flex items-center justify-center gap-2 font-display text-base"
                >
                  <span>Snap Progress Photo 📸</span>
                </button>
              )}

              {/* File Upload Fallback — accepts only jpg/png/webp */}
              <label className="btn-secondary py-3 text-sm font-semibold text-center cursor-pointer block">
                <span>Choose Photo from Device 📁</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-center text-xs text-text-soft">
                Accepted: JPEG, PNG, WebP — max 10 MB
              </p>
            </>
          )}
        </div>
      </main>

      {/* Keep stream reference to satisfy lint */}
      {stream && <span className="hidden" />}
    </div>
  )
}
