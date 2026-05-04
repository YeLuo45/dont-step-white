import { useCallback, useMemo } from 'react'
import { useStorage } from './useStorage'
import {
  STORAGE_BEST,
  STORAGE_BEST_TIMED,
  MOCK_GLOBAL_PLAYERS,
  STORAGE_FRIENDS,
  STORAGE_FRIEND_CACHE,
  GAME_MODE_ENDLESS,
  GAME_MODE_TIMED,
  GAME_MODE_STORY,
  GAME_MODE_DAILY
} from '../utils/constants'
import { STORY_CHAPTERS } from './useStoryGame'

// Generate a 6-letter friend code from nickname
export function generateFriendCode(nickname) {
  const prefix = nickname.slice(0, 2).toUpperCase()
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return prefix + suffix
}

// Encode friend data for URL sharing
export function encodeFriendData(data) {
  try {
    const json = JSON.stringify(data)
    return btoa(unescape(encodeURIComponent(json)))
  } catch (e) {
    console.error('Failed to encode friend data:', e)
    return null
  }
}

// Decode friend data from URL
export function decodeFriendData(encoded) {
  try {
    const json = decodeURIComponent(escape(atob(encoded)))
    return JSON.parse(json)
  } catch (e) {
    console.error('Failed to decode friend data:', e)
    return null
  }
}

// Format date for display
export function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Check if friend data is stale (> 7 days)
export function isFriendStale(lastUpdate) {
  if (!lastUpdate) return true
  const now = Date.now()
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  return now - lastUpdate > sevenDays
}

