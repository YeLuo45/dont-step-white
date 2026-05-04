import React, { useState, useCallback, useEffect } from 'react'
import { Grid } from './Grid'
import { useGame } from '../hooks/useGame'
import { useAudio } from '../hooks/useAudio'
import { CELL_EMPTY, CELL_WHITE, CELL_BLACK, COLS, ROWS } from '../utils/constants'
import './Editor.css'

const STORAGE_CUSTOM_LEVELS = 'dsw_v8_custom_levels'

// Cycle: EMPTY -> BLACK -> WHITE -> EMPTY
function cycleCellType(current) {
  if (current === CELL_EMPTY) return CELL_BLACK
  if (current === CELL_BLACK) return CELL_WHITE
  return CELL_EMPTY
}

// Encode grid to base64
function encodeGrid(grid) {
  const flat = grid.flat().join('')
  return btoa(flat)
}

// Decode base64 to grid
function decodeGrid(encoded) {
  try {
    const flat = atob(encoded)
    const grid = []
    for (let i = 0; i < ROWS; i++) {
      grid.push(flat.slice(i * COLS, (i + 1) * COLS).split('').map(Number))
    }
    return grid
  } catch {
    return null
  }
}

// Validate grid: must have at least 1 black block
function validateGrid(grid) {
  return grid.some(row => row.some(cell => cell === CELL_BLACK))
}

// Load custom levels from localStorage
function loadCustomLevels() {
  try {
    const data = localStorage.getItem(STORAGE_CUSTOM_LEVELS)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

// Save custom levels to localStorage
function saveCustomLevels(levels) {
  localStorage.setItem(STORAGE_CUSTOM_LEVELS, JSON.stringify(levels))
}

export function Editor({ onBack, onOpenCustomLevels, onPlayCustomLevel }) {
  const { playClick } = useAudio()
  const createEmptyGrid = () => Array(ROWS).fill(null).map(() => Array(COLS).fill(CELL_EMPTY))

  const [grid, setGrid] = useState(createEmptyGrid)
  const [levelName, setLevelName] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)

  // Preview mode uses useGame
  const previewGame = useGame({ noPowerups: true, lives: 1 })

  const handleEditorCellClick = useCallback((rowIdx, colIdx) => {
    if (isPreview) return
    playClick()
    setGrid(prev => {
      const newGrid = prev.map(row => [...row])
      newGrid[rowIdx][colIdx] = cycleCellType(newGrid[rowIdx][colIdx])
      return newGrid
    })
    setError('')
  }, [isPreview, playClick])

  const handleStartPreview = useCallback(() => {
    if (!validateGrid(grid)) {
      setError('布局无效：至少需要1个黑块')
      return
    }
    setError('')
    previewGame.startGame()
    setIsPreview(true)
  }, [grid, previewGame])

  const handleStopPreview = useCallback(() => {
    previewGame.endGame()
    setIsPreview(false)
  }, [previewGame])

  const handleSave = useCallback(() => {
    if (!validateGrid(grid)) {
      setError('布局无效：至少需要1个黑块')
      return
    }
    if (!levelName.trim()) {
      setError('请输入关卡名称')
      return
    }
    setError('')

    const levels = loadCustomLevels()
    const newLevel = {
      id: Date.now().toString(),
      name: levelName.trim(),
      grid: grid,
      createdAt: Date.now()
    }
    levels.push(newLevel)
    saveCustomLevels(levels)

    setLevelName('')
    setGrid(createEmptyGrid())
    setError('')
    alert('关卡已保存！')
  }, [grid, levelName])

  const handleShare = useCallback(() => {
    if (!validateGrid(grid)) {
      setError('布局无效：至少需要1个黑块')
      return
    }
    const encoded = encodeGrid(grid)
    const url = `${window.location.origin}${window.location.pathname}?level=${encoded}`
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }).catch(() => {
      setError('复制失败，请手动复制')
    })
  }, [grid])

  // Import from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const levelParam = params.get('level')
    if (levelParam) {
      const decoded = decodeGrid(levelParam)
      if (decoded && validateGrid(decoded)) {
        setGrid(decoded)
        setError('')
        window.history.replaceState({}, '', window.location.pathname)
      } else {
        setError('无效的关卡链接')
      }
    }
  }, [])

  const handleClear = useCallback(() => {
    playClick()
    setGrid(createEmptyGrid())
    setError('')
  }, [playClick])

  const handleImportPaste = useCallback((e) => {
    const text = e.clipboardData.getData('text')
    const match = text.match(/level=([A-Za-z0-9+/=]+)/)
    if (match) {
      const decoded = decodeGrid(match[1])
      if (decoded && validateGrid(decoded)) {
        setGrid(decoded)
        setError('')
      } else {
        setError('无效的关卡链接')
      }
    }
  }, [])

  // Preview mode
  if (isPreview) {
    return (
      <div className="editor editor-preview">
        <div className="editor-header">
          <button className="back-btn" onClick={handleStopPreview}>← 停止预览</button>
          <h2 className="editor-title">预览模式</h2>
          <div style={{ width: 60 }}></div>
        </div>

        <div className="editor-preview-grid">
          <Grid
            grid={previewGame.grid}
            pointerCol={previewGame.pointerCol}
            onCellClick={() => {}}
          />
        </div>

        <div className="editor-preview-info">
          <p>预览中... 点击停止退出</p>
          <p>分数: {previewGame.score}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="editor">
      <div className="editor-header">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <h2 className="editor-title">关卡编辑器</h2>
        <button className="custom-levels-btn" onClick={onOpenCustomLevels}>📋 我的关卡</button>
      </div>

      <div className="editor-content">
        <div className="editor-grid-container">
          <p className="editor-hint">点击格子切换：空 → 黑 → 白 → 空</p>
          <div className="editor-grid">
            {grid.map((row, rowIdx) => (
              <div key={rowIdx} className="grid-row">
                {row.map((cellType, colIdx) => {
                  let className = 'cell-editor'
                  if (cellType === CELL_WHITE) className += ' cell-editor-white'
                  else if (cellType === CELL_BLACK) className += ' cell-editor-black'
                  else className += ' cell-editor-empty'
                  if (rowIdx === ROWS - 1) className += ' cell-editor-pointer-row'
                  return (
                    <div
                      key={colIdx}
                      className={className}
                      onClick={() => handleEditorCellClick(rowIdx, colIdx)}
                    />
                  )
                })}
              </div>
            ))}
          </div>
          <p className="editor-grid-info">8行 × 4列 | 最底部为初始指针位置</p>
        </div>

        <div className="editor-controls">
          <input
            type="text"
            className="editor-name-input"
            placeholder="输入关卡名称..."
            value={levelName}
            onChange={e => setLevelName(e.target.value)}
            maxLength={20}
          />

          {error && <p className="editor-error">{error}</p>}

          <div className="editor-btn-group">
            <button className="editor-btn primary" onClick={handleSave}>💾 保存关卡</button>
            <button className="editor-btn" onClick={handleShare}>
              {copySuccess ? '✅ 已复制' : '🔗 分享链接'}
            </button>
          </div>

          <div className="editor-btn-group">
            <button className="editor-btn" onClick={handleStartPreview}>▶️ 预览游戏</button>
            <button className="editor-btn" onClick={handleClear}>🗑️ 清空</button>
          </div>
        </div>

        <div className="editor-import-section">
          <p className="editor-hint">或导入关卡链接：</p>
          <input
            type="text"
            className="editor-import-input"
            placeholder="粘贴关卡链接 (?level=xxx)..."
            onPaste={handleImportPaste}
          />
        </div>
      </div>
    </div>
  )
}

