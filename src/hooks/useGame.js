import { useState, useEffect, useCallback, useRef } from 'react'
import { useStorage } from './useStorage'
import { useAudio } from './useAudio'
import {
  COLS, ROWS, INITIAL_SPEED, MIN_SPEED,
  SPEED_INCREASE_INTERVAL, SPEED_INCREASE_RATE,
  CELL_EMPTY, CELL_WHITE, CELL_BLACK,
  GAME_STATE_IDLE, GAME_STATE_PLAYING, GAME_STATE_PAUSED, GAME_STATE_GAME_OVER,
  INITIAL_LIVES, MAX_WHITE_BLOCKS_BASE, MAX_WHITE_BLOCKS_INCREMENT, MAX_WHITE_BLOCKS_INTERVAL,
  POWERUP_SHIELD, POWERUP_FREEZE, POWERUP_DOUBLE,
  POWERUP_DROP_CHANCE, POWERUP_FREEZE_DURATION, POWERUP_DOUBLE_COUNT,
  STORAGE_BEST,
  GAME_MODE_TIMED, STORAGE_BEST_TIMED, TIMED_INITIAL_TIME, TIMED_TIME_BONUS,
  TIMED_SPEED_TIER_1, TIMED_SPEED_TIER_2, TIMED_SPEED_TIER_3, TIMED_SPEED_TIER_4
} from '../utils/constants'

// V2: 根据分数计算每行最大白块数
function getMaxWhiteBlocks(score) {
  const level = Math.floor(score / MAX_WHITE_BLOCKS_INTERVAL)
  return Math.min(MAX_WHITE_BLOCKS_BASE + level * MAX_WHITE_BLOCKS_INCREMENT, COLS - 1)
}

// V2: 生成行 - 1个黑块 + N个白块 + 剩余空格
function generateRow(pointerCol, maxWhiteBlocks) {
  const availableCols = Array.from({ length: COLS }, (_, i) => i).filter(c => c !== pointerCol)
  // 随机选择maxWhiteBlocks个位置放白块
  const whiteIndices = []
  const remainingCols = [...availableCols]
  for (let i = 0; i < maxWhiteBlocks && remainingCols.length > 0; i++) {
    const randIdx = Math.floor(Math.random() * remainingCols.length)
    whiteIndices.push(remainingCols.splice(randIdx, 1)[0])
  }
  return Array(COLS).fill(null).map((_, colIdx) => {
    if (colIdx === whiteIndices[0]) return CELL_WHITE
    if (colIdx === availableCols[0]) return CELL_BLACK
    return CELL_EMPTY
  })
}

function createInitialGrid() {
  return Array(ROWS).fill(null).map(() =>
    Array(COLS).fill(CELL_EMPTY)
  )
}

// V2: 新行从顶部添加，网格向下掉落（视觉上是从上往下掉）
function gridPushDown(grid, pointerCol, maxWhiteBlocks) {
  return [generateRow(pointerCol, maxWhiteBlocks), ...grid.slice(0, -1)]
}

function checkBlackBlockInBottomRow(grid) {
  return grid[ROWS - 1].some(cell => cell === CELL_BLACK)
}

function checkFullWhiteRow(grid) {
  return grid[ROWS - 1].every(cell => cell === CELL_WHITE)
}

// V6: 计算限时模式速度档位
function getTimedSpeed(score) {
  if (score >= 50) return TIMED_SPEED_TIER_4 // 300ms
  if (score >= 30) return TIMED_SPEED_TIER_3 // 400ms
  if (score >= 15) return TIMED_SPEED_TIER_2 // 600ms
  return TIMED_SPEED_TIER_1 // 800ms
}

