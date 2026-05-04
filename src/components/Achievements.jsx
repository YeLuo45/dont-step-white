import React, { useState, useCallback } from 'react'
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from '../utils/achievements'
import './Achievements.css'

export function Achievements({ unlockedMap, stats, titles, totalCoinsEarned, onBack }) {
  const [activeCategory, setActiveCategory] = useState('all')

  // 计算解锁进度
  const getProgress = () => {
    const total = ACHIEVEMENTS.length
    const unlocked = Object.values(unlockedMap).filter(Boolean).length
    return { unlocked, total, percentage: Math.floor((unlocked / total) * 100) }
  }

  // 获取当前分类的成就
  const getFilteredAchievements = () => {
    if (activeCategory === 'all') return ACHIEVEMENTS
    return ACHIEVEMENTS.filter(a => a.category === activeCategory)
  }

  // 获取成就进度百分比
  const getAchievementProgress = (achievement) => {
    if (unlockedMap[achievement.id]) return 100

    const { condition } = achievement

    switch (condition.type) {
      case 'combo':
        return Math.min(100, Math.floor((stats.maxCombo / condition.value) * 100))
      case 'score':
        return Math.min(100, Math.floor((stats.maxScore / condition.value) * 100))
      case 'games_played':
        return Math.min(100, Math.floor((stats.gamesPlayed / condition.value) * 100))
      case 'timed_games':
        return Math.min(100, Math.floor((stats.timedGames / condition.value) * 100))
      case 'timed_score':
        return Math.min(100, Math.floor((stats.maxTimedScore / condition.value) * 100))
      case 'levels_cleared':
        return Math.min(100, Math.floor((stats.levelsCleared / condition.value) * 100))
      case 'total_coins_earned':
        return Math.min(100, Math.floor((totalCoinsEarned / condition.value) * 100))
      case 'owned_skins':
        return Math.min(100, Math.floor((stats.ownedSkins.length / condition.value) * 100))
      case 'no_hit_game':
      case 'high_combo_no_death':
      case 'lucky_combo':
      case 'comeback':
      case 'speed_score':
        return 0
      default:
        return 0
    }
  }

  // 获取当前值显示
  const getCurrentValue = (achievement) => {
    if (unlockedMap[achievement.id]) return '已解锁'

    const { condition } = achievement

    switch (condition.type) {
      case 'combo': return `${stats.maxCombo}/${condition.value}`
      case 'score': return `${stats.maxScore}/${condition.value}`
      case 'games_played': return `${stats.gamesPlayed}/${condition.value}`
      case 'timed_games': return `${stats.timedGames}/${condition.value}`
      case 'timed_score': return `${stats.maxTimedScore}/${condition.value}`
      case 'levels_cleared': return `${stats.levelsCleared}/${condition.value}`
      case 'total_coins_earned': return `${totalCoinsEarned}/${condition.value}`
      case 'owned_skins': return `${stats.ownedSkins.length}/${condition.value}`
      default: return ''
    }
  }

  // 获取奖励显示
  const getRewardDisplay = (reward) => {
    const parts = []
    if (reward.coins > 0) parts.push(`🪙 ${reward.coins}`)
    if (reward.title) parts.push(`🏅 ${reward.title}`)
    if (reward.skin) parts.push(`👔 皮肤:${reward.skin}`)
    return parts.join(' ')
  }

  const progress = getProgress()

  return (
    <div className="achievements-container">
      {/* 头部 */}
      <div className="achievements-header">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <h2 className="achievements-title">🏆 成就</h2>
        <div className="achievements-coins">
          <span className="coins-icon">🪙</span>
          <span className="coins-value">{totalCoinsEarned}</span>
        </div>
      </div>

      {/* 总体进度 */}
      <div className="achievements-overview">
        <div className="overview-progress">
          <div className="progress-text">
            <span>总进度</span>
            <span>{progress.unlocked}/{progress.total} ({progress.percentage}%)</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress.percentage}%` }}></div>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{stats.maxScore}</span>
            <span className="stat-label">最高分</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.maxCombo}</span>
            <span className="stat-label">最高连击</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.gamesPlayed}</span>
            <span className="stat-label">游戏次数</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.maxTimedScore}</span>
            <span className="stat-label">限时最高</span>
          </div>
        </div>

        {/* 称号展示 */}
        {titles.length > 0 && (
          <div className="titles-showcase">
            <span className="titles-label">已获称号:</span>
            <div className="titles-list">
              {titles.map(t => (
                <span key={t} className="title-badge">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 分类 Tab */}
      <div className="category-tabs">
        {ACHIEVEMENT_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* 成就列表 */}
      <div className="achievements-list">
        {getFilteredAchievements().map(achievement => {
          const isUnlocked = unlockedMap[achievement.id]
          const progress = getAchievementProgress(achievement)
          const currentValue = getCurrentValue(achievement)

          return (
            <div
              key={achievement.id}
              className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-icon">
                {isUnlocked ? achievement.icon : '🔒'}
              </div>
              <div className="achievement-info">
                <div className="achievement-header">
                  <span className="achievement-name">{achievement.name}</span>
                  {achievement.tier && (
                    <span className={`tier-badge tier-${achievement.tier}`}>
                      {achievement.tier === 1 && '★'}
                      {achievement.tier === 2 && '★★'}
                      {achievement.tier === 3 && '★★★'}
                      {achievement.tier === 4 && '★★★★'}
                      {achievement.tier === 5 && '★★★★★'}
                    </span>
                  )}
                </div>
                <div className="achievement-desc">{achievement.desc}</div>
                <div className="achievement-progress">
                  <div className="achievement-progress-bar">
                    <div
                      className="achievement-progress-fill"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <span className="achievement-progress-text">
                    {currentValue}
                  </span>
                </div>
                {achievement.reward.coins > 0 && (
                  <div className="achievement-reward">
                    奖励: {getRewardDisplay(achievement.reward)}
                  </div>
                )}
              </div>
              {isUnlocked && <div className="achievement-check">✓</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
