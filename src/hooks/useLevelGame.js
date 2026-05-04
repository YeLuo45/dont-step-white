import { useState, useEffect, useCallback, useRef } from 'react'
import { useGame } from './useGame'
import { LEVELS } from '../utils/constants'

export function useLevelGame(levelId) {
  const level = LEVELS.find(l => l.id === levelId)
  const isEndless = levelId === 'endless'
  const isTime60 = levelId === 'time60'
  const isSpeed = levelId === 'speed'
  const isPure = levelId === 'pure'
  const isSurvival = levelId === 'survival'
  const isSlow = levelId === 'slow'

  // For time60 mode
  const [timeLeft, setTimeLeft] = useState(60)

  // Base game with modifiers
  const baseGame = useGame()

  // Apply level modifiers
  const getModifiedSpeed = useCallback((baseSpeed) => {
    if (isSpeed) return baseSpeed * 0.5 // speed x2 means half the interval
    if (isSlow) return baseSpeed * 2 // slow x0.5 means double the interval
    return baseSpeed
  }, [isSpeed, isSlow])

  // Survival mode: 1 life
  const getInitialLives = useCallback(() => {
    return isSurvival ? 1 : baseGame.lives
  }, [isSurvival])

  // Pure mode: no powerups
  const shouldDropPowerup = useCallback((score) => {
    if (isPure) return false
    return baseGame.tryDropPowerup && baseGame.tryDropPowerup(score)
  }, [isPure])

  // Start game with level-specific setup
  const startLevelGame = useCallback(() => {
    baseGame.startGame()
    if (isTime60) {
      setTimeLeft(60)
    }
  }, [baseGame, isTime60])

  // Handle time countdown for time60
  useEffect(() => {
    if (!isTime60 || baseGame.gameState !== 'playing') return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          baseGame.endGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isTime60, baseGame.gameState, baseGame.endGame])

  return {
    ...baseGame,
    startGame: startLevelGame,
    timeLeft: isTime60 ? timeLeft : null,
    isPure,
    isSurvival,
    isSpeed,
    isSlow,
    isEndless,
    isTime60
  }
}