// Custom Levels List Page
export function CustomLevelsList({ onBack, onPlayLevel, onGoHome }) {
  const { playClick } = useAudio()
  const [levels, setLevels] = useState([])

  useEffect(() => {
    setLevels(loadCustomLevels())
  }, [])

  const handleDelete = useCallback((id, e) => {
    e.stopPropagation()
    playClick()
    if (confirm('确定要删除这个关卡吗？')) {
      const newLevels = levels.filter(l => l.id !== id)
      saveCustomLevels(newLevels)
      setLevels(newLevels)
    }
  }, [levels, playClick])

  const handlePlay = useCallback((level) => {
    playClick()
    onPlayLevel(level)
  }, [playClick, onPlayLevel])

  if (levels.length === 0) {
    return (
      <div className="custom-levels">
        <div className="editor-header">
          <button className="back-btn" onClick={onBack}>← 返回</button>
          <h2 className="editor-title">我的关卡</h2>
          <button className="custom-levels-btn" onClick={onGoHome}>🏠 首页</button>
        </div>
        <div className="custom-levels-empty">
          <p>暂无自定义关卡</p>
          <button className="editor-btn primary" onClick={onBack}>🎮 去创建</button>
        </div>
      </div>
    )
  }

  return (
    <div className="custom-levels">
      <div className="editor-header">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <h2 className="editor-title">我的关卡 ({levels.length})</h2>
        <button className="custom-levels-btn" onClick={onGoHome}>🏠 首页</button>
      </div>

      <div className="custom-levels-list">
        {levels.map(level => (
          <div
            key={level.id}
            className="custom-level-card"
            onClick={() => handlePlay(level)}
          >
            <div className="custom-level-info">
              <h3 className="custom-level-name">{level.name}</h3>
              <p className="custom-level-date">
                {new Date(level.createdAt).toLocaleDateString()}
              </p>
              <div className="custom-level-preview-mini">
                {level.grid.map((row, rowIdx) => (
                  <div key={rowIdx} className="preview-mini-row">
                    {row.map((cell, colIdx) => (
                      <div
                        key={colIdx}
                        className={`preview-mini-cell ${
                          cell === CELL_WHITE ? 'mini-white' :
                          cell === CELL_BLACK ? 'mini-black' : 'mini-empty'
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="custom-level-actions">
              <button
                className="custom-level-play-btn"
                onClick={(e) => handlePlay(level)}
              >
                ▶️ 游玩
              </button>
              <button
                className="custom-level-delete-btn"
                onClick={(e) => handleDelete(level.id, e)}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
