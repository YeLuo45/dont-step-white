import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useReplay } from '../hooks/useReplay'
import { COLS, ROWS, CELL_EMPTY, CELL_WHITE, CELL_BLACK } from '../utils/constants'
import './Replay.css'

// Generate initial grid deterministically from seed (replay id + index)
function generateGridAtIndex(seed, index) {
  // Simple deterministic random based on seed and step
  const random = (s) => {
    const x = Math.sin(s + index * 1000) * 10000
    return x - Math.floor(x)
  }
  
  const pointerCol = 1
  const availableCols = Array.from({ length: COLS }, (_, i) => i).filter(c => c !== pointerCol)
  
  // Determine max white blocks based on score proxy
  const maxWhiteBlocks = 1 + Math.floor(index / 8)
  
  const whiteIndices = []
  const remainingCols = [...availableCols]
  for (let i = 0; i < maxWhiteBlocks && remainingCols.length > 0; i++) {
    const randIdx = Math.floor(random(i * 7 + index) * remainingCols.length)
    whiteIndices.push(remainingCols.splice(randIdx, 1)[0])
  }
  
  return Array(COLS).fill(null).map((_, colIdx) => {
    if (colIdx === whiteIndices[0]) return CELL_WHITE
    if (colIdx === availableCols[0]) return CELL_BLACK
    return CELL_EMPTY
  })
}

// Generate full replay grid sequence based on actions
function generateReplayGridSequence(replay) {
  const { actions, id } = replay
  const sequence = []
  
  // Start with empty grid
  let grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(CELL_EMPTY))
  
  // Add initial black row at bottom
  grid[ROWS - 1][1] = CELL_BLACK
  
  sequence.push({ grid: grid.map(row => [...row]), action: null, time: 0 })
  
  let currentTime = 0
  let stepCount = 0
  
  // Process each action
  for (const { col, timestamp } of actions) {
    // Advance time
    currentTime = timestamp
    
    // Advance the grid one step (new row from top)
    const maxWhiteBlocks = 1 + Math.floor(stepCount / 8)
    const availableCols = Array.from({ length: COLS }, (_, i) => i).filter(c => c !== 1)
    
    // Generate new row
    const random = (s) => {
      const x = Math.sin(s + stepCount * 1000 + parseInt(id, 36)) * 10000
      return x - Math.floor(x)
    }
    
    const whiteIndices = []
    const remainingCols = [...availableCols]
    for (let i = 0; i < maxWhiteBlocks && remainingCols.length > 0; i++) {
      const randIdx = Math.floor(random(i * 7 + stepCount) * remainingCols.length)
      whiteIndices.push(remainingCols.splice(randIdx, 1)[0])
    }
    
    const newRow = Array(COLS).fill(CELL_EMPTY)
    if (whiteIndices[0] !== undefined) newRow[whiteIndices[0]] = CELL_WHITE
    newRow[availableCols[0]] = CELL_BLACK
    
    // Push down
    grid = [newRow, ...grid.slice(0, -1)]
    stepCount++
    
    // Record action at this step
    sequence.push({ grid: grid.map(row => [...row]), action: col, time: currentTime })
  }
  
  return sequence
}

