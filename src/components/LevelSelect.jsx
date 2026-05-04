import React from 'react'
import { LEVELS } from '../utils/constants'
import './LevelSelect.css'

export function LevelSelect({ progress, onSelectLevel, onBack }) {
  const isUnlocked = (levelId) => progress.unlockedLevels.includes(levelId)

  const getStars = (levelId) => {
    return progress.bestStars[levelId] || 0
  }

  const renderStars = (count) => {
    return '⭐'.repeat(count) + '☆'.repeat(3 - count)
  }

  return (
    <div className="level-select">
      <div className="level-header">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <h2 className="level-title">关卡挑战</h2>
        <div style={{ width: 60 }}></div>
      </div>
      <div className="level-grid">
        {LEVELS.map((level) => {
          const unlocked = isUnlocked(level.id)
          const stars = getStars(level.id)
          return (
            <div
              key={level.id}
              className={`level-card ${!unlocked ? 'locked' : ''}`}
              onClick={() => unlocked && onSelectLevel(level.id)}
            >
              <div className="level-info">
                <h3 className="level-name">{level.name}</h3>
                <p className="level-rule">{level.rule}</p>
                {level.passScore !== null && (
                  <p className="level-pass">通关: ≥{level.passScore}分</p>
                )}
                {level.passScore === null && (
                  <p className="level-pass">无通关条件</p>
                )}
              </div>
              <div className="level-status">
                {unlocked ? (
                  <>
                    <div className="level-stars">{renderStars(stars)}</div>
                    {stars > 0 && (
                      <p className="level-best">最高: {progress.bestScores[level.id] || 0}分</p>
                    )}
                  </>
                ) : (
                  <span className="level-lock">🔒</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
