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

function generateRow() {
  const numBlack = Math.floor(Math.random() * 3) + 1
  const cols = [0, 1, 2, 3]
  const shuffled = cols.sort(() => Math.random() - 0.5)
  const blackCols = new Set(shuffled.slice(0, numBlack))
  return Array(COLS).fill(null).map((_, colIdx) =>
    blackCols.has(colIdx) ? CELL_BLACK : CELL_WHITE
  )
}

function createInitialGrid() {
  const rows = []
  for (let i = 0; i < ROWS - 1; i++) {
    rows.push(generateRow())
  }
  rows.push(Array(COLS).fill(CELL_EMPTY))
  return rows
}

function gridPushDown(grid) {
  return [...grid.slice(1), generateRow()]
}

function checkBottomRow(grid) {
  return grid[ROWS - 1].some(cell => cell === CELL_BLACK)
}

export function useGame() {
  const [grid, setGrid] = useState(createInitialGrid)
  const [pointerCol, setPointerCol] = useState(1)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useStorage(STORAGE_HIGH_SCORE, 0)
  const [gameState, setGameState] = useState(GAME_STATE_IDLE)
  const [speed, setSpeed] = useState(INITIAL_SPEED)

  const { playStep, playFail } = useAudio()
  const intervalRef = useRef(null)

  const calculateSpeed = useCallback((currentScore) => {
    const level = Math.floor(currentScore / SPEED_INCREASE_INTERVAL)
    const newSpeed = INITIAL_SPEED * Math.pow(SPEED_INCREASE_RATE, level)
    return Math.max(newSpeed, MIN_SPEED)
  }, [])

  const startGame = useCallback(() => {
    setGrid(createInitialGrid())
    setPointerCol(1)
    setScore(0)
    setSpeed(INITIAL_SPEED)
    setGameState(GAME_STATE_PLAYING)
  }, [])

  const pauseGame = useCallback(() => setGameState(GAME_STATE_PAUSED), [])
  const resumeGame = useCallback(() => setGameState(GAME_STATE_PLAYING), [])

  const endGame = useCallback(() => {
    setGameState(GAME_STATE_GAME_OVER)
    if (score > highScore) setHighScore(score)
    playFail()
  }, [score, highScore, setHighScore, playFail])

  const stepOn = useCallback(() => {
    if (gameState !== GAME_STATE_PLAYING) return
    const bottomRowIdx = ROWS - 1
    const targetCell = grid[bottomRowIdx][pointerCol]

    if (targetCell === CELL_EMPTY) return
    else if (targetCell === CELL_WHITE) {
      endGame()
      return
    } else {
      const newGrid = grid.map((row, rowIdx) =>
        rowIdx === bottomRowIdx
          ? row.map((cell, colIdx) => colIdx === pointerCol ? CELL_EMPTY : cell)
          : row
      )
      setGrid(newGrid)
      const newScore = score + 1
      setScore(newScore)
      setSpeed(calculateSpeed(newScore))
      playStep()
      if (newScore > highScore) setHighScore(newScore)
    }
  }, [gameState, grid, pointerCol, score, highScore, endGame, calculateSpeed, playStep, setHighScore])

  const moveLeft = useCallback(() => {
    if (gameState !== GAME_STATE_PLAYING) return
    setPointerCol(prev => Math.max(0, prev - 1))
  }, [gameState])

  const moveRight = useCallback(() => {
    if (gameState !== GAME_STATE_PLAYING) return
    setPointerCol(prev => Math.min(COLS - 1, prev + 1))
  }, [gameState])

  useEffect(() => {
    if (gameState !== GAME_STATE_PLAYING) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setGrid(prevGrid => {
        if (checkBottomRow(prevGrid)) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
          setTimeout(() => endGame(), 0)
          return prevGrid
        }
        return gridPushDown(prevGrid)
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