export function Replay({ 
  mode = 'list',       // 'list' | 'playback' | 'save-dialog'
  replayId = null,     // ID of replay to play
  externalReplay = null, // Replay data from URL
  score = 0,
  gameMode = 'endless',
  onClose,
  onSave,
  onDiscard
}) {
  const {
    getReplays,
    getReplayById,
    deleteReplay,
    getShareUrl,
    loadReplayForPlayback,
    loadExternalReplay,
    isPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    startPlayback,
    pausePlayback,
    stopPlayback,
    stepPlayback,
    getPlaybackProgress,
    getCurrentIndex,
    isPlaybackComplete,
    getNextActionTimestamp,
    clearUrlReplay,
  } = useReplay()

  const [currentView, setCurrentView] = useState(mode) // 'list', 'playback', 'save'
  const [replay, setReplay] = useState(null)
  const [gridSequence, setGridSequence] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [currentGrid, setCurrentGrid] = useState(() => 
    Array(ROWS).fill(null).map(() => Array(COLS).fill(CELL_EMPTY))
  )
  const [pointerCol, setPointerCol] = useState(1)
  const [clickedCell, setClickedCell] = useState(null)
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  
  const playbackTimerRef = useRef(null)
  const lastStepTimeRef = useRef(0)

  // Load replay for playback
  useEffect(() => {
    if (mode === 'playback' && replayId) {
      const r = getReplayById(replayId)
      if (r) {
        setReplay(r)
        const seq = generateReplayGridSequence(r)
        setGridSequence(seq)
        setCurrentStep(0)
        setCurrentGrid(seq[0]?.grid || Array(ROWS).fill(null).map(() => Array(COLS).fill(CELL_EMPTY)))
        setPointerCol(1)
        setCurrentView('playback')
      }
    } else if (mode === 'playback' && externalReplay) {
      setReplay(externalReplay)
      const seq = generateReplayGridSequence(externalReplay)
      setGridSequence(seq)
      setCurrentStep(0)
      setCurrentGrid(seq[0]?.grid || Array(ROWS).fill(null).map(() => Array(COLS).fill(CELL_EMPTY)))
      setPointerCol(1)
      setCurrentView('playback')
    } else if (mode === 'save-dialog') {
      setCurrentView('save')
    } else {
      setCurrentView('list')
    }
  }, [mode, replayId, externalReplay])

  // Playback engine
  useEffect(() => {
    if (currentView !== 'playback' || !isPlaying || !replay) return

    const tick = () => {
      const now = performance.now()
      const elapsed = now - lastStepTimeRef.current
      
      // Get current action's time
      const nextTs = getNextActionTimestamp()
      if (nextTs === null) {
        pausePlayback()
        return
      }

      // Convert to real time based on speed
      const realInterval = 50 // tick every 50ms
      const gameTimeElapsed = (elapsed * playbackSpeed)
      
      const currentTs = gridSequence[currentStep]?.time || 0
      if (gameTimeElapsed >= nextTs - currentTs) {
        // Time to execute next action
        const action = stepPlayback()
        if (action) {
          setPointerCol(action.col)
          setClickedCell(action.col)
          setTimeout(() => setClickedCell(null), 200)
          setCurrentStep(prev => prev + 1)
          if (currentStep < gridSequence.length - 1) {
            setCurrentGrid(gridSequence[currentStep + 1]?.grid)
          }
        }
        
        if (isPlaybackComplete()) {
          pausePlayback()
          return
        }
        
        lastStepTimeRef.current = performance.now()
      }
      
      playbackTimerRef.current = setTimeout(tick, realInterval)
    }

    lastStepTimeRef.current = performance.now()
    tick()

    return () => {
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current)
      }
    }
  }, [currentView, isPlaying, replay, currentStep])

  // Restart playback from beginning
  const handleRestart = useCallback(() => {
    pausePlayback()
    setCurrentStep(0)
    setPointerCol(1)
    setCurrentGrid(gridSequence[0]?.grid || Array(ROWS).fill(null).map(() => Array(COLS).fill(CELL_EMPTY)))
    setClickedCell(null)
  }, [pausePlayback, gridSequence])

  // Toggle play/pause
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pausePlayback()
    } else {
      if (isPlaybackComplete()) {
        handleRestart()
      }
      startPlayback()
    }
  }, [isPlaying, pausePlayback, startPlayback, isPlaybackComplete, handleRestart])

  // Handle speed change
  const handleSpeedChange = useCallback((speed) => {
    setPlaybackSpeed(speed)
  }, [setPlaybackSpeed])

  // Handle progress bar click
  const handleProgressClick = useCallback((e) => {
    if (!replay || !gridSequence.length) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = x / rect.width
    const targetStep = Math.floor(percent * gridSequence.length)
    
    pausePlayback()
    setCurrentStep(targetStep)
    setPointerCol(1)
    setCurrentGrid(gridSequence[targetStep]?.grid || Array(ROWS).fill(null).map(() => Array(COLS).fill(CELL_EMPTY)))
  }, [replay, gridSequence, pausePlayback])

  // Handle share
  const handleShare = useCallback((id) => {
    const url = getShareUrl(id)
    if (url) {
      setShareUrl(url)
    }
  }, [getShareUrl])

  // Copy share URL
  const handleCopyUrl = useCallback(() => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [shareUrl])

  // Format time
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return minutes > 0 ? `${minutes}:${secs.toString().padStart(2, '0')}` : `${secs}s`
  }

  // Get progress percentage
  const progressPercent = replay && replay.duration > 0
    ? ((gridSequence[currentStep]?.time || 0) / replay.duration) * 100
    : 0

  // Handle save
  const handleSave = useCallback(() => {
    if (onSave) onSave()
    setCurrentView('list')
  }, [onSave])

  // Handle discard
  const handleDiscard = useCallback(() => {
    if (onDiscard) onDiscard()
    setCurrentView('list')
  }, [onDiscard])

  // Render list view
  if (currentView === 'list') {
    const allReplays = getReplays()
    
    return (
      <div className="replay-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
        <div className="replay-panel">
          <div className="replay-header">
            <h2 className="replay-title">📹 回放列表</h2>
            <button className="replay-close-btn" onClick={onClose}>✕</button>
          </div>
          
          {allReplays.length === 0 ? (
            <div className="replay-empty">
              <div className="replay-empty-icon">🎮</div>
              <p>暂无录像</p>
              <p style={{ fontSize: '12px', color: '#666' }}>游戏结束后可保存录像</p>
            </div>
          ) : (
            <div className="replay-list">
              {allReplays.map(r => (
                <div key={r.id} className="replay-item">
                  <div className="replay-item-info">
                    <div className="replay-item-score">🏆 {r.score}分</div>
                    <div className="replay-item-meta">
                      {r.mode === 'timed' ? '⏱️ 限时' : '🎮 普通'} · {formatTime(r.duration)} · {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="replay-item-actions">
                    <button 
                      className="replay-btn primary" 
                      onClick={() => {
                        setReplay(r)
                        const seq = generateReplayGridSequence(r)
                        setGridSequence(seq)
                        setCurrentStep(0)
                        setCurrentGrid(seq[0]?.grid)
                        setPointerCol(1)
                        setCurrentView('playback')
                      }}
                    >
                      ▶️
                    </button>
                    <button 
                      className="replay-btn" 
                      onClick={() => handleShare(r.id)}
                    >
                      📤
                    </button>
                    <button 
                      className="replay-btn danger" 
                      onClick={() => deleteReplay(r.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {shareUrl && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <input 
                type="text" 
                readOnly 
                value={shareUrl}
                style={{ 
                  width: '100%', 
                  background: '#2a2a4e', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '10px',
                  fontSize: '12px'
                }}
              />
              <button 
                className="replay-btn primary" 
                style={{ marginTop: '8px' }}
                onClick={handleCopyUrl}
              >
                {copied ? '✅ 已复制' : '📋 复制链接'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Render playback view
  if (currentView === 'playback' && replay) {
    return (
      <div className="replay-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
        <div className="replay-panel" style={{ maxWidth: '320px' }}>
          <div className="replay-header">
            <h2 className="replay-title">📹 回放中</h2>
            <button className="replay-close-btn" onClick={() => {
              stopPlayback()
              setCurrentView('list')
              onClose?.()
            }}>✕</button>
          </div>
          
          <div className="replay-playback">
            <div className="replay-playback-header">
              <div className="replay-playback-score">{replay.score}分</div>
              <div className="replay-playback-mode">
                {replay.mode === 'timed' ? '⏱️ 限时挑战' : '🎮 普通模式'}
              </div>
            </div>

            {/* Grid visualization */}
            <div className="replay-grid">
              {currentGrid.map((row, rowIdx) => (
                <div key={rowIdx} className="replay-row">
                  {row.map((cell, colIdx) => {
                    const isPointer = colIdx === pointerCol && rowIdx === ROWS - 1
                    const isClicked = colIdx === clickedCell && rowIdx === ROWS - 1
                    let cellClass = 'empty'
                    if (cell === CELL_WHITE) cellClass = 'white'
                    if (cell === CELL_BLACK) cellClass = 'black'
                    if (isPointer) cellClass += ' pointer'
                    if (isClicked) cellClass += ' clicked'
                    return (
                      <div key={colIdx} className={`replay-cell ${cellClass}`} />
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="replay-progress-container">
              <div className="replay-progress-bar" onClick={handleProgressClick}>
                <div 
                  className="replay-progress-fill" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="replay-time-display">
                <span>{formatTime(gridSequence[currentStep]?.time || 0)}</span>
                <span>{formatTime(replay.duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="replay-controls">
              <button className="replay-control-btn" onClick={handleRestart}>⏮️</button>
              <button 
                className={`replay-control-btn ${isPlaying ? 'active' : ''}`} 
                onClick={handlePlayPause}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              
              <div className="replay-speed-btns">
                {[1, 2, 4].map(speed => (
                  <button
                    key={speed}
                    className={`replay-speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                    onClick={() => handleSpeedChange(speed)}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render save dialog
  if (currentView === 'save') {
    return (
      <div className="replay-overlay">
        <div className="replay-save-dialog">
          <h2 className="replay-save-title">🏆 游戏结束</h2>
          <div className="replay-save-score">{score}分</div>
          <p className="replay-save-hint">是否保存本局录像？</p>
          <div className="replay-save-actions">
            <button className="replay-save-btn skip" onClick={handleDiscard}>
              Discard
            </button>
            <button className="replay-save-btn save" onClick={handleSave}>
              Save Replay
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// Export the grid sequence generator for external use
export { generateReplayGridSequence }
