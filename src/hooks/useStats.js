import { useCallback } from 'react'
import { useStorage } from './useStorage'

const STORAGE_STATS = 'dont-step-white-v16-stats'

const initialStatsData = () => ({
  // 基础统计
  totalGames: 0,
  totalTime: 0, // 秒
  totalScore: 0,
  totalCombo: 0,
  
  // 里程碑记录
  bestScore: 0,
  bestCombo: 0,
  longestSurvival: 0, // 秒
  
  // 模式分布: { modeId: { games, bestScore, bestCombo, totalTime } }
  modeStats: {},
  
  // 7日活跃 (按日期存储, 格式: YYYY-MM-DD)
  dailyActivity: {}, // { '2026-05-04': { games, time, score } }
})

export function useStats() {
  const [stats, setStats] = useStorage(STORAGE_STATS, initialStatsData())

  // 获取今日日期字符串
  const getTodayStr = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  // 获取最近7天的日期字符串数组
  const getLast7Days = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    }
    return days
  }

  // 游戏结束时调用
  const onGameEnd = useCallback(({
    score = 0,
    combo = 0,
    survivalTime = 0, // 秒
    mode = 'endless',
    isTimedMode = false,
  }) => {
    const today = getTodayStr()
    
    setStats(prev => {
      const newStats = { ...prev }
      
      // 基础统计
      newStats.totalGames += 1
      newStats.totalTime += survivalTime
      newStats.totalScore += score
      newStats.totalCombo += combo
      
      // 里程碑
      if (score > newStats.bestScore) {
        newStats.bestScore = score
      }
      if (combo > newStats.bestCombo) {
        newStats.bestCombo = combo
      }
      if (survivalTime > newStats.longestSurvival) {
        newStats.longestSurvival = survivalTime
      }
      
      // 模式分布
      const modeKey = isTimedMode ? 'timed' : mode
      if (!newStats.modeStats[modeKey]) {
        newStats.modeStats[modeKey] = { games: 0, bestScore: 0, bestCombo: 0, totalTime: 0 }
      }
      const ms = newStats.modeStats[modeKey]
      ms.games += 1
      if (score > ms.bestScore) ms.bestScore = score
      if (combo > ms.bestCombo) ms.bestCombo = combo
      ms.totalTime += survivalTime
      
      // 7日活跃
      if (!newStats.dailyActivity[today]) {
        newStats.dailyActivity[today] = { games: 0, time: 0, score: 0 }
      }
      newStats.dailyActivity[today].games += 1
      newStats.dailyActivity[today].time += survivalTime
      newStats.dailyActivity[today].score += score
      
      return newStats
    })
  }, [setStats])

  // 获取模式时间占比 (用于环形图)
  const getModeTimeDistribution = useCallback(() => {
    const total = stats.totalTime || 1
    const distribution = []
    
    Object.entries(stats.modeStats).forEach(([mode, data]) => {
      distribution.push({
        mode,
        time: data.totalTime,
        percentage: Math.round((data.totalTime / total) * 100)
      })
    })
    
    return distribution.sort((a, b) => b.time - a.time)
  }, [stats.modeStats, stats.totalTime])

  // 获取7日活跃数据 (用于柱状图)
  const getWeeklyActivity = useCallback(() => {
    const days = getLast7Days()
    return days.map(day => ({
      date: day,
      shortDate: day.slice(5), // MM-DD
      games: stats.dailyActivity[day]?.games || 0,
      time: stats.dailyActivity[day]?.time || 0,
      score: stats.dailyActivity[day]?.score || 0
    }))
  }, [stats.dailyActivity])

  // 获取模式列表 (带中文名)
  const getModeName = (mode) => {
    const names = {
      endless: '无尽模式',
      timed: '限时挑战',
      custom: '自定义关卡',
      speed: '速度关卡',
      slow: '慢速关卡',
      survival: '生存关卡',
      pure: '纯净关卡',
      time60: '60秒关卡'
    }
    return names[mode] || mode
  }

  // 获取平均分
  const getAverageScore = () => {
    return stats.totalGames > 0 ? Math.round(stats.totalScore / stats.totalGames) : 0
  }

  // 获取平均游戏时长
  const getAverageTime = () => {
    return stats.totalGames > 0 ? Math.round(stats.totalTime / stats.totalGames) : 0
  }

  // 获取平均连击
  const getAverageCombo = () => {
    return stats.totalGames > 0 ? Math.round(stats.totalCombo / stats.totalGames) : 0
  }

  // 重置统计数据
  const resetStats = useCallback(() => {
    setStats(initialStatsData())
  }, [setStats])

  return {
    stats,
    onGameEnd,
    getModeTimeDistribution,
    getWeeklyActivity,
    getModeName,
    getAverageScore,
    getAverageTime,
    getAverageCombo,
    resetStats
  }
}
