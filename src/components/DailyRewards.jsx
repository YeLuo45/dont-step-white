import React, { useState, useEffect, useCallback } from 'react'
import { useDailyTasks } from '../hooks/useDailyTasks'
import { SharePoster } from './SharePoster'
import './DailyRewards.css'

// 签到日历日期配置
const CALENDAR_DAYS = ['一', '二', '三', '四', '五', '六', '日']

export function DailyRewards({ coins, onUpdateCoins, onBack }) {
  const [activeTab, setActiveTab] = useState('sign') // 'sign' | 'tasks'
  const [claimingTask, setClaimingTask] = useState(null) // 正在领取的任务ID
  const [rewardAnimation, setRewardAnimation] = useState(null) // 显示奖励动画
  const [showPoster, setShowPoster] = useState(false)

  const {
    signInfo,
    hasSignedToday,
    signIn,
    getEffectiveStreak,
    getCurrentDayReward,
    isDateSigned,
    signRewards,
    getAllTasks,
    claimTaskReward,
    isTaskCompleted,
    isTaskClaimed,
    getTaskProgress
  } = useDailyTasks()

  // 今日日期显示
  const today = new Date()
  const dateStr = `${today.getUTCMonth() + 1}月${today.getUTCDate()}日 UTC`

  // 领取签到奖励
  const handleSignIn = useCallback(() => {
    if (hasSignedToday) return

    const reward = getCurrentDayReward()
    signIn()

    // 显示奖励动画
    if (reward > 0) {
      setRewardAnimation({ type: 'sign', amount: reward })
      onUpdateCoins(reward)
      setTimeout(() => setRewardAnimation(null), 1500)
    }
  }, [hasSignedToday, getCurrentDayReward, signIn, onUpdateCoins])

  // 领取任务奖励
  const handleClaimTask = useCallback((taskId) => {
    const reward = claimTaskReward(taskId)
    if (reward > 0) {
      setClaimingTask(taskId)
      setRewardAnimation({ type: 'task', amount: reward, taskId })

      setTimeout(() => {
        onUpdateCoins(reward)
        setClaimingTask(null)
        setRewardAnimation(null)
      }, 800)
    }
  }, [claimTaskReward, onUpdateCoins])

  // 获取签到日历数据（前7天）
  const getSignCalendar = useCallback(() => {
    const today = new Date()
    const days = []

    // 获取前6天 + 今天
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setUTCDate(date.getUTCDate() - i)
      const dateStr = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
      const dayName = CALENDAR_DAYS[date.getUTCDay() === 0 ? 6 : date.getUTCDay() - 1]
      const isSigned = isDateSigned(dateStr)
      const isToday = i === 0

      // 计算这是第几天签到（连续签到周期）
      const effectiveStreak = getEffectiveStreak()
      const dayIndex = 6 - i // 0-6

      days.push({
        dateStr,
        dayName: isToday ? '今天' : `周${dayName}`,
        isSigned,
        isToday,
        reward: signRewards[Math.min(effectiveStreak - 1 + dayIndex, 6)] || signRewards[6],
        dayIndex
      })
    }

    return days
  }, [isDateSigned, getEffectiveStreak, signRewards])

  const tasks = getAllTasks()
  const calendar = getSignCalendar()
  const currentStreak = getEffectiveStreak()
  const pendingReward = getCurrentDayReward()

  return (
    <div className="daily-rewards">
      <div className="dr-header">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <h2 className="dr-title">🎁 每日奖励</h2>
        <div className="dr-date">{dateStr}</div>
        <button className="share-poster-btn" onClick={() => setShowPoster(true)}>🖼️ 分享</button>
      </div>

      {/* Tab切换 */}
      <div className="dr-tabs">
        <button
          className={`dr-tab ${activeTab === 'sign' ? 'active' : ''}`}
          onClick={() => setActiveTab('sign')}
        >
          📅 每日签到
        </button>
        <button
          className={`dr-tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          📋 每日任务
        </button>
      </div>

      {/* 签到页面 */}
      {activeTab === 'sign' && (
        <div className="dr-sign-section">
          {/* 签到状态卡片 */}
          <div className="dr-sign-card">
            <div className="dr-streak-info">
              <span className="dr-streak-label">连续签到</span>
              <span className="dr-streak-value">{currentStreak} 天</span>
            </div>
            <div className="dr-today-reward">
              <span className="dr-reward-label">今日奖励</span>
              <span className="dr-reward-value">🪙 {pendingReward}</span>
            </div>
          </div>

          {/* 签到按钮 */}
          <button
            className={`dr-sign-btn ${hasSignedToday ? 'signed' : ''}`}
            onClick={handleSignIn}
            disabled={hasSignedToday}
          >
            {hasSignedToday ? '✅ 今日已签到' : `🎁 立即签到 (+🪙${pendingReward})`}
          </button>

          {/* 签到日历 */}
          <div className="dr-calendar">
            <h3 className="dr-calendar-title">签到日历</h3>
            <div className="dr-calendar-grid">
              {calendar.map((day, idx) => (
                <div
                  key={day.dateStr}
                  className={`dr-calendar-day ${day.isSigned ? 'signed' : ''} ${day.isToday ? 'today' : ''}`}
                >
                  <div className="dr-day-name">{day.dayName}</div>
                  <div className="dr-day-circle">
                    {day.isSigned ? '✓' : `${idx + 1}`}
                  </div>
                  <div className="dr-day-reward">🪙{day.reward}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 签到奖励说明 */}
          <div className="dr-reward-table">
            <h3 className="dr-table-title">签到奖励</h3>
            <div className="dr-table-grid">
              {signRewards.map((reward, idx) => (
                <div key={idx} className={`dr-table-item ${currentStreak > idx ? 'achieved' : ''}`}>
                  <span className="dr-table-day">第{idx + 1}天</span>
                  <span className="dr-table-reward">🪙 {reward}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 任务页面 */}
      {activeTab === 'tasks' && (
        <div className="dr-tasks-section">
          <div className="dr-tasks-list">
            {tasks.map((task) => {
              const progress = getTaskProgress(task.id)
              const completed = isTaskCompleted(task.id)
              const claimed = isTaskClaimed(task.id)
              const percent = Math.min(100, Math.floor((progress / task.target) * 100))

              return (
                <div
                  key={task.id}
                  className={`dr-task-card ${completed ? 'completed' : ''} ${claimed ? 'claimed' : ''}`}
                >
                  <div className="dr-task-icon">{task.reward}</div>
                  <div className="dr-task-info">
                    <div className="dr-task-header">
                      <span className="dr-task-name">{task.name}</span>
                      <span className="dr-task-reward">🪙 {task.reward}</span>
                    </div>
                    <div className="dr-task-desc">{task.desc}</div>
                    <div className="dr-task-progress">
                      <div className="dr-progress-bar">
                        <div
                          className="dr-progress-fill"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="dr-progress-text">{progress}/{task.target}</span>
                    </div>
                  </div>
                  <button
                    className={`dr-claim-btn ${completed && !claimed ? 'available' : ''} ${claimingTask === task.id ? 'claiming' : ''}`}
                    onClick={() => handleClaimTask(task.id)}
                    disabled={!completed || claimed || claimingTask === task.id}
                  >
                    {claimed ? '✓' : claimingTask === task.id ? '...' : '领'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 奖励动画 */}
      {rewardAnimation && (
        <div className="dr-reward-animation">
          <div className="dr-reward-popup">
            <div className="dr-reward-icon">🪙</div>
            <div className="dr-reward-amount">+{rewardAnimation.amount}</div>
          </div>
        </div>
      )}

      {showPoster && (
        <SharePoster
          nickname="玩家"
          score={coins}
          bestScore={coins}
          skinId="classic"
          mode="daily"
          titles={[]}
          achievementsUnlocked={[]}
          onClose={() => setShowPoster(false)}
        />
      )}
    </div>
  )
}