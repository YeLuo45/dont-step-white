// Daily Challenge V10 - Deterministic level generation based on date
import { COLS, ROWS, CELL_EMPTY, CELL_WHITE, CELL_BLACK } from './constants'

// Challenge types
export const CHALLENGE_TYPES = {
  BLIND: 'blind',     // Cannot see upcoming rows
  SPEED: 'speed',     // Higher speed
  PRECISION: 'precision', // More white blocks
  RHYTHM: 'rhythm'    // Specific pattern timing
}

// Challenge type configs
export const CHALLENGE_CONFIGS = {
  [CHALLENGE_TYPES.BLIND]: {
    name: '👁️ 盲眼挑战',
    desc: '看不见即将下落的行',
    color: '#9b59b6',
    speedMultiplier: 1,
    maxWhiteBlocksBase: 1,
    visibleRows: 3, // Only show bottom 3 rows
    lives: 3,
    noPowerups: false
  },
  [CHALLENGE_TYPES.SPEED]: {
    name: '⚡ 速度挑战',
    desc: '速度加快50%',
    color: '#e74c3c',
    speedMultiplier: 0.6, // 40% faster
    maxWhiteBlocksBase: 1,
    visibleRows: ROWS,
    lives: 3,
    noPowerups: true
  },
  [CHALLENGE_TYPES.PRECISION]: {
    name: '🎯 精准挑战',
    desc: '白块数量翻倍',
    color: '#3498db',
    speedMultiplier: 1,
    maxWhiteBlocksBase: 2,
    visibleRows: ROWS,
    lives: 3,
    noPowerups: false
  },
  [CHALLENGE_TYPES.RHYTHM]: {
    name: '🎵 节奏挑战',
    desc: '固定节奏模式',
    color: '#2ecc71',
    speedMultiplier: 0.8,
    maxWhiteBlocksBase: 1,
    visibleRows: ROWS,
    lives: 3,
    noPowerups: true,
    rhythmMode: true
  }
}

// Storage keys
export const STORAGE_DAILY_NICKNAME = 'dsw_v10_daily_nickname'
export const STORAGE_DAILY_RECORD = 'dsw_v10_daily_record'
export const STORAGE_DAILY_LEADERBOARD = 'dsw_v10_daily_leaderboard'

// Revive costs
export const REVIVE_COST_COINS = 50
export const REVIVE_COST_AD = 'ad' // Indicates ad watching is the other option

// Get today's date string (YYYY-MM-DD)
export function getTodayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// Simple hash function for deterministic random based on date + type
function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

// Seeded random number generator
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Get challenge type for a specific date (cycles through 4 types)
export function getChallengeTypeForDate(dateString) {
  const hash = simpleHash(dateString)
  const types = Object.values(CHALLENGE_TYPES)
  return types[hash % types.length]
}

// Generate a deterministic custom grid pattern for the day
export function generateDailyGrid(dateString, challengeType, numRows = 8) {
  const config = CHALLENGE_CONFIGS[challengeType]
  const grid = []
  
  // Create a seed from date and challenge type
  const baseSeed = simpleHash(dateString + challengeType)
  
  for (let row = 0; row < numRows; row++) {
    const rowSeed = baseSeed + row * 1000
    const newRow = Array(COLS).fill(CELL_EMPTY)
    
    // Determine black position (always 1 black per row)
    const blackPos = Math.floor(seededRandom(rowSeed) * COLS)
    newRow[blackPos] = CELL_BLACK
    
    // Determine white block positions based on challenge type
    let maxWhite
    if (challengeType === CHALLENGE_TYPES.PRECISION) {
      maxWhite = Math.min(config.maxWhiteBlocksBase + Math.floor(row / 3), COLS - 1)
    } else if (challengeType === CHALLENGE_TYPES.RHYTHM) {
      // Rhythm mode: white blocks appear in a predictable alternating pattern
      maxWhite = (row % 2 === 0) ? 1 : 0
    } else {
      maxWhite = config.maxWhiteBlocksBase
    }
    
    // Add white blocks
    const availableCols = []
    for (let c = 0; c < COLS; c++) {
      if (c !== blackPos) availableCols.push(c)
    }
    
    for (let i = 0; i < maxWhite && availableCols.length > 0; i++) {
      const whiteIdx = Math.floor(seededRandom(rowSeed + i * 100) * availableCols.length)
      const col = availableCols.splice(whiteIdx, 1)[0]
      newRow[col] = CELL_WHITE
    }
    
    grid.push(newRow)
  }
  
  return grid
}

