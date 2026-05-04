import { useState, useCallback, useRef, useEffect } from 'react'
import { useStorage } from './useStorage'
import { useAudio } from './useAudio'
import {
  COLS, ROWS, CELL_EMPTY, CELL_WHITE, CELL_BLACK,
  GAME_STATE_IDLE, GAME_STATE_PLAYING, GAME_STATE_PAUSED, GAME_STATE_GAME_OVER
} from '../utils/constants'

// Story mode constants
export const STORY_CHAPTERS = [
  {
    id: 'forest',
    name: '🌲 神秘森林',
    description: '穿越幽暗的森林，躲避白块的袭击',
    levels: 10,
    theme: 'forest',
    bgGradient: 'linear-gradient(180deg, #1a3a1a 0%, #0d1f0d 50%, #051005 100%)',
    accentColor: '#4ade80'
  },
  {
    id: 'city',
    name: '🌆 霓虹城市',
    description: '在霓虹闪烁的城市街道中穿行',
    levels: 10,
    theme: 'city',
    bgGradient: 'linear-gradient(180deg, #1a1a3a 0%, #0d0d1f 50%, #050510 100%)',
    accentColor: '#f472b6'
  },
  {
    id: 'stars',
    name: '✨ 璀璨星空',
    description: '踏上星际之旅，穿越浩瀚星河',
    levels: 10,
    theme: 'stars',
    bgGradient: 'linear-gradient(180deg, #0a0a2a 0%, #050514 50%, #000008 100%)',
    accentColor: '#a78bfa'
  }
]

const STORAGE_STORY_PROGRESS = 'dsw_v12_story_progress'

// Get black block probability for a level (3% increase per level, starting from 20%)
function getBlackBlockProbability(levelNum) {
  return Math.min(0.20 + (levelNum - 1) * 0.03, 0.50)
}

// Get speed for a level (decreases interval as level increases)
function getLevelSpeed(levelNum, isBoss) {
  const baseSpeed = 800
  const speedMultiplier = Math.pow(0.92, levelNum - 1)
  const finalSpeed = baseSpeed * speedMultiplier
  // Boss levels are faster
  return isBoss ? finalSpeed * 0.5 : Math.max(finalSpeed, 180)
}

// Get max white blocks for a level
function getMaxWhiteBlocks(levelNum, isBoss) {
  const base = Math.min(1 + Math.floor(levelNum / 3), 3)
  return isBoss ? base + 2 : base
}

// Generate a row with black and white blocks based on probabilities
function generateStoryRow(pointerCol, blackProb, maxWhiteBlocks) {
  const availableCols = Array.from({ length: COLS }, (_, i) => i).filter(c => c !== pointerCol)
  
  // Decide if this row has a black block (always has one)
  const blackCol = availableCols[0]
  
  // Random white blocks based on probability
  const whiteIndices = []
  const remainingCols = availableCols.slice(1)
  
  for (let i = 0; i < maxWhiteBlocks && remainingCols.length > 0; i++) {
    if (Math.random() < blackProb) {
      const randIdx = Math.floor(Math.random() * remainingCols.length)
      whiteIndices.push(remainingCols.splice(randIdx, 1)[0])
    }
  }
  
  return Array(COLS).fill(null).map((_, colIdx) => {
    if (colIdx === blackCol) return CELL_BLACK
    if (whiteIndices.includes(colIdx)) return CELL_WHITE
    return CELL_EMPTY
  })
}

function createInitialGrid() {
  return Array(ROWS).fill(null).map(() =>
    Array(COLS).fill(CELL_EMPTY)
  )
}

function checkBlackBlockInBottomRow(grid) {
  return grid[ROWS - 1].some(cell => cell === CELL_BLACK)
}

function checkFullWhiteRow(grid) {
  return grid[ROWS - 1].every(cell => cell === CELL_WHITE)
}

