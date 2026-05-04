import React, { useEffect, useCallback, useRef, useState } from 'react'
import { Grid } from './Grid'
import { ScoreBoard } from './ScoreBoard'
import { Controls } from './Controls'
import { GameOver } from './GameOver'
import { useGame } from '../hooks/useGame'
import { useAudio } from '../hooks/useAudio'
import { GAME_STATE_IDLE, GAME_STATE_PLAYING, GAME_STATE_PAUSED, GAME_STATE_GAME_OVER, LEVELS, INITIAL_LIVES } from '../utils/constants'
import './Game.css'

export function Game({ mode, levelId, onGameOver, onGoShop, onGoLevels, onHome, earnedCoins, soundEnabled, equippedSkin }) {
  // Landscape detection for portrait-only mode
  const [isLandscape, setIsLandscape] = useState(false)

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.matchMedia('(orientation: landscape)').matches)
    }
    checkOrientation()
    const mq = window.matchMedia('(orientation: landscape)')
    mq.addEventListener('change', checkOrientation)
    return () => mq.removeEventListener('change', checkOrientation)
  }, [])
  const level = mode === 'endless' || mode === 'timed' ? null : LEVELS.find(l => l.id === mode)

  // V6: Check if timed mode
  const isTimedMode = mode === 'timed'

  // Level-specific configurations
  const getLevelConfig = () => {
    if (isTimedMode) {
      return {
        timed: true,
        noPowerups: true // V6: 限时模式禁用道具
      }
    }
    if (!level) return null
    return {
      speedMultiplier: level.id === 'speed' ? 0.5 : level.id === 'slow' ? 2 : 1,
      lives: level.id === 'survival' ? 1 : INITIAL_LIVES,
      noPowerups: level.id === 'pure',
      timeLimit: level.id === 'time60' ? 60 : null,
      endless: level.id === 'endless'
    }
  }

  const levelConfig = getLevelConfig()

  const {
    grid, pointerCol, score, bestData, gameState,
    startGame, pauseGame, resumeGame, stepOn, moveLeft, moveRight,
    lives, combo, currentPowerup, usePowerup, endGame, forceLives,
    // V6: timed mode
    timeLeft, isTimedMode: hookIsTimedMode, timedBestData, startTimedMode
  } = useGame(levelConfig)

  const [localTimeLeft, setLocalTimeLeft] = useState(levelConfig?.timeLimit)
  const intervalRef = useRef(null)

  // V7: Audio hook for warning sounds
  const { playStepBlack, playStepWhite, playPowerup: playPowerupSound, playFail, playWarning } = useAudio()
  const lastWarningRef = useRef(null)

  const isPlaying = gameState === GAME_STATE_PLAYING
  const isPaused = gameState === GAME_STATE_PAUSED
  const isGameOver = gameState === GAME_STATE_GAME_OVER
  const isIdle = gameState === GAME_STATE_IDLE

  const isEndless = !level || level.id === 'endless'

  // Use hook's timeLeft for timed mode, localTimeLeft for level timeLimit
  const displayTimeLeft = isTimedMode ? timeLeft : localTimeLeft

  // Handle time60 timer (for level modes, not timed mode)
  useEffect(() => {
    if (!levelConfig?.timeLimit || !isPlaying || isTimedMode) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    setLocalTimeLeft(levelConfig.timeLimit)

    timerRef.current = setInterval(() => {
      setLocalTimeLeft(prev => {
        // V7: Warning sound at 10, 5, 4, 3, 2, 1 seconds
        if (prev <= 10 && prev > 1 && lastWarningRef.current !== prev) {
          lastWarningRef.current = prev
          playWarning()
        }
        if (prev <= 1) {
          clearInterval(timerRef.current)
          timerRef.current = null
          endGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [levelConfig?.timeLimit, isPlaying, startGame, isTimedMode])

  // Handle game over callback
  useEffect(() => {
    if (isGameOver) {
      onGameOver(score, isEndless)
    }
  }, [isGameOver, score, isEndless, onGameOver])

  // V7: Warning sound for timed mode countdown < 10s
  useEffect(() => {
    if (!isTimedMode || !isPlaying) return
    if (timeLeft <= 10 && timeLeft > 1 && lastWarningRef.current !== timeLeft) {
      lastWarningRef.current = timeLeft
      playWarning()
    }
  }, [timeLeft, isTimedMode, isPlaying, playWarning])

  const touchStartX = useRef(null)

  const handleCellClick = useCallback((colIdx) => {
    if (colIdx !== pointerCol) {
      if (colIdx < pointerCol) moveLeft()
      else moveRight()
    }
    stepOn()
  }, [pointerCol, moveLeft, moveRight, stepOn])

  const handleKeyDown = useCallback((e) => {
    if (isIdle) {
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); isTimedMode ? startTimedMode() : startGame() }
      return
    }
    if (isGameOver) {
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); isTimedMode ? startTimedMode() : startGame() }
      return
    }
    if (isPaused) {
      if (e.code === 'KeyP') { e.preventDefault(); resumeGame() }
      return
    }
    switch (e.code) {
      case 'ArrowLeft': case 'KeyA': e.preventDefault(); moveLeft(); break
      case 'ArrowRight': e.preventDefault(); moveRight(); break
      case 'Space': case 'Enter': e.preventDefault(); stepOn(); break
      case 'KeyP': e.preventDefault(); pauseGame(); break
      case 'KeyD': e.preventDefault(); usePowerup(); break
      default: break
    }
  }, [isIdle, isGameOver, isPaused, startGame, startTimedMode, isTimedMode, resumeGame, moveLeft, moveRight, stepOn, pauseGame, usePowerup])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(diff) > 30) diff < 0 ? moveLeft() : moveRight()
    touchStartX.current = null
  }

  // V2: Powerup icons
  const getPowerupIcon = (type) => {
    switch (type) {
      case 'shield': return '🛡️'
      case 'freeze': return '❄️'
      case 'double': return '✖️2'
      default: return null
    }
  }

  const isNewHighScore = score > 0 && score >= bestData.score
  // V6: timed mode high score
  const isNewTimedHighScore = isTimedMode && score > 0 && score >= (timedBestData?.score || 0)

  // Restart handler - restart game
  const handleRestart = () => {
    if (isTimedMode) {
      startTimedMode()
    } else {
      startGame()
    }
  }

  // V6: Get current speed tier label
  const getSpeedTierLabel = (spd) => {
    if (spd <= 300) return 'MAX'
    if (spd <= 400) return '4档'
    if (spd <= 600) return '3档'
    if (spd <= 800) return '2档'
    return '1档'
  }

  return (
    <>
      {isLandscape && (
        <div className="landscape-overlay">
          <div className="landscape-message">
            <div className="rotate-icon">📱</div>
            <p>请旋转设备至竖屏</p>
            <p className="rotate-hint">本游戏仅支持竖屏模式</p>
          </div>
        </div>
      )}
      <div className="game" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* V2: Top bar with score+combo on left, lives on right */}
      <div className="top-bar">
        <ScoreBoard score={score} combo={combo} />
        {isEndless && !isTimedMode && (
          <div className="lives-display">
            {Array.from({ length: 3 }, (_, i) => (
              <span key={i} className={`heart ${i < lives ? 'heart-full' : 'heart-empty'}`}>♥</span>
            ))}
          </div>
        )}
        {level?.id === 'survival' && (
          <div className="lives-display">
            <span className={`heart ${lives > 0 ? 'heart-full' : 'heart-empty'}`}>♥</span>
          </div>
        )}
        {(levelConfig?.timeLimit || isTimedMode) && (
          <div className={`timer-display ${isTimedMode ? 'timed-mode' : ''}`}>
            <span className="timer-value">{displayTimeLeft}s</span>
            {isTimedMode && <span className="speed-tier">{getSpeedTierLabel(speed)}</span>}
          </div>
        )}
      </div>

      {/* V2: Powerup display - hide in pure mode and timed mode */}
      {currentPowerup && !levelConfig?.noPowerups && !isTimedMode && (
        <div className="powerup-display" onClick={usePowerup} title="点击使用道具 (D)">
          {getPowerupIcon(currentPowerup)}
        </div>
      )}

      {/* Level info badge / V6 timed badge */}
      {level && (
        <div className="level-badge">
          {level.name}
        </div>
      )}
      {isTimedMode && (
        <div className="level-badge timed-badge">
          限时挑战
        </div>
      )}

      {isIdle && (
        <div className="start-screen">
          <h1 className="game-title">别踩白块</h1>
          {level && (
            <p className="level-rule-badge">{level.rule}</p>
          )}
          {isTimedMode && (
            <p className="level-rule-badge">60秒 · 踩黑块+3秒 · 踩白块结束</p>
          )}
          <p className="game-desc">黑块下落，点击踩下<br />踩到白块或漏踩黑块则失败</p>
          <button className="start-btn" onClick={isTimedMode ? startTimedMode : startGame}>开始游戏</button>
          <div className="hint">
            <p>PC: ← → 移动 | 空格/点击 踩下</p>
            <p>移动: 左右滑动 | 点击 踩下</p>
          </div>
        </div>
      )}

      {(isPlaying || isPaused) && (
        <>
          <Grid grid={grid} pointerCol={pointerCol} onCellClick={handleCellClick} />
          <Controls onLeft={moveLeft} onRight={moveRight} onStep={stepOn} onPause={isPaused ? resumeGame : pauseGame} isPaused={isPaused} />
          {isPaused && <div className="pause-overlay"><div className="pause-text">已暂停</div></div>}
        </>
      )}

      {isGameOver && (
        <GameOver
          score={score}
          bestData={isTimedMode ? timedBestData : bestData}
          isNewHighScore={isTimedMode ? isNewTimedHighScore : isNewHighScore}
          onRestart={handleRestart}
          earnedCoins={earnedCoins}
          levelId={levelId}
          onGoShop={onGoShop}
          onGoLevels={onGoLevels}
          equippedSkin={equippedSkin}
          isTimedMode={isTimedMode}
        />
      )}
    </div>
    </>
  )
}
