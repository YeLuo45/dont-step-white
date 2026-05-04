import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Grid } from './Grid'
import { ScoreBoard } from './ScoreBoard'
import { Controls } from './Controls'
import { useGame } from '../hooks/useGame'
import { useAudio } from '../hooks/useAudio'
import {
  getTodayChallenge,
  getTodayScore,
  saveDailyScore,
  saveDailyLeaderboardEntry,
  getTodayLeaderboard,
  getDailyNickname,
  setDailyNickname,
  getRankForToday,
  getPreviousRankForToday,
  CHALLENGE_TYPES,
  REVIVE_COST_COINS
} from '../utils/dailyChallenges'
import { GAME_STATE_IDLE, GAME_STATE_PLAYING, GAME_STATE_PAUSED, GAME_STATE_GAME_OVER, ROWS } from '../utils/constants'
import './DailyChallenge.css'

export function DailyChallenge({ coins, onUpdateCoins, onBack }) {
  const [view, setView] = useState('info') // 'info' | 'playing' | 'gameover' | 'leaderboard' | 'history'
  const [nickname, setNickname] = useState(getDailyNickname() || '')
  const [nicknameInput, setNicknameInput] = useState('')
  const [showNicknameInput, setShowNicknameInput] = useState(false)
  const [todayChallenge, setTodayChallenge] = useState(null)
  const [todayScore, setTodayScore] = useState(null)
  const [lives, setLives] = useState(3)
  const [pendingRevive, setPendingRevive] = useState(false)
  const [reviveMode, setReviveMode] = useState(null) // null | 'coins' | 'ad'
  const [todayRank, setTodayRank] = useState(null)
  const [rankChange, setRankChange] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [history, setHistory] = useState([])
  const gameKeyRef = useRef(0)

  const { playStepBlack, playStepWhite, playFail, playPowerup: playPowerupSound } = useAudio()

  // Load today's challenge
  useEffect(() => {
    const challenge = getTodayChallenge()
    setTodayChallenge(challenge)
    
    const score = getTodayScore()
    setTodayScore(score)
    
    // Check if already played today
    if (score) {
      setLives(0) // No more plays today
    }
    
    // Load leaderboard
    setLeaderboard(getTodayLeaderboard())
  }, [])

  // Level config for useGame
  const getLevelConfig = useCallback(() => {
    if (!todayChallenge) return null
    return {
      customGridPattern: todayChallenge.customGridPattern,
      speedMultiplier: todayChallenge.speedMultiplier,
      noPowerups: todayChallenge.noPowerups,
      lives: 3,
      visibleRows: todayChallenge.visibleRows || ROWS
    }
  }, [todayChallenge])

  const levelConfig = getLevelConfig()

  const {
    grid, pointerCol, score, bestData, gameState,
    startGame, pauseGame, resumeGame, stepOn, moveLeft, moveRight,
    lives: gameLives, combo, currentPowerup, usePowerup, endGame, forceLives
  } = useGame(levelConfig)

  const isPlaying = gameState === GAME_STATE_PLAYING
  const isPaused = gameState === GAME_STATE_PAUSED
  const isGameOver = gameState === GAME_STATE_GAME_OVER
  const isIdle = gameState === GAME_STATE_IDLE

  // Handle start game
  const handleStartGame = useCallback(() => {
    if (!nickname && !getDailyNickname()) {
      setShowNicknameInput(true)
      return
    }
    
    // Reset lives for new game
    setLives(3)
    gameKeyRef.current += 1
    startGame()
    setView('playing')
  }, [nickname, startGame])

  // Handle continue after game over (if lives left)
  const handleContinueGame = useCallback(() => {
    gameKeyRef.current += 1
    startGame()
    setView('playing')
  }, [startGame])

  // Handle game over
  useEffect(() => {
    if (isGameOver && view === 'playing') {
      // Save score
      const saved = saveDailyScore(nickname || getDailyNickname(), score)
      setTodayScore(saved)
      
      // Save to leaderboard
      saveDailyLeaderboardEntry(nickname || getDailyNickname(), score, todayChallenge.date)
      
      // Calculate rank
      const rank = getRankForToday(nickname || getDailyNickname())
      const prevRank = getPreviousRankForToday(nickname || getDailyNickname(), score)
      
      setTodayRank(rank)
      setRankChange(prevRank ? prevRank - rank : null)
      
      // Reload leaderboard
      setLeaderboard(getTodayLeaderboard())
      
      // Update remaining lives
      setLives(0) // Used 1 life
      
      setView('gameover')
    }
  }, [isGameOver, view, score, nickname, todayChallenge])

  // Handle revive with coins
  const handleReviveWithCoins = useCallback(() => {
    if (coins >= REVIVE_COST_COINS) {
      onUpdateCoins(-REVIVE_COST_COINS) // Pass negative delta
      setLives(prev => prev > 0 ? prev : 1)
      setPendingRevive(false)
      setReviveMode(null)
      handleContinueGame()
    }
  }, [coins, onUpdateCoins, handleContinueGame])

  // Handle revive with ad (simulated)
  const handleReviveWithAd = useCallback(() => {
    // Simulate ad watching (in production, integrate actual ad SDK)
    setReviveMode('ad')
    setTimeout(() => {
      setLives(prev => prev > 0 ? prev : 1)
      setPendingRevive(false)
      setReviveMode(null)
      handleContinueGame()
    }, 1500)
  }, [handleContinueGame])

  // Handle nickname save
  const handleSaveNickname = useCallback(() => {
    if (nicknameInput.trim()) {
      setDailyNickname(nicknameInput.trim())
      setNickname(nicknameInput.trim())
      setShowNicknameInput(false)
    }
  }, [nicknameInput])

  // Touch handlers
  const touchStartX = useRef(null)
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(diff) > 30) diff < 0 ? moveLeft() : moveRight()
    touchStartX.current = null
  }

  const handleCellClick = useCallback((colIdx) => {
    if (colIdx !== pointerCol) {
      if (colIdx < pointerCol) moveLeft()
      else moveRight()
    }
    stepOn()
  }, [pointerCol, moveLeft, moveRight, stepOn])

  const handleKeyDown = useCallback((e) => {
    if (isIdle) {
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); handleStartGame() }
      return
    }
    if (isGameOver) {
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); handleContinueGame() }
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
  }, [isIdle, isGameOver, isPaused, handleStartGame, handleContinueGame, resumeGame, moveLeft, moveRight, stepOn, pauseGame, usePowerup])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Show challenge info view
  if (view === 'info' || showNicknameInput) {
    return (
      <div className="daily-challenge">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        
        <div className="challenge-header">
          <h2>📅 每日挑战</h2>
          {todayChallenge && (
            <div className="challenge-date">{todayChallenge.date}</div>
          )}
        </div>
        
        {todayChallenge && (
          <div className="challenge-card" style={{ borderColor: todayChallenge.color }}>
            <div className="challenge-type" style={{ color: todayChallenge.color }}>
              {todayChallenge.name}
            </div>
            <div className="challenge-desc">{todayChallenge.desc}</div>
            <div className="challenge-stats">
              <span>⚡ 速度: {todayChallenge.speedMultiplier < 1 ? '加快' : '正常'}</span>
              <span>👀 视野: {todayChallenge.visibleRows === ROWS ? '完整' : `底部${todayChallenge.visibleRows}行`}</span>
            </div>
          </div>
        )}
        
        {todayScore && (
          <div className="today-score-card">
            <div className="today-score-label">今日成绩</div>
            <div className="today-score-value">{todayScore.score}</div>
          </div>
        )}
        
        {showNicknameInput ? (
          <div className="nickname-input-section">
            <h3>设置昵称</h3>
            <p>首次参与需要设置昵称</p>
            <input
              type="text"
              className="nickname-input"
              placeholder="输入昵称"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              maxLength={12}
            />
            <button className="save-nickname-btn" onClick={handleSaveNickname}>保存并开始</button>
          </div>
        ) : (
          <>
            {lives > 0 || todayScore ? (
              <div className="play-section">
                {todayScore ? (
                  <p className="played-note">今日已挑战 ·明日再来</p>
                ) : (
                  <>
                    <button className="start-challenge-btn" onClick={handleStartGame}>
                      开始挑战
                    </button>
                    <p className="play-hint">
                      昵称: {nickname || getDailyNickname() || '未设置'}
                    </p>
                  </>
                )}
              </div>
            ) : null}
            
            <div className="challenge-tabs">
              <button 
                className={`tab-btn ${view === 'leaderboard' ? 'active' : ''}`}
                onClick={() => setView('leaderboard')}
              >
                今日排行
              </button>
              <button 
                className={`tab-btn ${view === 'history' ? 'active' : ''}`}
                onClick={() => setView('history')}
              >
                历史记录
              </button>
            </div>
            
            {view === 'leaderboard' && (
              <div className="leaderboard-section">
                <h3>🏆 今日排行</h3>
                {leaderboard.length === 0 ? (
                  <p className="empty-msg">暂无排行记录</p>
                ) : (
                  <div className="leaderboard-list">
                    {leaderboard.slice(0, 10).map((entry, idx) => (
                      <div key={idx} className={`leaderboard-item ${entry.nickname === (nickname || getDailyNickname()) ? 'me' : ''}`}>
                        <span className="rank">#{idx + 1}</span>
                        <span className="name">{entry.nickname}</span>
                        <span className="score">{entry.score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {view === 'history' && (
              <div className="history-section">
                <h3>📜 历史记录</h3>
                <p className="empty-msg">功能开发中</p>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // Game playing view
  if (view === 'playing') {
    return (
      <div className="daily-challenge game-mode" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="top-bar">
          <ScoreBoard score={score} combo={combo} />
          <div className="lives-display">
            {Array.from({ length: 3 }, (_, i) => (
              <span key={i} className={`heart ${i < lives ? 'heart-full' : 'heart-empty'}`}>♥</span>
            ))}
          </div>
        </div>
        
        {todayChallenge && (
          <div className="challenge-badge" style={{ backgroundColor: todayChallenge.color }}>
            {todayChallenge.name}
          </div>
        )}
        
        {isIdle && (
          <div className="start-screen">
            <h2>{todayChallenge?.name}</h2>
            <p>{todayChallenge?.desc}</p>
            <button className="start-btn" onClick={handleStartGame}>开始挑战</button>
          </div>
        )}
        
        {(isPlaying || isPaused) && (
          <>
            <Grid grid={grid} pointerCol={pointerCol} onCellClick={handleCellClick} />
            <Controls onLeft={moveLeft} onRight={moveRight} onStep={stepOn} onPause={isPaused ? resumeGame : pauseGame} isPaused={isPaused} />
            {isPaused && <div className="pause-overlay"><div className="pause-text">已暂停</div></div>}
          </>
        )}
        
        {isGameOver && view === 'playing' && (
          <div className="gameover-overlay">
            <div className="gameover-content">
              <h2>挑战结束</h2>
              <p>本局得分: <strong>{score}</strong></p>
              {pendingRevive ? (
                <div className="revive-options">
                  <p>选择复活方式:</p>
                  <button onClick={handleReviveWithCoins} disabled={coins < REVIVE_COST_COINS}>
                    🪙 金币复活 ({REVIVE_COST_COINS})
                  </button>
                  <button onClick={handleReviveWithAd}>
                    📺 看广告复活
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={() => {
                    setPendingRevive(true)
                    setReviveMode(null)
                  }}>
                    复活再战
                  </button>
                  <button onClick={() => setView('gameover')}>查看结果</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Game over view
  if (view === 'gameover') {
    const isNewRecord = todayScore && score >= todayScore.score
    
    return (
      <div className="daily-challenge gameover-view">
        <button className="back-btn" onClick={() => {
          setView('info')
          setPendingRevive(false)
        }}>← 返回</button>
        
        <div className="gameover-header">
          <h2>📅 每日挑战</h2>
          <div className="challenge-date">{todayChallenge?.date}</div>
        </div>
        
        <div className="gameover-content">
          <h3>挑战结束</h3>
          
          <div className="final-score">
            <div className="score-label">最终得分</div>
            <div className="score-value">{score}</div>
            {isNewRecord && <span className="new-record">新纪录!</span>}
          </div>
          
          {todayRank && (
            <div className="rank-info">
              <span>今日排名: #{todayRank}</span>
              {rankChange && rankChange > 0 && (
                <span className="rank-up">↑ {rankChange}</span>
              )}
            </div>
          )}
          
          <div className="gameover-actions">
            {pendingRevive ? (
              <div className="revive-options">
                <p>选择复活方式:</p>
                <button 
                  className="revive-btn coins" 
                  onClick={handleReviveWithCoins}
                  disabled={coins < REVIVE_COST_COINS || reviveMode === 'ad'}
                >
                  🪙 金币复活 ({REVIVE_COST_COINS})
                </button>
                <button 
                  className="revive-btn ad" 
                  onClick={handleReviveWithAd}
                  disabled={reviveMode === 'coins'}
                >
                  📺 看广告复活
                </button>
              </div>
            ) : (
              <>
                <button className="restart-btn" onClick={handleContinueGame}>
                  再战一局
                </button>
                <button className="home-btn" onClick={() => setView('info')}>
                  返回主页
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="leaderboard-section">
          <h3>🏆 今日排行</h3>
          {leaderboard.length === 0 ? (
            <p className="empty-msg">暂无排行记录</p>
          ) : (
            <div className="leaderboard-list">
              {leaderboard.slice(0, 10).map((entry, idx) => (
                <div key={idx} className={`leaderboard-item ${entry.nickname === (nickname || getDailyNickname()) ? 'me' : ''}`}>
                  <span className="rank">#{idx + 1}</span>
                  <span className="name">{entry.nickname}</span>
                  <span className="score">{entry.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