export function useGame(levelConfig = null) {
  const [grid, setGrid] = useState(() => createInitialGrid())
  const [pointerCol, setPointerCol] = useState(1)
  const [score, setScore] = useState(0)
  const [bestData, setBestData] = useStorage(STORAGE_BEST, { nickname: '', score: 0 })
  // V6: 限时模式专用
  const [timedBestData, setTimedBestData] = useStorage(STORAGE_BEST_TIMED, { nickname: '', score: 0 })
  const [gameState, setGameState] = useState(GAME_STATE_IDLE)
  const [speed, setSpeed] = useState(INITIAL_SPEED)
  const [lives, setLives] = useState(() => levelConfig?.lives || INITIAL_LIVES)
  const [combo, setCombo] = useState(0)
  const [currentPowerup, setCurrentPowerup] = useState(null)
  // V6: 限时模式状态
  const [timeLeft, setTimeLeft] = useState(TIMED_INITIAL_TIME)
  const [isTimedMode, setIsTimedMode] = useState(false)

  const { playStepBlack, playStepWhite, playPowerup: playPowerupSound, playFail } = useAudio()
  const intervalRef = useRef(null)
  const freezeTimerRef = useRef(null)
  const doubleCountRef = useRef(0)
  const timedTimerRef = useRef(null)

  // Refs to avoid stale closure
  const gameStateRef = useRef(gameState)
  const scoreRef = useRef(score)
  const gridRef = useRef(grid)
  const pointerColRef = useRef(pointerCol)
  const livesRef = useRef(lives)
  const comboRef = useRef(combo)
  const currentPowerupRef = useRef(currentPowerup)
  const doubleCountRef2 = useRef(0)
  const isFrozenRef = useRef(false)
  const levelConfigRef = useRef(levelConfig)
  const timeLeftRef = useRef(timeLeft)
  const isTimedModeRef = useRef(isTimedMode)

  // Sync refs
  gameStateRef.current = gameState
  scoreRef.current = score
  gridRef.current = grid
  pointerColRef.current = pointerCol
  livesRef.current = lives
  comboRef.current = combo
  currentPowerupRef.current = currentPowerup
  doubleCountRef.current = doubleCountRef2.current
  levelConfigRef.current = levelConfig
  timeLeftRef.current = timeLeft
  isTimedModeRef.current = isTimedMode

  const calculateSpeed = useCallback((currentScore) => {
    // V6: 限时模式使用固定档位速度
    if (isTimedModeRef.current) {
      return getTimedSpeed(currentScore)
    }
    const level = Math.floor(currentScore / SPEED_INCREASE_INTERVAL)
    const baseSpeed = INITIAL_SPEED * Math.pow(SPEED_INCREASE_RATE, level)
    const speedMultiplier = levelConfigRef.current?.speedMultiplier || 1
    const finalSpeed = baseSpeed * speedMultiplier
    return Math.max(finalSpeed, MIN_SPEED * speedMultiplier)
  }, [])

  // V2: 尝试掉落道具
  const tryDropPowerup = useCallback((currentScore) => {
    if (levelConfigRef.current?.noPowerups) return
    if (currentPowerupRef.current) return // 已有道具不掉落
    if (currentScore > 0 && currentScore % 10 === 0) {
      if (Math.random() < POWERUP_DROP_CHANCE) {
        const types = [POWERUP_SHIELD, POWERUP_FREEZE, POWERUP_DOUBLE]
        const type = types[Math.floor(Math.random() * types.length)]
        setCurrentPowerup(type)
      }
    }
  }, [])

  // V2: 使用道具
  const usePowerup = useCallback(() => {
    const powerup = currentPowerupRef.current
    if (!powerup || gameStateRef.current !== GAME_STATE_PLAYING) return

    if (powerup === POWERUP_SHIELD) {
      setCurrentPowerup(null)
    } else if (powerup === POWERUP_FREEZE) {
      isFrozenRef.current = true
      setCurrentPowerup(null)
      if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current)
      freezeTimerRef.current = setTimeout(() => {
        isFrozenRef.current = false
      }, POWERUP_FREEZE_DURATION)
    } else if (powerup === POWERUP_DOUBLE) {
      setCurrentPowerup(null)
      doubleCountRef2.current = POWERUP_DOUBLE_COUNT
    }
  }, [])

  const startGame = useCallback(() => {
    if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current)
    if (timedTimerRef.current) clearInterval(timedTimerRef.current)
    isFrozenRef.current = false
    doubleCountRef2.current = 0
    setIsTimedMode(false)
    setGrid(createInitialGrid())
    setPointerCol(1)
    setScore(0)
    setSpeed(INITIAL_SPEED * (levelConfigRef.current?.speedMultiplier || 1))
    setLives(levelConfigRef.current?.lives || INITIAL_LIVES)
    setCombo(0)
    setCurrentPowerup(null)
    setTimeLeft(TIMED_INITIAL_TIME)
    setGameState(GAME_STATE_PLAYING)
  }, [])

  // V6: 启动限时挑战模式
  const startTimedMode = useCallback(() => {
    if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current)
    if (timedTimerRef.current) clearInterval(timedTimerRef.current)
    isFrozenRef.current = false
    doubleCountRef2.current = 0
    setIsTimedMode(true)
    setGrid(createInitialGrid())
    setPointerCol(1)
    setScore(0)
    setSpeed(TIMED_SPEED_TIER_1) // 800ms
    setCombo(0)
    setCurrentPowerup(null)
    setTimeLeft(TIMED_INITIAL_TIME)
    setGameState(GAME_STATE_PLAYING)
  }, [])

  const pauseGame = useCallback(() => setGameState(GAME_STATE_PAUSED), [])
  const resumeGame = useCallback(() => setGameState(GAME_STATE_PLAYING), [])

  const loseLife = useCallback(() => {
    const newLives = livesRef.current - 1
    setLives(newLives)
    if (newLives <= 0) {
      setGameState(GAME_STATE_GAME_OVER)
      const currentScore = scoreRef.current
      const currentBest = bestDataRef.current
      if (currentScore > currentBest.score) {
        setBestData({ nickname: currentBest.nickname, score: currentScore })
      }
    }
  }, [setBestData])

  const bestDataRef = useRef(bestData)
  bestDataRef.current = bestData

  // V6: 限时模式结束游戏
  const endTimedGame = useCallback(() => {
    setGameState(GAME_STATE_GAME_OVER)
    const currentScore = scoreRef.current
    const currentBest = timedBestData.current
    if (currentScore > currentBest.score) {
      setTimedBestData({ nickname: currentBest.nickname, score: currentScore })
    }
    playFail()
  }, [setTimedBestData, playFail])

  // V6: 添加时间（踩黑块+3秒）
  const addTime = useCallback((seconds) => {
    setTimeLeft(prev => prev + seconds)
  }, [])

  // V6: 限时模式结束游戏
  const endGame = useCallback(() => {
    if (isTimedModeRef.current) {
      endTimedGame()
      return
    }
    setGameState(GAME_STATE_GAME_OVER)
    const currentScore = scoreRef.current
    const currentBest = bestDataRef.current
    if (currentScore > currentBest.score) {
      setBestData({ nickname: currentBest.nickname, score: currentScore })
    }
    playFail()
  }, [setBestData, playFail, endTimedGame])

  const forceLives = useCallback((newLives) => {
    setLives(newLives)
  }, [])

  const stepOn = useCallback(() => {
    if (gameStateRef.current !== GAME_STATE_PLAYING) return
    const bottomRowIdx = ROWS - 1
    const currentGrid = gridRef.current
    const currentPointerCol = pointerColRef.current
    const targetCell = currentGrid[bottomRowIdx][currentPointerCol]

    if (targetCell === CELL_EMPTY) return

    // V6: 限时模式踩白块立即结束
    if (targetCell === CELL_WHITE) {
      playStepWhite()
      if (isTimedModeRef.current) {
        endTimedGame()
        return
      }
      // V2: 踩白块 - 护盾则免疫，否则-1命
      if (currentPowerupRef.current === POWERUP_SHIELD) {
        playPowerupSound()
        setCurrentPowerup(null)
        // 清除白块但不减命
        const newGrid = currentGrid.map((row, rowIdx) =>
          rowIdx === bottomRowIdx
            ? row.map((cell, colIdx) => colIdx === currentPointerCol ? CELL_EMPTY : cell)
            : row
        )
        setGrid(newGrid)
      } else {
        // 扣除1条命，清除白块
        const newGrid = currentGrid.map((row, rowIdx) =>
          rowIdx === bottomRowIdx
            ? row.map((cell, colIdx) => colIdx === currentPointerCol ? CELL_EMPTY : cell)
            : row
        )
        setGrid(newGrid)
        setCombo(0)
        loseLife()
      }
      return
    }

    // 踩黑块
    playStepBlack()
    let earnedScore = 1
    let newCombo = comboRef.current + 1
    earnedScore = newCombo * 2

    // V6: 限时模式额外+3秒
    if (isTimedModeRef.current) {
      addTime(TIMED_TIME_BONUS)
    }

    // V2: 双倍得分道具
    if (doubleCountRef2.current > 0) {
      earnedScore *= 2
      doubleCountRef2.current--
    }

    const newGrid = currentGrid.map((row, rowIdx) =>
      rowIdx === bottomRowIdx
        ? row.map((cell, colIdx) => colIdx === currentPointerCol ? CELL_EMPTY : cell)
        : row
    )
    setGrid(newGrid)
    const newScore = scoreRef.current + earnedScore
    setScore(newScore)
    setCombo(newCombo)
    setSpeed(calculateSpeed(newScore))
    tryDropPowerup(newScore)
  }, [calculateSpeed, playStepBlack, playStepWhite, playPowerupSound, loseLife, tryDropPowerup, addTime, endTimedGame])

  const moveLeft = useCallback(() => {
    if (gameStateRef.current !== GAME_STATE_PLAYING) return
    setPointerCol(prev => Math.max(0, prev - 1))
  }, [])

  const moveRight = useCallback(() => {
    if (gameStateRef.current !== GAME_STATE_PLAYING) return
    setPointerCol(prev => Math.min(COLS - 1, prev + 1))
  }, [])

  // Keyboard handler for powerup (D key)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'KeyD' && gameStateRef.current === GAME_STATE_PLAYING) {
        if (currentPowerupRef.current && !isTimedModeRef.current) {
          e.preventDefault()
          usePowerup()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [usePowerup])

  // V6: 限时模式计时器
  useEffect(() => {
    if (!isTimedMode || gameState !== GAME_STATE_PLAYING) {
      if (timedTimerRef.current) {
        clearInterval(timedTimerRef.current)
        timedTimerRef.current = null
      }
      return
    }

    timedTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timedTimerRef.current)
          timedTimerRef.current = null
          endTimedGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timedTimerRef.current) {
        clearInterval(timedTimerRef.current)
        timedTimerRef.current = null
      }
    }
  }, [isTimedMode, gameState, endTimedGame])

  useEffect(() => {
    if (gameState !== GAME_STATE_PLAYING) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // V2: 冰冻期间不移动
    if (isFrozenRef.current) return

    intervalRef.current = setInterval(() => {
      setGrid(prevGrid => {
        const maxWhite = getMaxWhiteBlocks(scoreRef.current)
        const newGrid = gridPushDown(prevGrid, pointerColRef.current, maxWhite)

        // V6: 限时模式漏踩黑块直接结束
        if (isTimedModeRef.current) {
          if (checkBlackBlockInBottomRow(newGrid)) {
            endTimedGame()
            return newGrid
          }
        } else {
          // V2: 检查漏踩黑块
          if (checkBlackBlockInBottomRow(newGrid)) {
            // 黑块到达底部，玩家没踩，-1命且清空该行
            const clearedGrid = newGrid.map((row, rowIdx) =>
              rowIdx === ROWS - 1
                ? row.map(cell => cell === CELL_BLACK ? CELL_EMPTY : cell)
                : row
            )
            setCombo(0)
            loseLife()
            return clearedGrid
          }
        }

        // V2: 检查满行白块
        if (checkFullWhiteRow(newGrid)) {
          // 玩家必须在下一tick前清空至少一格，否则-1命
          // 这里不直接结束，只是让行继续存在
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
  }, [gameState, speed, loseLife, endTimedGame])

  // Cleanup freeze timer on unmount
  useEffect(() => {
    return () => {
      if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current)
      if (timedTimerRef.current) clearInterval(timedTimerRef.current)
    }
  }, [])

  return {
    grid, pointerCol, score, bestData, gameState,
    startGame, pauseGame, resumeGame, stepOn, moveLeft, moveRight,
    lives, combo, currentPowerup, usePowerup, endGame, forceLives,
    // V6: 限时模式导出
    timeLeft, isTimedMode, timedBestData, startTimedMode
  }
}