export function useStoryGame() {
  const [storyProgress, setStoryProgress] = useStorage(STORAGE_STORY_PROGRESS, {
    unlockedChapters: ['forest'], // First chapter unlocked
    unlockedLevels: { 'forest_1': true }, // First level of first chapter unlocked
    completedLevels: {}, // { 'forest_1': { completed: true, stars: 3, livesLeft: 3 } }
    bestScores: {} // { 'forest_1': 100 }
  })

  const [currentChapter, setCurrentChapter] = useState(null)
  const [currentLevel, setCurrentLevel] = useState(null)
  const [grid, setGrid] = useState(() => createInitialGrid())
  const [pointerCol, setPointerCol] = useState(1)
  const [score, setScore] = useState(0)
  const [gameState, setGameState] = useState(GAME_STATE_IDLE)
  const [lives, setLives] = useState(3)
  const [combo, setCombo] = useState(0)
  const [chapterCleared, setChapterCleared] = useState(false)
  const [levelComplete, setLevelComplete] = useState(false)
  const [earnedCoins, setEarnedCoins] = useState(0)

  const { playStepBlack, playStepWhite, playFail } = useAudio()
  const intervalRef = useRef(null)

  // Refs to avoid stale closure
  const gameStateRef = useRef(gameState)
  const scoreRef = useRef(score)
  const gridRef = useRef(grid)
  const pointerColRef = useRef(pointerCol)
  const livesRef = useRef(lives)
  const comboRef = useRef(combo)
  const currentChapterRef = useRef(currentChapter)
  const currentLevelRef = useRef(currentLevel)

  gameStateRef.current = gameState
  scoreRef.current = score
  gridRef.current = grid
  pointerColRef.current = pointerCol
  livesRef.current = lives
  comboRef.current = combo
  currentChapterRef.current = currentChapter
  currentLevelRef.current = currentLevel

  // Check if a level is a boss level (every 5th level)
  const isBossLevel = useCallback((levelNum) => {
    return levelNum % 5 === 0
  }, [])

  // Check if level is unlocked
  const isLevelUnlocked = useCallback((chapterId, levelNum) => {
    if (chapterId === 'forest' && levelNum === 1) return true
    if (!storyProgress.unlockedLevels[`${chapterId}_${levelNum}`]) {
      // Check if previous level is completed
      return storyProgress.completedLevels[`${chapterId}_${levelNum - 1}`]?.completed
    }
    return true
  }, [storyProgress])

  // Check if chapter is unlocked
  const isChapterUnlocked = useCallback((chapterId) => {
    return storyProgress.unlockedChapters.includes(chapterId)
  }, [storyProgress])

  // Start a specific level
  const startLevel = useCallback((chapterId, levelNum) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    
    setCurrentChapter(chapterId)
    setCurrentLevel(levelNum)
    setGrid(createInitialGrid())
    setPointerCol(1)
    setScore(0)
    setLives(3)
    setCombo(0)
    setChapterCleared(false)
    setLevelComplete(false)
    setEarnedCoins(0)
    setGameState(GAME_STATE_PLAYING)
  }, [])

  const pauseGame = useCallback(() => setGameState(GAME_STATE_PAUSED), [])
  const resumeGame = useCallback(() => setGameState(GAME_STATE_PLAYING), [])

  const loseLife = useCallback(() => {
    const newLives = livesRef.current - 1
    setLives(newLives)
    if (newLives <= 0) {
      setGameState(GAME_STATE_GAME_OVER)
    }
  }, [])

  const stepOn = useCallback(() => {
    if (gameStateRef.current !== GAME_STATE_PLAYING) return
    const bottomRowIdx = ROWS - 1
    const currentGrid = gridRef.current
    const currentPointerCol = pointerColRef.current
    const targetCell = currentGrid[bottomRowIdx][currentPointerCol]

    if (targetCell === CELL_EMPTY) return

    // Step on white block
    if (targetCell === CELL_WHITE) {
      playStepWhite()
      // Lose 1 life, clear the white block
      const newGrid = currentGrid.map((row, rowIdx) =>
        rowIdx === bottomRowIdx
          ? row.map((cell, colIdx) => colIdx === currentPointerCol ? CELL_EMPTY : cell)
          : row
      )
      setGrid(newGrid)
      setCombo(0)
      loseLife()
      return
    }

    // Step on black block
    playStepBlack()
    let earnedScore = 1
    let newCombo = comboRef.current + 1
    earnedScore = newCombo * 2

    const newGrid = currentGrid.map((row, rowIdx) =>
      rowIdx === bottomRowIdx
        ? row.map((cell, colIdx) => colIdx === currentPointerCol ? CELL_EMPTY : cell)
        : row
    )
    setGrid(newGrid)
    const newScore = scoreRef.current + earnedScore
    setScore(newScore)
    setCombo(newCombo)

    // Check if level is complete (reach score threshold)
    const chapter = STORY_CHAPTERS.find(c => c.id === currentChapterRef.current)
    const level = currentLevelRef.current
    if (chapter && level) {
      const passScore = level * 10 // 10 points per level
      if (newScore >= passScore) {
        // Level complete!
        setLevelComplete(true)
        setGameState(GAME_STATE_GAME_OVER)
        
        // Calculate coins earned (remaining lives × 10)
        const coinsEarned = livesRef.current * 10
        setEarnedCoins(coinsEarned)
        
        // Save progress
        const levelKey = `${currentChapterRef.current}_${level}`
        setStoryProgress(prev => {
          const newProgress = { ...prev }
          
          // Mark level as completed
          if (!newProgress.completedLevels[levelKey]) {
            newProgress.completedLevels[levelKey] = { completed: true, stars: 0, livesLeft: livesRef.current }
          } else {
            newProgress.completedLevels[levelKey] = {
              ...newProgress.completedLevels[levelKey],
              livesLeft: Math.max(newProgress.completedLevels[levelKey].livesLeft, livesRef.current)
            }
          }
          
          // Update best score
          if (!newProgress.bestScores[levelKey] || newScore > newProgress.bestScores[levelKey]) {
            newProgress.bestScores[levelKey] = newScore
          }
          
          // Calculate stars (based on lives remaining and score)
          const stars = Math.min(3, Math.max(1, Math.floor(livesRef.current * 0.8 + newScore / 100)))
          if (!newProgress.completedLevels[levelKey].stars || stars > newProgress.completedLevels[levelKey].stars) {
            newProgress.completedLevels[levelKey].stars = stars
          }
          
          // Unlock next level
          if (level < chapter.levels) {
            newProgress.unlockedLevels[`${currentChapterRef.current}_${level + 1}`] = true
          } else {
            // Chapter complete! Unlock next chapter
            const chapterIndex = STORY_CHAPTERS.findIndex(c => c.id === currentChapterRef.current)
            if (chapterIndex < STORY_CHAPTERS.length - 1) {
              const nextChapter = STORY_CHAPTERS[chapterIndex + 1]
              if (!newProgress.unlockedChapters.includes(nextChapter.id)) {
                newProgress.unlockedChapters.push(nextChapter.id)
              }
              newProgress.unlockedLevels[`${nextChapter.id}_1`] = true
            }
            setChapterCleared(true)
          }
          
          return newProgress
        })
        return
      }
    }
  }, [playStepBlack, playStepWhite, loseLife, setStoryProgress])

  const moveLeft = useCallback(() => {
    if (gameStateRef.current !== GAME_STATE_PLAYING) return
    setPointerCol(prev => Math.max(0, prev - 1))
  }, [])

  const moveRight = useCallback(() => {
    if (gameStateRef.current !== GAME_STATE_PLAYING) return
    setPointerCol(prev => Math.min(COLS - 1, prev + 1))
  }, [])

  // Game loop
  useEffect(() => {
    if (gameState !== GAME_STATE_PLAYING) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const chapter = STORY_CHAPTERS.find(c => c.id === currentChapterRef.current)
    const level = currentLevelRef.current
    if (!chapter || !level) return

    const isBoss = isBossLevel(level)
    const blackProb = getBlackBlockProbability(level)
    const maxWhite = getMaxWhiteBlocks(level, isBoss)
    const speed = getLevelSpeed(level, isBoss)

    intervalRef.current = setInterval(() => {
      setGrid(prevGrid => {
        const newRow = generateStoryRow(pointerColRef.current, blackProb, maxWhite)
        const newGrid = [newRow, ...prevGrid.slice(0, -1)]

        // Check if black block reached bottom without being stepped on
        if (checkBlackBlockInBottomRow(newGrid)) {
          // Clear the black blocks but don't lose life (they auto-clear)
          const clearedGrid = newGrid.map((row, rowIdx) =>
            rowIdx === ROWS - 1
              ? row.map(cell => cell === CELL_BLACK ? CELL_EMPTY : cell)
              : row
          )
          setCombo(0)
          return clearedGrid
        }

        return newGrid
      })
    }, speed)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [gameState, currentChapter, currentLevel, isBossLevel])

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Calculate pass score for a level
  const getPassScore = useCallback((levelNum) => {
    return levelNum * 10
  }, [])

  // Get level info
  const getLevelInfo = useCallback((chapterId, levelNum) => {
    const chapter = STORY_CHAPTERS.find(c => c.id === chapterId)
    if (!chapter) return null
    const levelKey = `${chapterId}_${levelNum}`
    return {
      chapter,
      levelNum,
      isBoss: isBossLevel(levelNum),
      passScore: getPassScore(levelNum),
      unlocked: isLevelUnlocked(chapterId, levelNum),
      completed: storyProgress.completedLevels[levelKey]?.completed,
      stars: storyProgress.completedLevels[levelKey]?.stars || 0,
      bestScore: storyProgress.bestScores[levelKey] || 0
    }
  }, [storyProgress, isBossLevel, getPassScore, isLevelUnlocked])

  return {
    // State
    currentChapter,
    currentLevel,
    grid,
    pointerCol,
    score,
    gameState,
    lives,
    combo,
    storyProgress,
    chapterCleared,
    levelComplete,
    earnedCoins,
    // Actions
    startLevel,
    pauseGame,
    resumeGame,
    stepOn,
    moveLeft,
    moveRight,
    isLevelUnlocked,
    isChapterUnlocked,
    getLevelInfo,
    getPassScore,
    STORY_CHAPTERS
  }
}