import React from 'react'
import './AchievementToast.css'

export function AchievementToast({ achievement, onDismiss }) {
  if (!achievement) return null

  const getRewardText = (reward) => {
    const parts = []
    if (reward.coins > 0) parts.push(`🪙 +${reward.coins}`)
    if (reward.title) parts.push(`🏅 ${reward.title}`)
    if (reward.skin) parts.push(`👔 皮肤`)
    return parts.join(' ')
  }

  return (
    <div className="achievement-toast" onClick={onDismiss}>
      <div className="toast-icon">{achievement.icon}</div>
      <div className="toast-content">
        <div className="toast-title">🏆 成就解锁</div>
        <div className="toast-name">{achievement.name}</div>
        <div className="toast-desc">{achievement.desc}</div>
        {achievement.reward && (achievement.reward.coins > 0 || achievement.reward.title || achievement.reward.skin) && (
          <div className="toast-reward">{getRewardText(achievement.reward)}</div>
        )}
      </div>
    </div>
  )
}

export function AchievementToastQueue({ queue, onDismiss }) {
  if (queue.length === 0) return null

  return (
    <div className="toast-queue">
      {queue.map((achievement, index) => (
        <AchievementToast
          key={achievement.id}
          achievement={achievement}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
}
