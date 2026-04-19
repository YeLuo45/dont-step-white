import React from 'react'
import './ScoreBoard.css'

export function ScoreBoard({ score, highScore }) {
  return (
    <div className="score-board">
      <div className="score-item">
        <span className="score-label">得分</span>
        <span className="score-value">{score}</span>
      </div>
      <div className="score-divider" />
      <div className="score-item">
        <span className="score-label">最高</span>
        <span className="score-value high">{highScore}</span>
      </div>
    </div>
  )
}
