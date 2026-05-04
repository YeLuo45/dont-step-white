import { useCallback, useEffect } from 'react'
import { useStorage } from './useStorage'
import { STORAGE_COINS, STORAGE_EQUIPPED, STORAGE_OWNED, STORAGE_PROGRESS, COINS_DAILY_FIRST, COINS_STREAK_BONUS, COINS_STREAK_THRESHOLD, SKINS, LEVELS } from '../utils/constants'

const getTodayStr = () => new Date().toISOString().split('T')[0]

export function useV3Store() {
  const [coinsData, setCoinsData] = useStorage(STORAGE_COINS, { coins: 0, lastDaily: null, streakDays: 0 })
  const [equippedSkin, setEquippedSkin] = useStorage(STORAGE_EQUIPPED, { skin: 'default' })
  const [ownedSkins, setOwnedSkins] = useStorage(STORAGE_OWNED, ['default'])
  const [progress, setProgress] = useStorage(STORAGE_PROGRESS, {
    unlockedLevels: ['time60'],
    bestScores: {},
    bestStars: {}
  })

  // Apply skin theme on mount
  useEffect(() => {
    const skinData = SKINS[equippedSkin.skin] || SKINS.default
    document.documentElement.style.setProperty('--skin-bg', skinData.bg)
    document.documentElement.style.setProperty('--skin-accent', skinData.accent)
    document.body.style.background = skinData.bg
  }, [equippedSkin])

  // Daily bonus check
  useEffect(() => {
    const today = getTodayStr()
    if (coinsData.lastDaily !== today) {
      let bonus = COINS_DAILY_FIRST
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      let newStreak = 1
      if (coinsData.lastDaily === yesterdayStr) {
        newStreak = (coinsData.streakDays || 0) + 1
        if (newStreak >= COINS_STREAK_THRESHOLD) {
          bonus += COINS_STREAK_BONUS
        }
      }

      setCoinsData({
        coins: coinsData.coins + bonus,
        lastDaily: today,
        streakDays: newStreak
      })
    }
  }, [])

  const addCoins = useCallback((amount) => {
    setCoinsData(prev => ({ ...prev, coins: prev.coins + amount }))
  }, [setCoinsData])

  const spendCoins = useCallback((amount) => {
    if (coinsData.coins >= amount) {
      setCoinsData(prev => ({ ...prev, coins: prev.coins - amount }))
      return true
    }
    return false
  }, [coinsData.coins, setCoinsData])

  const buySkin = useCallback((skinId) => {
    const skin = SKINS[skinId]
    if (!skin || ownedSkins.includes(skinId) || skin.price === 0) return false
    if (spendCoins(skin.price)) {
      setOwnedSkins(prev => [...prev, skinId])
      return true
    }
    return false
  }, [ownedSkins, spendCoins])

  const equipSkin = useCallback((skinId) => {
    if (ownedSkins.includes(skinId)) {
      setEquippedSkin({ skin: skinId })
      const skinData = SKINS[skinId] || SKINS.default
      document.documentElement.style.setProperty('--skin-bg', skinData.bg)
      document.documentElement.style.setProperty('--skin-accent', skinData.accent)
      document.body.style.background = skinData.bg
      return true
    }
    return false
  }, [ownedSkins, setEquippedSkin])

  const isLevelUnlocked = useCallback((levelId) => {
    return progress.unlockedLevels.includes(levelId)
  }, [progress.unlockedLevels])

  const unlockLevel = useCallback((levelId) => {
    if (!progress.unlockedLevels.includes(levelId)) {
      setProgress(prev => ({
        ...prev,
        unlockedLevels: [...prev.unlockedLevels, levelId]
      }))
    }
  }, [progress.unlockedLevels, setProgress])

  const updateLevelScore = useCallback((levelId, score) => {
    const level = LEVELS.find(l => l.id === levelId)
    if (!level) return { unlocked: false, newStars: 0 }

    const currentBest = progress.bestScores[levelId] || 0
    const newBest = Math.max(currentBest, score)

    let newStars = 0
    if (level.passScore !== null) {
      if (score >= level.passScore) newStars = 1
      if (score >= level.passScore * 1.5) newStars = 2
      if (score >= level.passScore * 2) newStars = 3
    } else {
      newStars = 3 // endless mode, just completion
    }

    const currentStars = progress.bestStars[levelId] || 0
    newStars = Math.max(newStars, currentStars)

    setProgress(prev => ({
      ...prev,
      bestScores: { ...prev.bestScores, [levelId]: newBest },
      bestStars: { ...prev.bestStars, [levelId]: newStars }
    }))

    // Check for level unlocks
    let unlocked = false
    for (const lvl of LEVELS) {
      if (lvl.unlock === levelId && !progress.unlockedLevels.includes(lvl.id)) {
        setProgress(prev => ({
          ...prev,
          unlockedLevels: [...prev.unlockedLevels, lvl.id]
        }))
        unlocked = true
      }
    }

    return { unlocked, newStars }
  }, [progress, setProgress])

  const clearAllData = useCallback(() => {
    setCoinsData({ coins: 0, lastDaily: null, streakDays: 0 })
    setEquippedSkin({ skin: 'default' })
    setOwnedSkins(['default'])
    setProgress({
      unlockedLevels: ['time60'],
      bestScores: {},
      bestStars: {}
    })
    // Reset to default skin
    const skinData = SKINS.default
    document.documentElement.style.setProperty('--skin-bg', skinData.bg)
    document.documentElement.style.setProperty('--skin-accent', skinData.accent)
    document.body.style.background = skinData.bg
  }, [setCoinsData, setEquippedSkin, setOwnedSkins, setProgress])

  return {
    coins: coinsData.coins,
    streakDays: coinsData.streakDays,
    equippedSkin: equippedSkin.skin,
    ownedSkins,
    progress,
    addCoins,
    spendCoins,
    buySkin,
    equipSkin,
    isLevelUnlocked,
    unlockLevel,
    updateLevelScore,
    clearAllData
  }
}
