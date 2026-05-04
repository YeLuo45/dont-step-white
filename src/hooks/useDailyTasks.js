import { useState, useEffect, useCallback } from 'react'
import { useStorage } from './useStorage'

// V14: 每日签到和任务系统

// localStorage keys
const STORAGE_DAILY_TASKS = 'dsw_v14_daily_tasks'
const STORAGE_SIGN_INFO = 'dsw_v14_sign_info'

// 签到奖励配置：第1-7天
const SIGN_REWARDS = [10, 20, 30, 40, 50, 75, 100]

// 每日任务配置
const DAILY_TASKS_CONFIG = [
  { id: 'play_game', name: '游戏达人', desc: '完成3局游戏', target: 3, reward: 20, type: 'games_played' },
  { id: 'combo_10', name: '连击达人', desc: '达成10连击', target: 10, reward: 15, type: 'max_combo' },
  { id: 'score_50', name: '得分高手', desc: '单局得分达到50', target: 50, reward: 25, type: 'score' },
  { id: 'challenge', name: '挑战者', desc: '完成每日挑战', target: 1, reward: 30, type: 'daily_challenge' },
  { id: 'story', name: '剧情探索', desc: '完成一关剧情', target: 1, reward: 20, type: 'story_complete' },
  { id: 'share', name: '分享达人', desc: '分享你的战绩', target: 1, reward: 10, type: 'share' },
  { id: 'timed_mode', name: '限时英雄', desc: '限时模式获得30分', target: 30, reward: 25, type: 'timed_score' },
]

// 获取UTC日期字符串 (YYYY-MM-DD)
const getUTCDateStr = () => {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
}

// 获取昨天UTC日期字符串
const getYesterdayUTCStr = () => {
  const yesterday = new Date()
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  return `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterday.getUTCDate()).padStart(2, '0')}`
}

// 初始化签到数据
const initialSignInfo = () => ({
  lastSignDate: null,      // 上次签到日期 (UTC)
  currentStreak: 0,        // 当前连续签到天数
  totalSignDays: 0,        // 累计签到天数
  signedDates: [],         // 签到过的日期列表
  lastClaimDate: null,     // 上次领取奖励日期
})

// 初始化任务数据
const initialTaskData = () => ({
  date: null,              // 任务日期 (UTC)
  tasks: {},               // 各任务进度 { taskId: progress }
  claimedTasks: [],        // 已领取奖励的任务ID
})

