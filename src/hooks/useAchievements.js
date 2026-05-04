import { useState, useCallback, useRef, useEffect } from 'react'
import { useStorage } from './useStorage'
import {
  ACHIEVEMENTS,
  STORAGE_ACHIEVEMENTS,
  STORAGE_STATS,
  STORAGE_TITLES,
  STORAGE_TOTAL_COINS_EARNED,
  initialAchievementState,
  initialStats,
  TITLES,
} from '../utils/achievements'

export function useAchievements() {
  const [unlockedMap, setUnlockedMap] = useStorage(STORAGE_ACHIEVEMENTS, initialAchievementState())
  const [stats, setStats] = useStorage(STORAGE_STATS, initialStats())
  const [titles, setTitles] = useStorage(STORAGE_TITLES, [])
  const [totalCoinsEarned, setTotalCoinsEarned] = useStorage(STORAGE_TOTAL_COINS_EARNED, 0)

  // Toast 通知状态
  const [toastQueue, setToastQueue] = useState([])
  const toastTimeoutRef = useRef(null)

  // 主动画通知
  const showToast = useCallback((achievement) => {
    setToastQueue(prev => [...prev, achievement])
  }, [])

  // 移除已显示的通知
  const dismissToast = useCallback(() => {
    setToastQueue(prev => prev.slice(1))
  }, [])

  // 自动消失
  useEffect(() => {
    if (toastQueue.length > 0) {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
      toastTimeoutRef.current = setTimeout(() => {
        dismissToast()
      }, 3000)
    }
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    }
  }, [toastQueue, dismissToast])

  // 发放奖励
  const claimReward = useCallback((achievement) => {
    const rewards = []
    if (achievement.reward.coins > 0) {
      rewards.push({ type: 'coins', amount: achievement.reward.coins })
    }
    if (achievement.reward.title) {
      rewards.push({ type: 'title', title: achievement.reward.title })
    }
    if (achievement.reward.skin) {
      rewards.push({ type: 'skin', skin: achievement.reward.skin })
    }
    return rewards
  }, [])

  // 解锁成就
  const unlockAchievement = useCallback((achievementId) => {
    setUnlockedMap(prev => {
      if (prev[achievementId]) return prev // 已解锁
      const newMap = { ...prev, [achievementId]: true }
      return newMap
    })
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId)
    if (achievement) {
      showToast(achievement)
    }
    return achievement
  }, [setUnlockedMap, showToast])

  // 检查成就条件
  const checkAchievement = useCallback((achievement) => {
    if (unlockedMap[achievement.id]) return false // 已解锁

    const { condition } = achievement
    const s = stats

    switch (condition.type) {
      case 'combo':
        return s.maxCombo >= condition.value

      case 'score':
        return s.maxScore >= condition.value

      case 'games_played':
        return s.gamesPlayed >= condition.value

      case 'timed_games':
        return s.timedGames >= condition.value

      case 'timed_score':
        return s.maxTimedScore >= condition.value

      case 'levels_cleared':
        return s.levelsCleared >= condition.value

      case 'total_coins_earned':
        return totalCoinsEarned >= condition.value

      case 'owned_skins':
        return s.ownedSkins.length >= condition.value

      case 'no_hit_game':
        return s.lastGameNoDeath && s.lastGameScore > 0

      case 'high_combo_no_death':
        return s.lastGameNoDeath && s.lastGameMaxCombo >= condition.value

      case 'lucky_combo':
        return s.maxCombo >= condition.value

      case 'comeback':
        return s.hadOneLife && s.scoredAfterOneLife >= condition.value

      case 'speed_score':
        return s.lastGameMaxSpeed <= condition.speed && s.maxScore >= condition.value

      default:
        return false
    }
  }, [unlockedMap, stats, totalCoinsEarned])

  // 检查所有可解锁的成就
  const checkAllAchievements = useCallback((category = null) => {
    const achievementsToCheck = category
      ? ACHIEVEMENTS.filter(a => a.category === category)
      : ACHIEVEMENTS

    const newlyUnlocked = []
    achievementsToCheck.forEach(achievement => {
      if (checkAchievement(achievement)) {
        const achievementData = unlockAchievement(achievement.id)
        if (achievementData) {
          newlyUnlocked.push(achievementData)
        }
      }
    })
    return newlyUnlocked
  }, [checkAchievement, unlockAchievement])

  // 获取成就进度
  const getAchievementProgress = useCallback((achievement) => {
    if (unlockedMap[achievement.id]) return 100

    const { condition } = achievement
    const s = stats

    switch (condition.type) {
      case 'combo':
      case 'score':
      case 'games_played':
      case 'timed_games':
      case 'timed_score':
      case 'levels_cleared':
      case 'total_coins_earned':
      case 'owned_skins':
        return Math.min(100, Math.floor((s[getStatField(condition.type)] / condition.value) * 100))
      default:
        return 0
    }
  }, [unlockedMap, stats])

  // 获取统计字段名
  const getStatField = (type) => {
    switch (type) {
      case 'combo': return 'maxCombo'
      case 'score': return 'maxScore'
      case 'games_played': return 'gamesPlayed'
      case 'timed_games': return 'timedGames'
      case 'timed_score': return 'maxTimedScore'
      case 'levels_cleared': return 'levelsCleared'
      case 'total_coins_earned': return null // 直接用 totalCoinsEarned
      case 'owned_skins': return null // 特殊处理
      default: return null
    }
  }

  // 游戏结束时调用
  const onGameEnd = useCallback(({
    score,
    combo,
    isTimedMode = false,
    isEndlessMode = false,
    isLevelMode = false,
    levelCleared = false,
    livesLeft = 3,
    earnedCoins = 0,
    maxSpeed = 800,
  }) => {
    const noDeath = isEndlessMode && livesLeft > 0
    const hadOneLife = isEndlessMode && livesLeft === 1

    // 计算 comeback 得分
    let scoredAfterOneLife = 0
    if (hadOneLife && score >= 20) {
      scoredAfterOneLife = score
    }

    // 更新统计
    setStats(prev => {
      const newStats = { ...prev }

      // 更新最高连击
      if (combo > newStats.maxCombo) {
        newStats.maxCombo = combo
      }

      // 更新最高分
      if (score > newStats.maxScore) {
        newStats.maxScore = score
      }

      // 更新游戏次数
      newStats.gamesPlayed += 1

      // 更新限时模式统计
      if (isTimedMode) {
        newStats.timedGames += 1
        if (score > newStats.maxTimedScore) {
          newStats.maxTimedScore = score
        }
      }

      // 更新关卡通关
      if (isLevelMode && levelCleared) {
        newStats.levelsCleared += 1
      }

      // 记录本局数据(用于特殊成就)
      newStats.lastGameNoDeath = noDeath
      newStats.lastGameMaxCombo = combo
      newStats.lastGameScore = score
      newStats.lastGameLivesAtEnd = livesLeft
      newStats.lastGameMaxSpeed = maxSpeed

      // comeback 检测
      if (hadOneLife) {
        newStats.hadOneLife = true
        newStats.scoredAfterOneLife = scoredAfterOneLife
      } else {
        newStats.hadOneLife = false
        newStats.scoredAfterOneLife = 0
      }

      return newStats
    })

    // 更新累计金币
    if (earnedCoins > 0) {
      setTotalCoinsEarned(prev => prev + earnedCoins)
    }

    // 检查成就
    setTimeout(() => {
      checkAllAchievements()
    }, 100)
  }, [setStats, setTotalCoinsEarned, checkAllAchievements])

  // 添加皮肤到拥有列表
  const addOwnedSkin = useCallback((skinId) => {
    setStats(prev => {
      if (prev.ownedSkins.includes(skinId)) return prev
      return {
        ...prev,
        ownedSkins: [...prev.ownedSkins, skinId]
      }
    })
  }, [setStats])

  // 解锁称号
  const unlockTitle = useCallback((titleId) => {
    setTitles(prev => {
      if (prev.includes(titleId)) return prev
      return [...prev, titleId]
    })
  }, [setTitles])

  // 获取当前装备的称号
  const getCurrentTitle = useCallback(() => {
    if (titles.length === 0) return null
    return TITLES.find(t => titles.includes(t.id))
  }, [titles])

  // 获取所有解锁的成就
  const getUnlockedAchievements = useCallback(() => {
    return ACHIEVEMENTS.filter(a => unlockedMap[a.id])
  }, [unlockedMap])

  // 获取某分类的成就
  const getAchievementsByCategory = useCallback((categoryId) => {
    if (categoryId === 'all') return ACHIEVEMENTS
    return ACHIEVEMENTS.filter(a => a.category === categoryId)
  }, [])

  // 获取解锁进度
  const getUnlockProgress = useCallback(() => {
    const total = ACHIEVEMENTS.length
    const unlocked = Object.values(unlockedMap).filter(Boolean).length
    return { unlocked, total, percentage: Math.floor((unlocked / total) * 100) }
  }, [unlockedMap])

  // 重置成就数据(调试用)
  const resetAchievements = useCallback(() => {
    setUnlockedMap(initialAchievementState())
    setStats(initialStats())
    setTitles([])
    setTotalCoinsEarned(0)
  }, [setUnlockedMap, setStats, setTitles, setTotalCoinsEarned])

  return {
    // State
    unlockedMap,
    stats,
    titles,
    totalCoinsEarned,
    toastQueue,
    // Actions
    checkAllAchievements,
    onGameEnd,
    claimReward,
    unlockAchievement,
    addOwnedSkin,
    unlockTitle,
    dismissToast,
    // Getters
    getUnlockedAchievements,
    getAchievementsByCategory,
    getCurrentTitle,
    getUnlockProgress,
    getAchievementProgress,
    getStatField,
    // Debug
    resetAchievements,
  }
}
