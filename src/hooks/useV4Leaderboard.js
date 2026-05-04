import { useCallback, useMemo } from 'react'
import { useStorage } from './useStorage'
import { STORAGE_BEST } from '../utils/constants'

const STORAGE_SHARED = 'dsw_v4_shared'
const EXPIRY_DAYS = 30

// Encode share data to base64
export function encodeShareData(data) {
  try {
    const json = JSON.stringify(data)
    // Use base64 encoding compatible with URL
    return btoa(unescape(encodeURIComponent(json)))
  } catch (e) {
    console.error('Failed to encode share data:', e)
    return null
  }
}

// Decode share data from base64
export function decodeShareData(encoded) {
  try {
    const json = decodeURIComponent(escape(atob(encoded)))
    return JSON.parse(json)
  } catch (e) {
    console.error('Failed to decode share data:', e)
    return null
  }
}

// Check if share data is expired (older than 30 days)
export function isShareExpired(timestamp) {
  const now = Date.now()
  const expiryMs = EXPIRY_DAYS * 24 * 60 * 60 * 1000
  return now - timestamp > expiryMs
}

// Format timestamp to readable date
export function formatShareDate(timestamp) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function useV4Leaderboard() {
  const [sharedRecords, setSharedRecords] = useStorage(STORAGE_SHARED, [])

  // Add a new shared record
  const addSharedRecord = useCallback((nickname, score, skin, shareUrl) => {
    const record = {
      n: nickname,
      s: score,
      sk: skin,
      t: Date.now(),
      url: shareUrl
    }
    setSharedRecords(prev => {
      // Keep only last 20 records
      const updated = [record, ...prev].slice(0, 20)
      return updated
    })
    return record
  }, [setSharedRecords])

  // Get my best score from V2 storage
  const getMyBest = useCallback(() => {
    try {
      const best = localStorage.getItem(STORAGE_BEST)
      if (best) {
        return JSON.parse(best)
      }
    } catch (e) {
      console.warn('Failed to get best score:', e)
    }
    return null
  }, [])

  // Remove expired records
  const getValidRecords = useCallback(() => {
    return sharedRecords.filter(record => !isShareExpired(record.t))
  }, [sharedRecords])

  // Generate share URL
  const generateShareUrl = useCallback((nickname, score, skin) => {
    const data = { n: nickname, s: score, sk: skin, t: Date.now() }
    const encoded = encodeShareData(data)
    if (!encoded) return null
    
    const baseUrl = window.location.origin + window.location.pathname
    return `${baseUrl}?rank=${encoded}`
  }, [])

  // Parse URL for rank parameter
  const parseUrlRank = useCallback(() => {
    const params = new URLSearchParams(window.location.search)
    const rank = params.get('rank')
    if (rank) {
      return decodeShareData(rank)
    }
    return null
  }, [])

  // Clear all shared records
  const clearSharedRecords = useCallback(() => {
    setSharedRecords([])
  }, [setSharedRecords])

  return {
    sharedRecords,
    addSharedRecord,
    getMyBest,
    getValidRecords,
    generateShareUrl,
    parseUrlRank,
    clearSharedRecords
  }
}