export function useDailyTasks() {
  const [signInfo, setSignInfo] = useStorage(STORAGE_SIGN_INFO, initialSignInfo())
  const [taskData, setTaskData] = useStorage(STORAGE_DAILY_TASKS, initialTaskData())

  const today = getUTCDateStr()
  const yesterday = getYesterdayUTCStr()

  // 检查是否需要重置（日期变更）
  useEffect(() => {
    // 检查签到数据
    if (signInfo.lastSignDate && signInfo.lastSignDate !== today && signInfo.lastSignDate !== yesterday) {
      // 断签：超过1天未签到，重置连续天数
      setSignInfo(prev => ({
        ...prev,
        currentStreak: 0
      }))
    }

    // 检查任务数据
    if (taskData.date !== today) {
      // 重置任务进度
      setTaskData({
        date: today,
        tasks: {},
        claimedTasks: []
      })
    }
  }, [today, yesterday, signInfo.lastSignDate, taskData.date, setSignInfo, setTaskData])

  // 签到
  const signIn = useCallback(() => {
    const today = getUTCDateStr()
    const yesterday = getYesterdayUTCStr()

    setSignInfo(prev => {
      // 今天已经签到
      if (prev.lastSignDate === today) {
        return prev
      }

      let newStreak = 1
      // 如果昨天签到了，连续天数+1
      if (prev.lastSignDate === yesterday) {
        newStreak = prev.currentStreak + 1
      }

      return {
        ...prev,
        lastSignDate: today,
        currentStreak: newStreak,
        totalSignDays: prev.totalSignDays + 1,
        signedDates: [...(prev.signedDates || []), today].slice(-7) // 保留最近7天
      }
    })

    // 标记任务进度：今日游戏次数+1
    updateTaskProgress('play_game', 1)
  }, [setSignInfo])

  // 检查今天是否已签到
  const hasSignedToday = signInfo.lastSignDate === today

  // 获取今天签到可获得的奖励
  const getTodaySignReward = useCallback(() => {
    const day = Math.min(signInfo.currentStreak || 0, 7)
    return day > 0 ? SIGN_REWARDS[day - 1] : 0
  }, [signInfo.currentStreak])

  // 获取当前连续签到天数对应的奖励
  const getCurrentDayReward = useCallback(() => {
    const day = Math.min(signInfo.currentStreak || 0, 7)
    return day > 0 ? SIGN_REWARDS[day - 1] : SIGN_REWARDS[0]
  }, [signInfo.currentStreak])

  // 获取签到状态（某天是否已签到）
  const isDateSigned = useCallback((dateStr) => {
    return signInfo.signedDates?.includes(dateStr) || false
  }, [signInfo.signedDates])

  // 获取连续签到天数（最多7天循环）
  const getEffectiveStreak = useCallback(() => {
    return Math.min(signInfo.currentStreak || 0, 7)
  }, [signInfo.currentStreak])

  // 更新任务进度
  const updateTaskProgress = useCallback((taskId, progress) => {
    const today = getUTCDateStr()

    setTaskData(prev => {
      // 如果日期变了，重置
      if (prev.date !== today) {
        return {
          date: today,
          tasks: { [taskId]: progress },
          claimedTasks: []
        }
      }

      const currentProgress = prev.tasks[taskId] || 0
      const newProgress = Math.max(currentProgress, progress)

      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          [taskId]: newProgress
        }
      }
    })
  }, [setTaskData])

  // 增加任务进度（用于游戏中的实时更新）
  const incrementTaskProgress = useCallback((taskId, delta = 1) => {
    const today = getUTCDateStr()

    setTaskData(prev => {
      if (prev.date !== today) {
        return {
          date: today,
          tasks: { [taskId]: delta },
          claimedTasks: []
        }
      }

      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          [taskId]: (prev.tasks[taskId] || 0) + delta
        }
      }
    })
  }, [setTaskData])

  // 领取任务奖励
  const claimTaskReward = useCallback((taskId) => {
    const task = DAILY_TASKS_CONFIG.find(t => t.id === taskId)
    if (!task) return 0

    const today = getUTCDateStr()
    let rewardAmount = 0

    setTaskData(prev => {
      // 已经领取
      if (prev.claimedTasks?.includes(taskId)) {
        return prev
      }

      const currentProgress = prev.tasks[taskId] || 0
      // 未达到目标
      if (currentProgress < task.target) {
        return prev
      }

      rewardAmount = task.reward
      return {
        ...prev,
        claimedTasks: [...(prev.claimedTasks || []), taskId]
      }
    })

    return rewardAmount
  }, [setTaskData])

  // 检查任务是否已完成
  const isTaskCompleted = useCallback((taskId) => {
    const task = DAILY_TASKS_CONFIG.find(t => t.id === taskId)
    if (!task) return false
    const progress = taskData.tasks[taskId] || 0
    return progress >= task.target
  }, [taskData.tasks])

  // 检查任务是否已领取
  const isTaskClaimed = useCallback((taskId) => {
    return taskData.claimedTasks?.includes(taskId) || false
  }, [taskData.claimedTasks])

  // 获取任务进度
  const getTaskProgress = useCallback((taskId) => {
    return taskData.tasks[taskId] || 0
  }, [taskData.tasks])

  // 获取所有任务配置
  const getAllTasks = useCallback(() => {
    return DAILY_TASKS_CONFIG.map(task => ({
      ...task,
      progress: taskData.tasks[task.id] || 0,
      completed: (taskData.tasks[task.id] || 0) >= task.target,
      claimed: taskData.claimedTasks?.includes(task.id) || false
    }))
  }, [taskData])

  // 获取今日任务奖励总额
  const getTotalPendingRewards = useCallback(() => {
    return DAILY_TASKS_CONFIG.reduce((sum, task) => {
      const progress = taskData.tasks[task.id] || 0
      const claimed = taskData.claimedTasks?.includes(task.id)
      if (progress >= task.target && !claimed) {
        return sum + task.reward
      }
      return sum
    }, 0)
  }, [taskData])

  // 游戏结束调用：更新相关任务进度
  const onGameEnd = useCallback(({
    score = 0,
    combo = 0,
    isTimedMode = false,
    isDailyChallenge = false,
    isStoryMode = false,
    levelCleared = false,
    shared = false
  } = {}) => {
    // 游戏次数
    incrementTaskProgress('play_game', 1)

    // 连击
    if (combo > 0) {
      const currentCombo = taskData.tasks['combo_10'] || 0
      if (combo > currentCombo) {
        updateTaskProgress('combo_10', combo)
      }
    }

    // 得分
    if (score > 0) {
      const currentScore = taskData.tasks['score_50'] || 0
      if (score > currentScore) {
        updateTaskProgress('score_50', score)
      }
    }

    // 限时模式得分
    if (isTimedMode && score > 0) {
      const currentTimed = taskData.tasks['timed_mode'] || 0
      if (score > currentTimed) {
        updateTaskProgress('timed_mode', score)
      }
    }

    // 每日挑战
    if (isDailyChallenge && levelCleared) {
      updateTaskProgress('challenge', 1)
    }

    // 剧情模式
    if (isStoryMode && levelCleared) {
      updateTaskProgress('story', 1)
    }

    // 分享
    if (shared) {
      updateTaskProgress('share', 1)
    }
  }, [incrementTaskProgress, updateTaskProgress, taskData.tasks])

  return {
    // 签到相关
    signInfo,
    hasSignedToday,
    signIn,
    getTodaySignReward,
    getCurrentDayReward,
    isDateSigned,
    getEffectiveStreak,
    signRewards: SIGN_REWARDS,

    // 任务相关
    taskData,
    updateTaskProgress,
    incrementTaskProgress,
    claimTaskReward,
    isTaskCompleted,
    isTaskClaimed,
    getTaskProgress,
    getAllTasks,
    getTotalPendingRewards,
    onGameEnd,
    taskConfigs: DAILY_TASKS_CONFIG
  }
}