// Get the full challenge config for today
export function getTodayChallenge() {
  const today = getTodayString()
  const type = getChallengeTypeForDate(today)
  const config = CHALLENGE_CONFIGS[type]
  const grid = generateDailyGrid(today, type)
  
  return {
    date: today,
    type,
    ...config,
    customGridPattern: grid
  }
}

// Save daily challenge score
export function saveDailyScore(nickname, score, isNewRecord) {
  const today = getTodayString()
  const record = {
    nickname,
    score,
    date: today,
    timestamp: Date.now()
  }
  
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_DAILY_RECORD) || '{}')
    
    // Only update if new record or first attempt today
    if (!existing[today] || score > existing[today].score) {
      existing[today] = record
      localStorage.setItem(STORAGE_DAILY_RECORD, JSON.stringify(existing))
    }
    
    return existing[today]
  } catch (e) {
    console.error('Failed to save daily score:', e)
    return record
  }
}

// Get today's score (if played)
export function getTodayScore() {
  const today = getTodayString()
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_DAILY_RECORD) || '{}')
    return existing[today] || null
  } catch (e) {
    return null
  }
}

// Get all daily scores (for history)
export function getAllDailyScores() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_DAILY_RECORD) || '{}')
  } catch (e) {
    return {}
  }
}

// Leaderboard functions
export function getDailyLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_DAILY_LEADERBOARD) || '[]')
  } catch (e) {
    return []
  }
}

export function saveDailyLeaderboardEntry(nickname, score, today) {
  const leaderboard = getDailyLeaderboard()
  
  // Check if already has entry for today
  const existingIdx = leaderboard.findIndex(e => e.date === today && e.nickname === nickname)
  
  const entry = {
    nickname,
    score,
    date: today,
    timestamp: Date.now()
  }
  
  if (existingIdx >= 0) {
    // Update if better score
    if (score > leaderboard[existingIdx].score) {
      leaderboard[existingIdx] = entry
    }
  } else {
    leaderboard.push(entry)
  }
  
  // Sort by score descending
  leaderboard.sort((a, b) => b.score - a.score)
  
  // Keep top 100
  const trimmed = leaderboard.slice(0, 100)
  
  localStorage.setItem(STORAGE_DAILY_LEADERBOARD, JSON.stringify(trimmed))
  
  return trimmed
}

export function getTodayLeaderboard() {
  const today = getTodayString()
  const leaderboard = getDailyLeaderboard()
  return leaderboard.filter(e => e.date === today)
}

export function getRankForToday(nickname) {
  const today = getTodayString()
  const leaderboard = getTodayLeaderboard()
  
  // Sort by score
  leaderboard.sort((a, b) => b.score - a.score)
  
  const idx = leaderboard.findIndex(e => e.nickname === nickname)
  return idx >= 0 ? idx + 1 : null
}

export function getPreviousRankForToday(nickname, score) {
  const today = getTodayString()
  const leaderboard = getDailyLeaderboard()
  
  // Get entries before today
  const previousEntries = leaderboard.filter(e => e.date < today && e.nickname === nickname)
  
  if (previousEntries.length === 0) return null
  
  // Find best previous score
  const bestPrev = Math.max(...previousEntries.map(e => e.score))
  
  // Count how many people with today's date have score > bestPrev but < current score
  const todayEntries = leaderboard.filter(e => e.date === today)
  const rank = todayEntries.filter(e => e.score > bestPrev).length + 1
  
  return rank
}

// Nickname management
export function getDailyNickname() {
  try {
    return localStorage.getItem(STORAGE_DAILY_NICKNAME) || ''
  } catch (e) {
    return ''
  }
}

export function setDailyNickname(nickname) {
  try {
    localStorage.setItem(STORAGE_DAILY_NICKNAME, nickname)
    return true
  } catch (e) {
    return false
  }
}
