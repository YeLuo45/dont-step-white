import React, { useEffect, useCallback, useRef, useState } from 'react'
import { Grid } from './Grid'
import { ScoreBoard } from './ScoreBoard'
import { Controls } from './Controls'
import { useStoryGame, STORY_CHAPTERS } from '../hooks/useStoryGame'
import { useAudio } from '../hooks/useAudio'
import { GAME_STATE_IDLE, GAME_STATE_PLAYING, GAME_STATE_PAUSED, GAME_STATE_GAME_OVER } from '../utils/constants'
import './StoryMode.css'

export function StoryMode({ onBack, onCoinsEarned }) {
  const {
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
  } = useStoryGame()

  const { playClick, playStepBlack, playStepWhite, playFail } = useAudio()

  const [view, setView] = useState('chapters') // 'chapters', 'levels', 'game'
  const [selectedChapter, setSelectedChapter] = useState(null)
  const [comboDisplay, setComboDisplay] = useState(0)
  const touchStartX = useRef(null)

  const isPlaying = gameState === GAME_STATE_PLAYING
  const isPaused = gameState === GAME_STATE_PAUSED
  const isGameOver = gameState === GAME_STATE_GAME_OVER
  const isIdle = gameState === GAME_STATE_IDLE

  // Show combo popup
  useEffect(() => {
    if (combo > 1) {
      setComboDisplay(combo)
      const timer = setTimeout(() => setComboDisplay(0), 300)
      return () => clearTimeout(timer)
    }
  }, [combo])

  // Notify parent of coins earned
  useEffect(() => {
    if (earnedCoins > 0 && levelComplete) {
      onCoinsEarned(earnedCoins)
    }
  }, [earnedCoins, levelComplete, onCoinsEarned])

  const handleSelectChapter = (chapter) => {
    playClick()
    if (isChapterUnlocked(chapter.id)) {
      setSelectedChapter(chapter)
      setView('levels')
    }
  }

  const handleSelectLevel = (levelNum) => {
    playClick()
    if (isLevelUnlocked(selectedChapter.id, levelNum)) {
      startLevel(selectedChapter.id, levelNum)
      setView('game')
    }
  }

  const handleBackFromLevels = () => {
    playClick()
    setSelectedChapter(null)
    setView('chapters')
  }

  const handleBackFromGame = () => {
    playClick()
    setView('levels')
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
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); startLevel(selectedChapter.id, currentLevel) }
      return
    }
    if (isGameOver) {
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); startLevel(selectedChapter.id, currentLevel) }
      return
    }
    if (isPaused) {
      if (e.code === 'KeyP') { e.preventDefault(); resumeGame() }
      return
    }
    switch (e.code) {
      case 'ArrowLeft': case 'KeyA': e.preventDefault(); moveLeft(); break
      case 'ArrowRight': case 'KeyD': e.preventDefault(); moveRight(); break
      case 'Space': case 'Enter': e.preventDefault(); stepOn(); break
      case 'KeyP': e.preventDefault(); pauseGame(); break
      default: break
    }
  }, [isIdle, isGameOver, isPaused, startLevel, resumeGame, moveLeft, moveRight, stepOn, pauseGame, selectedChapter, currentLevel])

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

  // Get chapter progress
  const getChapterProgress = (chapter) => {
    let completed = 0
    for (let i = 1; i <= chapter.levels; i++) {
      if (storyProgress.completedLevels[`${chapter.id}_${i}`]?.completed) {
        completed++
      }
    }
    return { completed, total: chapter.levels }
  }

  // Restart current level
  const handleRestart = () => {
    if (selectedChapter && currentLevel) {
      startLevel(selectedChapter.id, currentLevel)
    }
  }

  // Go to next level
  const handleNextLevel = () => {
    if (selectedChapter && currentLevel < selectedChapter.levels) {
      startLevel(selectedChapter.id, currentLevel + 1)
    } else {
      setView('levels')
    }
  }

  // Render chapter selection
  const renderChapterSelection = () => (
    <div className="chapter-selection">
      <div className="chapter-header">
        <h1>📖 剧情模式</h1>
        <p>选择章节开始你的冒险</p>
      </div>
      <div className="chapters-list">
        {STORY_CHAPTERS.map((chapter) => {
          const unlocked = isChapterUnlocked(chapter.id)
          const progress = getChapterProgress(chapter)
          return (
            <div
              key={chapter.id}
              className={`chapter-card ${unlocked ? 'unlocked' : 'locked'}`}
              onClick={() => handleSelectChapter(chapter)}
              style={{ borderColor: unlocked ? chapter.accentColor + '40' : 'transparent' }}
            >
              <div className="chapter-card-icon">{chapter.id === 'forest' ? '🌲' : chapter.id === 'city' ? '🌆' : '✨'}</div>
              <h3>{chapter.name}</h3>
              <p>{chapter.description}</p>
              {unlocked && (
                <div className="progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(progress.completed / progress.total) * 100}%`,
                        background: chapter.bgGradient.includes('1a3a1a') ? 'linear-gradient(90deg, #4ade80, #22c55e)' :
                                   chapter.bgGradient.includes('1a1a3a') ? 'linear-gradient(90deg, #f472b6, #ec4899)' :
                                   'linear-gradient(90deg, #a78bfa, #8b5cf6)'
                      }}
                    />
                  </div>
                  <span className="progress-text">{progress.completed}/{progress.total}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  // Render level selection
  const renderLevelSelection = () => {
    const chapter = selectedChapter
    if (!chapter) return null

    return (
      <div className="level-selection">
        <div className="level-header">
          <button className="back-btn" onClick={handleBackFromLevels}>←</button>
          <h2>{chapter.name}</h2>
        </div>
        <div className="levels-grid">
          {Array.from({ length: chapter.levels }, (_, i) => i + 1).map((levelNum) => {
            const levelInfo = getLevelInfo(chapter.id, levelNum)
            const unlocked = isLevelUnlocked(chapter.id, levelNum)
            const completed = levelInfo?.completed
            const stars = levelInfo?.stars || 0
            const isBoss = levelNum % 5 === 0

            return (
              <button
                key={levelNum}
                className={`level-btn ${!unlocked ? 'locked' : ''} ${completed ? 'completed' : ''} ${isBoss ? 'boss' : ''}`}
                onClick={() => handleSelectLevel(levelNum)}
                disabled={!unlocked}
              >
                {isBoss && <span className="boss-icon">👹</span>}
                <span className="level-num">{levelNum}</span>
                {completed && <span className="stars">{[1,2,3].map(s => s <= stars ? '⭐' : '☆').join('')}</span>}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Render game view
  const renderGame = () => {
    const chapter = selectedChapter
    if (!chapter) return null

    const isBoss = currentLevel % 5 === 0
    const passScore = getPassScore(currentLevel)

    return (
      <div className={`story-mode ${chapter.theme}`} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="game-play">
          <div className="game-top-bar">
            <div className="game-info">
              <span className="game-chapter-name">{chapter.name}</span>
              <span className="game-level-name">第 {currentLevel} 关{isBoss ? ' BOSS' : ''}</span>
            </div>
            <div className="game-stats">
              <div className="score-display">
                <span>{score}</span>
              </div>
              <div className="lives-display">
                <div className="lives-hearts">
                  {[0, 1, 2].map(i => (
                    <span key={i} className={`heart ${i < lives ? 'full' : 'empty'}`}>♥</span>
                  ))}
                </div>
              </div>
              <button className="pause-btn" onClick={pauseGame}>⏸</button>
            </div>
          </div>

          {/* Level start screen */}
          {isIdle && (
            <div className="level-start-screen">
              <h2>第 {currentLevel} 关</h2>
              <p className="level-subtitle">{chapter.name}</p>
              {isBoss && <p className="boss-warning">👹 BOSS关卡来袭！</p>}
              <p className="level-pass-score">目标分数: {passScore}</p>
              <button
                className={`level-start-btn ${isBoss ? 'boss' : ''}`}
                onClick={() => startLevel(chapter.id, currentLevel)}
              >
                开始挑战
              </button>
            </div>
          )}

          {/* Game grid */}
          {(isPlaying || isPaused) && (
            <>
              <Grid grid={grid} pointerCol={pointerCol} onCellClick={handleCellClick} />
              <Controls onLeft={moveLeft} onRight={moveRight} onStep={stepOn} onPause={isPaused ? resumeGame : pauseGame} isPaused={isPaused} />
            </>
          )}

          {/* Pause overlay */}
          {isPaused && (
            <div className="pause-overlay">
              <h2>⏸ 已暂停</h2>
              <div className="pause-buttons">
                <button className="pause-btn-item" onClick={resumeGame}>继续游戏</button>
                <button className="pause-btn-item" onClick={handleBackFromGame}>返回选关</button>
                <button className="pause-btn-item" onClick={onBack}>返回主菜单</button>
              </div>
            </div>
          )}

          {/* Level complete overlay */}
          {isGameOver && levelComplete && (
            <div className="level-complete-overlay">
              <h2>{chapterCleared ? '🎉 章节通关！' : '⭐ 关卡通过！'}</h2>
              {chapterCleared && <p className="chapter-complete">恭喜解锁下一章节！</p>}
              <div className="complete-stats">
                <div className="complete-stars">
                  {[1,2,3].map(s => s <= (storyProgress.completedLevels[`${chapter.id}_${currentLevel}`]?.stars || 1) ? '⭐' : '☆').join('')}
                </div>
                <div className="complete-score">得分: {score}</div>
                <div className="complete-coins">+{earnedCoins} 🪙</div>
              </div>
              <div className="complete-buttons">
                <button className="complete-btn" onClick={handleBackFromGame}>返回选关</button>
                <button className="complete-btn primary" onClick={handleNextLevel}>
                  {currentLevel < selectedChapter.levels ? '下一关' : '完成'}
                </button>
              </div>
            </div>
          )}

          {/* Game over overlay */}
          {isGameOver && !levelComplete && (
            <div className="game-over-overlay">
              <h2>💔 游戏结束</h2>
              <p className="game-over-score">得分: {score} / {passScore}</p>
              <div className="game-over-buttons">
                <button className="complete-btn" onClick={handleBackFromGame}>返回选关</button>
                <button className="complete-btn primary" onClick={handleRestart}>重新挑战</button>
              </div>
            </div>
          )}

          {/* Combo display */}
          {comboDisplay > 1 && (
            <div className="combo-display">连击 x{comboDisplay}</div>
          )}
        </div>
      </div>
    )
  }

  const chapter = selectedChapter

  return (
    <div className="story-mode" style={chapter ? { background: chapter.bgGradient } : {}}>
      <div className="story-content">
        {view === 'chapters' && renderChapterSelection()}
        {view === 'levels' && renderLevelSelection()}
        {view === 'game' && renderGame()}
      </div>
    </div>
  )
}
