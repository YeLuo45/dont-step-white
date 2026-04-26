import React from 'react'
import './GameOver.css'

export function GameOver({ score, highScore, isNewHighScore, onRestart }) {
  return (
    <div className="game-over-overlay">
      <div className="game-over-modal">
        <h2 className="game-over-title">游戏结束</h2>
        {isNewHighScore && <div className="new-high-score">新纪录！</div>}
        <div className="game-over-scores">
          <div className="score-row">
            <span className="score-name">本局得分</span>
            <span className="score-num">{score}</span>
          </div>
          <div className="score-row">
            <span className="score-name">最高纪录</span>
            <span className="score-num best">{highScore}</span>
          </div>
        </div>
        <button className="restart-btn" onClick={onRestart}>再来一局</button>
      </div>
    </div>
  )
}
