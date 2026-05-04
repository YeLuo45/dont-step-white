import React from 'react'
import './ScoreBoard.css'

export function ScoreBoard({ score, combo }) {
  return (
    <div className="score-board">
      <div className="score-item">
        <span className="score-label">得分</span>
        <span className="score-value">{score}</span>
      </div>
      {combo > 1 && (
        <div className="combo-display">
          <span className="combo-value">×{combo}</span>
        </div>
      )}
    </div>
  )
}
