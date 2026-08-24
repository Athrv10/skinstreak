/**
 * api/photos.ts — Photo upload and progress journal API functions.
 */

import apiClient, { BASE_URL } from './client'

/** Allowed MIME types for client-side pre-validation */
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export interface Photo {
  id: number
  user_id: number
  daily_routine_id: number | null
  storage_url: string
  captured_at: string
  created_at: string
  streak_day: number
  am_done: boolean
  pm_done: boolean
}

/** Validates a file before upload. Returns an error string or null. */
export function validatePhotoFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    return `Invalid file type "${file.type}". Please upload a JPEG, PNG, or WebP image.`
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File is too large. Maximum allowed size is 10 MB.'
  }
  return null
}

/** Uploads progress photo for today's check-in. */
export async function uploadPhoto(file: File): Promise<Photo> {
  const validationError = validatePhotoFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const formData = new FormData()
  formData.append('file', file)

  const { data } = await apiClient.post<Photo>('/photos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/** Fetches all progress photos for authenticated user. */
export async function getPhotos(): Promise<Photo[]> {
  const { data } = await apiClient.get<Photo[]>('/photos')
  return data
}

/** Fetches details for a single photo. */
export async function getPhotoById(photoId: number): Promise<Photo> {
  const { data } = await apiClient.get<Photo>(`/photos/${photoId}`)
  return data
}

/** Resolves full photo image URL. */
export function getPhotoFullUrl(storageUrl: string): string {
  if (
    storageUrl.startsWith('http://') ||
    storageUrl.startsWith('https://') ||
    storageUrl.startsWith('data:')
  ) {
    return storageUrl
  }
  return `${BASE_URL}${storageUrl}`
}