export function useLeaderboard() {
  // Friends list storage
  const [friends, setFriends] = useStorage(STORAGE_FRIENDS, [])
  // Friend cache storage (score data from shared URLs)
  const [friendCache, setFriendCache] = useStorage(STORAGE_FRIEND_CACHE, {})

  // === Global Leaderboard ===
  // Returns mock players + local best score inserted in correct position
  const getGlobalLeaderboard = useCallback(() => {
    // Get local best score
    let localBest = null
    try {
      const best = localStorage.getItem(STORAGE_BEST)
      if (best) {
        const parsed = JSON.parse(best)
        localBest = {
          id: 'local',
          nickname: '你',
          score: parsed.score || 0,
          date: parsed.date || formatDate(Date.now()),
          isLocal: true
        }
      }
    } catch (e) {
      // ignore
    }

    // Get timed best
    try {
      const timedBest = localStorage.getItem(STORAGE_BEST_TIMED)
      if (timedBest) {
        const parsed = JSON.parse(timedBest)
        if (parsed.score > (localBest?.score || 0)) {
          localBest = {
            id: 'local',
            nickname: '你',
            score: parsed.score || 0,
            date: parsed.date || formatDate(Date.now()),
            isLocal: true,
            mode: GAME_MODE_TIMED
          }
        }
      }
    } catch (e) {
      // ignore
    }

    // Build combined list
    let players = [...MOCK_GLOBAL_PLAYERS]
    if (localBest && localBest.score > 0) {
      // Insert local player into correct position
      const insertIndex = players.findIndex(p => p.score < localBest.score)
      if (insertIndex === -1) {
        players.push(localBest)
      } else {
        players.splice(insertIndex, 0, localBest)
      }
    }

    // Add rank numbers
    return players.map((player, index) => ({
      ...player,
      rank: index + 1
    }))
  }, [])

  // === Local Leaderboard ===
  // Returns all local best scores across modes
  const getLocalLeaderboard = useCallback(() => {
    const results = []

    // Endless mode
    try {
      const best = localStorage.getItem(STORAGE_BEST)
      if (best) {
        const parsed = JSON.parse(best)
        results.push({
          id: 'endless',
          mode: GAME_MODE_ENDLESS,
          modeName: '无尽模式',
          modeIcon: '♾️',
          score: parsed.score || 0,
          date: parsed.date || ''
        })
      }
    } catch (e) {
      // ignore
    }

    // Timed mode
    try {
      const timedBest = localStorage.getItem(STORAGE_BEST_TIMED)
      if (timedBest) {
        const parsed = JSON.parse(timedBest)
        results.push({
          id: 'timed',
          mode: GAME_MODE_TIMED,
          modeName: '限时模式',
          modeIcon: '⏱️',
          score: parsed.score || 0,
          date: parsed.date || ''
        })
      }
    } catch (e) {
      // ignore
    }

    // Sort by score descending
    return results.sort((a, b) => b.score - a.score)
  }, [])

  // === Friends Leaderboard ===
  // Returns friends with their cached scores
  const getFriendsLeaderboard = useCallback(() => {
    if (friends.length === 0) return []

    return friends.map(friend => {
      const cached = friendCache[friend.code]
      const stale = isFriendStale(cached?.lastUpdate)
      return {
        ...friend,
        score: cached?.score || friend.score || 0,
        lastUpdate: cached?.lastUpdate,
        stale
      }
    }).sort((a, b) => b.score - a.score)
  }, [friends, friendCache])

  // === Level Challenge Leaderboard ===
  // Returns story mode levels with best scores
  const getLevelLeaderboard = useCallback(() => {
    const results = []

    // Add story mode levels
    STORY_CHAPTERS.forEach(chapter => {
      for (let level = 1; level <= chapter.levels; level++) {
        const levelKey = `${chapter.id}_${level}`
        // Best scores are stored in storyProgress.bestScores
        // We need to get them from localStorage
        try {
          const progress = localStorage.getItem('dsw_v12_story_progress')
          if (progress) {
            const parsed = JSON.parse(progress)
            const bestScore = parsed.bestScores?.[levelKey] || 0
            const completed = parsed.completedLevels?.[levelKey]?.completed || false
            const stars = parsed.completedLevels?.[levelKey]?.stars || 0
            results.push({
              id: levelKey,
              chapterId: chapter.id,
              chapterName: chapter.name,
              level,
              name: `${chapter.name} - ${level}关`,
              bestScore,
              completed,
              stars
            })
          }
        } catch (e) {
          results.push({
            id: levelKey,
            chapterId: chapter.id,
            chapterName: chapter.name,
            level,
            name: `${chapter.name} - ${level}关`,
            bestScore: 0,
            completed: false,
            stars: 0
          })
        }
      }
    })

    return results
  }, [])

  // === My Best Score (for highlighting) ===
  const getMyBest = useCallback(() => {
    let bestScore = 0
    let bestDate = ''
    let bestMode = GAME_MODE_ENDLESS

    try {
      const best = localStorage.getItem(STORAGE_BEST)
      if (best) {
        const parsed = JSON.parse(best)
        if (parsed.score > bestScore) {
          bestScore = parsed.score
          bestDate = parsed.date || ''
          bestMode = GAME_MODE_ENDLESS
        }
      }
    } catch (e) {
      // ignore
    }

    try {
      const timedBest = localStorage.getItem(STORAGE_BEST_TIMED)
      if (timedBest) {
        const parsed = JSON.parse(timedBest)
        if (parsed.score > bestScore) {
          bestScore = parsed.score
          bestDate = parsed.date || ''
          bestMode = GAME_MODE_TIMED
        }
      }
    } catch (e) {
      // ignore
    }

    return { score: bestScore, date: bestDate, mode: bestMode }
  }, [])

  // === Friend Code Generation ===
  const generateMyFriendCode = useCallback((nickname) => {
    let code = generateFriendCode(nickname)
    // Ensure uniqueness
    let attempts = 0
    while (friends.some(f => f.code === code) && attempts < 10) {
      code = generateFriendCode(nickname + Date.now())
      attempts++
    }
    return code
  }, [friends])

  // === Add Friend ===
  const addFriend = useCallback((code, nickname, score) => {
    if (friends.length >= 20) {
      return { success: false, error: '最多添加20个好友' }
    }
    if (friends.some(f => f.code === code)) {
      return { success: false, error: '该好友码已存在' }
    }

    const newFriend = {
      code,
      nickname,
      score: score || 0,
      lastUpdate: Date.now()
    }

    setFriends(prev => [...prev, newFriend])

    // Also update cache
    if (score) {
      setFriendCache(prev => ({
        ...prev,
        [code]: { score, lastUpdate: Date.now() }
      }))
    }

    return { success: true }
  }, [friends, setFriends, setFriendCache])

  // === Update Friend from URL ===
  const updateFriendFromShare = useCallback((friendCode, nickname, score) => {
    setFriendCache(prev => ({
      ...prev,
      [friendCode]: { nickname, score, lastUpdate: Date.now() }
    }))

    // Also update friends list if exists
    setFriends(prev => prev.map(f => {
      if (f.code === friendCode) {
        return { ...f, nickname, score, lastUpdate: Date.now() }
      }
      return f
    }))
  }, [setFriends, setFriendCache])

  // === Parse Friend from URL ===
  const parseFriendFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search)
    const friendParam = params.get('friend')
    if (friendParam) {
      return decodeFriendData(friendParam)
    }
    return null
  }, [])

  // === Generate Share URL for friend adding ===
  const generateFriendShareUrl = useCallback((nickname, score) => {
    const data = { n: nickname, s: score, c: generateMyFriendCode(nickname), t: Date.now() }
    const encoded = encodeFriendData(data)
    if (!encoded) return null

    const baseUrl = window.location.origin + window.location.pathname
    return `${baseUrl}?friend=${encoded}`
  }, [generateMyFriendCode])

  // === Remove Friend ===
  const removeFriend = useCallback((code) => {
    setFriends(prev => prev.filter(f => f.code !== code))
    setFriendCache(prev => {
      const newCache = { ...prev }
      delete newCache[code]
      return newCache
    })
  }, [setFriends, setFriendCache])

  // === Get My Nickname ===
  const getMyNickname = useCallback(() => {
    try {
      const best = localStorage.getItem(STORAGE_BEST)
      if (best) {
        const parsed = JSON.parse(best)
        return parsed.nickname || '玩家'
      }
    } catch (e) {
      // ignore
    }
    return '玩家'
  }, [])

  return {
    // Data providers
    getGlobalLeaderboard,
    getLocalLeaderboard,
    getFriendsLeaderboard,
    getLevelLeaderboard,
    getMyBest,
    getMyNickname,

    // Friend management
    friends,
    addFriend,
    removeFriend,
    updateFriendFromShare,
    parseFriendFromUrl,
    generateFriendShareUrl,
    generateMyFriendCode
  }
}
