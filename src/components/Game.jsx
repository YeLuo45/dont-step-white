import React, { useEffect, useCallback, useRef } from 'react'
import { Grid } from './Grid'
import { ScoreBoard } from './ScoreBoard'
import { Controls } from './Controls'
import { GameOver } from './GameOver'
import { useGame } from '../hooks/useGame'
import { GAME_STATE_IDLE, GAME_STATE_PLAYING, GAME_STATE_PAUSED, GAME_STATE_GAME_OVER } from '../utils/constants'
import './Game.css'

export function Game() {
  const {
    grid, pointerCol, score, bestData, gameState,
    startGame, pauseGame, resumeGame, stepOn, moveLeft, moveRight,
    lives, combo, currentPowerup, usePowerup
  } = useGame()

  const isPlaying = gameState === GAME_STATE_PLAYING
  const isPaused = gameState === GAME_STATE_PAUSED
  const isGameOver = gameState === GAME_STATE_GAME_OVER
  const isIdle = gameState === GAME_STATE_IDLE

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
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); startGame() }
      return
    }
    if (isGameOver) {
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); startGame() }
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
  }, [isIdle, isGameOver, isPaused, startGame, resumeGame, moveLeft, moveRight, stepOn, pauseGame, usePowerup])

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

  return (
    <div className="game" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* V2: Top bar with score+combo on left, lives on right */}
      <div className="top-bar">
        <ScoreBoard score={score} combo={combo} />
        <div className="lives-display">
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} className={`heart ${i < lives ? 'heart-full' : 'heart-empty'}`}>♥</span>
          ))}
        </div>
      </div>

      {/* V2: Powerup display */}
      {currentPowerup && (
        <div className="powerup-display" onClick={usePowerup} title="点击使用道具 (D)">
          {getPowerupIcon(currentPowerup)}
        </div>
      )}

      {isIdle && (
        <div className="start-screen">
          <h1 className="game-title">别踩白块</h1>
          <p className="game-desc">黑块下落，点击踩下<br />踩到白块或漏踩黑块则失败</p>
          <button className="start-btn" onClick={startGame}>开始游戏</button>
          <div className="hint">
            <p>PC: ← → 移动 | 空格/点击 踩下 | D 使用道具</p>
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
          bestData={bestData}
          isNewHighScore={isNewHighScore}
          onRestart={startGame}
        />
      )}
    </div>
  )
}
