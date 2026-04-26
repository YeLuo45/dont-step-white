import { useState, useEffect, useCallback, useRef } from 'react'
import { useStorage } from './useStorage'
import { useAudio } from './useAudio'
import {
  COLS, ROWS, INITIAL_SPEED, MIN_SPEED,
  SPEED_INCREASE_INTERVAL, SPEED_INCREASE_RATE,
  CELL_EMPTY, CELL_WHITE, CELL_BLACK,
  GAME_STATE_IDLE, GAME_STATE_PLAYING, GAME_STATE_PAUSED, GAME_STATE_GAME_OVER,
  STORAGE_HIGH_SCORE
} from '../utils/constants'

function generateRow(pointerCol) {
  // 经典钢琴块：每行只有1个黑块，其余为白块
  // 确保黑块不会落在 pointer 列，给予玩家反应时间
  const availableCols = Array.from({ length: COLS }, (_, i) => i).filter(c => c !== pointerCol)
  const blackCol = availableCols[Math.floor(Math.random() * availableCols.length)]
  return Array(COLS).fill(null).map((_, colIdx) =>
    colIdx === blackCol ? CELL_BLACK : CELL_WHITE
  )
}

function createInitialGrid(startPointerCol) {
  // 全部留空，给玩家充足的反应时间
  // 黑块从顶部开始下落，需要 ROWS 次 tick 才能到达底部
  return Array(ROWS).fill(null).map(() =>
    Array(COLS).fill(CELL_EMPTY)
  )
}

function gridPushDown(grid, pointerCol) {
  return [...grid.slice(1), generateRow(pointerCol)]
}

function checkBottomRow(grid) {
  return grid[ROWS - 1].some(cell => cell === CELL_BLACK)
}

export function useGame() {
  const [grid, setGrid] = useState(() => createInitialGrid(1))
  const [pointerCol, setPointerCol] = useState(1)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useStorage(STORAGE_HIGH_SCORE, 0)
  const [gameState, setGameState] = useState(GAME_STATE_IDLE)
  const [speed, setSpeed] = useState(INITIAL_SPEED)

  const { playStep, playFail } = useAudio()
  const intervalRef = useRef(null)

  // Track if player stepped on bottom row this tick (to avoid race with interval)
  const steppedOnBottomRef = useRef(false)
  // Track if black block just reached bottom row this tick (gives player 1 tick to react)
  const blockJustReachedBottomRef = useRef(false)

  // Use refs to avoid stale closure in interval callback
  const gameStateRef = useRef(gameState)
  const scoreRef = useRef(score)
  const highScoreRef = useRef(highScore)
  const gridRef = useRef(grid)
  const pointerColRef = useRef(pointerCol)

  // Keep refs in sync with state
  gameStateRef.current = gameState
  scoreRef.current = score
  highScoreRef.current = highScore
  gridRef.current = grid
  pointerColRef.current = pointerCol

  const calculateSpeed = useCallback((currentScore) => {
    const level = Math.floor(currentScore / SPEED_INCREASE_INTERVAL)
    const newSpeed = INITIAL_SPEED * Math.pow(SPEED_INCREASE_RATE, level)
    return Math.max(newSpeed, MIN_SPEED)
  }, [])

  const startGame = useCallback(() => {
    blockJustReachedBottomRef.current = false
    steppedOnBottomRef.current = false
    setGrid(createInitialGrid(pointerColRef.current))
    setPointerCol(1)
    setScore(0)
    setSpeed(INITIAL_SPEED)
    setGameState(GAME_STATE_PLAYING)
  }, [])

  const pauseGame = useCallback(() => setGameState(GAME_STATE_PAUSED), [])
  const resumeGame = useCallback(() => setGameState(GAME_STATE_PLAYING), [])

  const endGame = useCallback(() => {
    const currentScore = scoreRef.current
    const currentHighScore = highScoreRef.current
    setGameState(GAME_STATE_GAME_OVER)
    if (currentScore > currentHighScore) setHighScore(currentScore)
    playFail()
  }, [setHighScore, playFail])

  const stepOn = useCallback(() => {
    if (gameStateRef.current !== GAME_STATE_PLAYING) return
    const bottomRowIdx = ROWS - 1
    const currentGrid = gridRef.current
    const currentPointerCol = pointerColRef.current
    const targetCell = currentGrid[bottomRowIdx][currentPointerCol]

    if (targetCell === CELL_EMPTY) return
    else if (targetCell === CELL_WHITE) {
      endGame()
      return
    } else {
      const newGrid = currentGrid.map((row, rowIdx) =>
        rowIdx === bottomRowIdx
          ? row.map((cell, colIdx) => colIdx === currentPointerCol ? CELL_EMPTY : cell)
          : row
      )
      setGrid(newGrid)
      steppedOnBottomRef.current = true  // Mark that player stepped on bottom this tick
      const newScore = scoreRef.current + 1
      setScore(newScore)
      setSpeed(calculateSpeed(newScore))
      playStep()
      if (newScore > highScoreRef.current) setHighScore(newScore)
    }
  }, [endGame, calculateSpeed, playStep, setHighScore])

  const moveLeft = useCallback(() => {
    if (gameStateRef.current !== GAME_STATE_PLAYING) return
    setPointerCol(prev => Math.max(0, prev - 1))
  }, [])

  const moveRight = useCallback(() => {
    if (gameStateRef.current !== GAME_STATE_PLAYING) return
    setPointerCol(prev => Math.min(COLS - 1, prev + 1))
  }, [])

  useEffect(() => {
    if (gameState !== GAME_STATE_PLAYING) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      steppedOnBottomRef.current = false  // Reset at start of each tick
      setGrid(prevGrid => {
        // Check if player failed to step on black block that just reached bottom
        if (!steppedOnBottomRef.current && blockJustReachedBottomRef.current) {
          // Player didn't step on the black block that reached bottom last tick
          clearInterval(intervalRef.current)
          intervalRef.current = null
          setTimeout(() => endGame(), 0)
          return prevGrid
        }
        blockJustReachedBottomRef.current = false  // Reset
        const newGrid = gridPushDown(prevGrid, pointerColRef.current)
        // Check if a black block just reached bottom row (player has 1 tick to react)
        if (checkBottomRow(newGrid)) {
          blockJustReachedBottomRef.current = true
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
  }, [gameState, speed, endGame])

  return { grid, pointerCol, score, highScore, gameState, startGame, pauseGame, resumeGame, stepOn, moveLeft, moveRight }
}
