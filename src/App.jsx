import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Menu } from './components/Menu'
import { Game } from './components/Game'
import { Shop } from './components/Shop'
import { LevelSelect } from './components/LevelSelect'
import { Settings } from './components/Settings'
import { Leaderboard } from './components/Leaderboard'
import { Editor, CustomLevelsList } from './components/Editor'
import { Achievements } from './components/Achievements'
import { AchievementToastQueue } from './components/AchievementToast'
import { DailyChallenge } from './components/DailyChallenge'
import { DailyRewards } from './components/DailyRewards'
import { StoryMode } from './components/StoryMode'
import { Stats } from './components/Stats'
import { Replay } from './components/Replay'
import { useV3Store } from './hooks/useV3Store'
import { useV4Leaderboard } from './hooks/useV4Leaderboard'
import { useAchievements } from './hooks/useAchievements'
import { useDailyTasks } from './hooks/useDailyTasks'
import { useStats } from './hooks/useStats'
import { useReplay } from './hooks/useReplay'
import { LEVELS } from './utils/constants'
import './App.css'

const PAGE_HOME = 'home'
const PAGE_GAME = 'game'
const PAGE_SHOP = 'shop'
const PAGE_LEVELS = 'levels'
const PAGE_SETTINGS = 'settings'
const PAGE_LEADERBOARD = 'leaderboard'
const PAGE_EDITOR = 'editor'
const PAGE_CUSTOM_LEVELS = 'custom-levels'
const PAGE_ACHIEVEMENTS = 'achievements'
const PAGE_DAILY_CHALLENGE = 'daily-challenge'
const PAGE_DAILY_REWARDS = 'daily-rewards'
const PAGE_STORY = 'story'
const PAGE_STATS = 'stats'
const PAGE_REPLAY = 'replay'

function App() {
  const [currentPage, setCurrentPage] = useState(PAGE_HOME)
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [gameMode, setGameMode] = useState('endless') // 'endless' or level id
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [earnedCoins, setEarnedCoins] = useState(0)
  const [pendingNavigation, setPendingNavigation] = useState(null)
  const [viewSharedData, setViewSharedData] = useState(null)
  const [customLevelGrid, setCustomLevelGrid] = useState(null) // V8: custom level grid for editor
  const gameKeyRef = useRef(0)

  const { parseUrlRank } = useV4Leaderboard()

  const {
    coins,
    equippedSkin,
    ownedSkins,
    buySkin,
    equipSkin,
    progress,
    isLevelUnlocked,
    updateLevelScore,
    clearAllData,
    addCoins
  } = useV3Store()

  // V9: Achievement system
  const {
    unlockedMap,
    stats,
    titles,
    totalCoinsEarned,
    toastQueue,
    onGameEnd,
    claimReward,
    unlockTitle,
    getUnlockedAchievements,
    dismissToast,
  } = useAchievements()

  // V14: Daily tasks hook
  const {
    onGameEnd: onDailyTaskGameEnd
  } = useDailyTasks()

  // V16: Stats hook
  const {
    onGameEnd: onStatsGameEnd
  } = useStats()

  // V17: Replay hook
  const {
    parseUrlReplay,
    clearUrlReplay,
  } = useReplay()

  // V17: Check URL for replay parameter on mount
  const [externalReplay, setExternalReplay] = useState(null)

  // Check URL for rank parameter on mount
  useEffect(() => {
    const sharedData = parseUrlRank()
    if (sharedData) {
      setViewSharedData(sharedData)
      setCurrentPage(PAGE_LEADERBOARD)
    }
  }, [parseUrlRank])

  // V17: Check URL for replay parameter on mount
  useEffect(() => {
    const replay = parseUrlReplay()
    if (replay) {
      setExternalReplay(replay)
      setCurrentPage(PAGE_REPLAY)
    }
  }, [parseUrlReplay])

  // Handle navigation from game over
  const handleGoShop = useCallback(() => {
    setCurrentPage(PAGE_SHOP)
  }, [])

  const handleGoLevels = useCallback(() => {
    setCurrentPage(PAGE_LEVELS)
  }, [])

  // Start endless mode
  const handleStartGame = useCallback(() => {
    setGameMode('endless')
    setSelectedLevel(null)
    gameKeyRef.current += 1
    setCurrentPage(PAGE_GAME)
  }, [])

  // V6: Start timed challenge mode
  const handleStartTimedMode = useCallback(() => {
    setGameMode('timed')
    setSelectedLevel(null)
    gameKeyRef.current += 1
    setCurrentPage(PAGE_GAME)
  }, [])

  // Select and start a level
  const handleSelectLevel = useCallback((levelId) => {
    setSelectedLevel(levelId)
    setGameMode(levelId)
    gameKeyRef.current += 1
    setCurrentPage(PAGE_GAME)
  }, [])

  // Game over handler - calculate coins earned
  const handleGameOver = useCallback((score, isEndlessMode, extraData = {}) => {
    let earned = 0
    if (isEndlessMode) {
      earned = Math.min(50, Math.floor(score / 5))
    } else if (selectedLevel) {
      const level = LEVELS.find(l => l.id === selectedLevel)
      if (level && score >= level.passScore) {
        earned = 20 + Math.floor(score / 10)
        earned = Math.min(100, earned)
        const result = updateLevelScore(selectedLevel, score)
        if (result.unlocked) {
          earned += 30 // bonus for unlocking new level
        }
      }
    }
    if (earned > 0) {
      addCoins(earned)
    }
    setEarnedCoins(earned)

    // V9: Process achievements
    // Note: achievements are checked in Game component, but we need to
    // update stats here for stats that Game doesn't have access to

    // V14: Update daily tasks
    onDailyTaskGameEnd({
      score,
      combo: extraData.combo || 0,
      isTimedMode: extraData.isTimedMode || false,
      isDailyChallenge: false,
      isStoryMode: false,
      levelCleared: false,
      shared: false
    })

    // V16: Update stats
    onStatsGameEnd({
      score,
      combo: extraData.combo || 0,
      survivalTime: extraData.survivalTime || 0,
      mode: selectedLevel || 'endless',
      isTimedMode: extraData.isTimedMode || false
    })
  }, [selectedLevel, updateLevelScore, addCoins, onDailyTaskGameEnd, onStatsGameEnd])

  // Restart handler
  const handleRestart = useCallback(() => {
    gameKeyRef.current += 1
    // Stay on game page, game component will restart
  }, [])

  // V7: Start BGM when navigating to menu
  const handleBackToHome = useCallback(() => {
    setCurrentPage(PAGE_HOME)
    setSelectedLevel(null)
    setEarnedCoins(0)
    // Clear URL parameters when going home
    if (window.location.search.includes('rank=')) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // V9: Navigate to achievements
  const handleOpenAchievements = useCallback(() => {
    setCurrentPage(PAGE_ACHIEVEMENTS)
  }, [])

  // Navigate to leaderboard
  const handleOpenLeaderboard = useCallback(() => {
    setViewSharedData(null)
    setCurrentPage(PAGE_LEADERBOARD)
  }, [])

  // Navigate to daily challenge
  const handleOpenDailyChallenge = useCallback(() => {
    setCurrentPage(PAGE_DAILY_CHALLENGE)
  }, [])

  // Navigate to story mode
  const handleOpenStoryMode = useCallback(() => {
    setCurrentPage(PAGE_STORY)
  }, [])

  // V14: Navigate to daily rewards
  const handleOpenDailyRewards = useCallback(() => {
    setCurrentPage(PAGE_DAILY_REWARDS)
  }, [])

  // V16: Navigate to stats
  const handleOpenStats = useCallback(() => {
    setCurrentPage(PAGE_STATS)
  }, [])

  // V17: Navigate to replay
  const handleOpenReplay = useCallback(() => {
    setExternalReplay(null)
    setCurrentPage(PAGE_REPLAY)
  }, [])

  // Handle play button from shared view
  const handlePlayFromShared = useCallback(() => {
    // Clear URL parameters
    window.history.replaceState({}, '', window.location.pathname)
    handleStartGame()
  }, [handleStartGame])

  // Sound toggle
  const handleSoundToggle = useCallback(() => {
    setSoundEnabled(prev => !prev)
  }, [])

  // V8: Editor handlers
  const handleOpenEditor = useCallback(() => {
    setCurrentPage(PAGE_EDITOR)
  }, [])

  const handleOpenCustomLevels = useCallback(() => {
    setCurrentPage(PAGE_CUSTOM_LEVELS)
  }, [])

  const handlePlayCustomLevel = useCallback((level) => {
    setCustomLevelGrid(level.grid)
    setGameMode('custom')
    setSelectedLevel(null)
    gameKeyRef.current += 1
    setCurrentPage(PAGE_GAME)
  }, [])

  // Check URL for custom level on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const levelParam = params.get('level')
    if (levelParam) {
      try {
        const flat = atob(levelParam)
        const grid = []
        for (let i = 0; i < 8; i++) {
          grid.push(flat.slice(i * 4, (i + 1) * 4).split('').map(Number))
        }
        if (grid.length === 8 && grid[0].length === 4) {
          setCustomLevelGrid(grid)
          setGameMode('custom')
          setSelectedLevel(null)
          gameKeyRef.current += 1
          setCurrentPage(PAGE_GAME)
          window.history.replaceState({}, '', window.location.pathname)
        }
      } catch (e) {
        console.error('Failed to decode level:', e)
      }
    }
  }, [])

  // Listen for custom level start from session
  useEffect(() => {
    const handler = (e) => {
      const level = e.detail
      setCustomLevelGrid(level.grid)
      setGameMode('custom')
      setSelectedLevel(null)
      gameKeyRef.current += 1
      setCurrentPage(PAGE_GAME)
    }
    window.addEventListener('startCustomLevel', handler)
    return () => window.removeEventListener('startCustomLevel', handler)
  }, [])

  // Render based on current page
  const renderContent = () => {
    switch (currentPage) {
      case PAGE_HOME:
        return (
          <Menu
            coins={coins}
            onStartGame={handleStartGame}
            onOpenShop={() => setCurrentPage(PAGE_SHOP)}
            onOpenLevels={() => setCurrentPage(PAGE_LEVELS)}
            onOpenSettings={() => setCurrentPage(PAGE_SETTINGS)}
            onOpenLeaderboard={handleOpenLeaderboard}
            onStartTimedMode={handleStartTimedMode}
            onOpenEditor={handleOpenEditor}
            onOpenAchievements={handleOpenAchievements}
            onOpenDailyChallenge={handleOpenDailyChallenge}
            onOpenStoryMode={handleOpenStoryMode}
            onOpenDailyRewards={handleOpenDailyRewards}
            onOpenStats={handleOpenStats}
            onOpenReplay={handleOpenReplay}
          />
        )

      case PAGE_GAME:
        return (
          <Game
            key={gameKeyRef.current}
            mode={gameMode}
            levelId={selectedLevel}
            customLevelGrid={gameMode === 'custom' ? customLevelGrid : null}
            onGameOver={handleGameOver}
            onGoShop={handleGoShop}
            onGoLevels={handleGoLevels}
            onHome={handleBackToHome}
            earnedCoins={earnedCoins}
            soundEnabled={soundEnabled}
            equippedSkin={equippedSkin}
          />
        )

      case PAGE_SHOP:
        return (
          <Shop
            coins={coins}
            ownedSkins={ownedSkins}
            equippedSkin={equippedSkin}
            onBuy={buySkin}
            onEquip={equipSkin}
            onBack={handleBackToHome}
          />
        )

      case PAGE_LEVELS:
        return (
          <LevelSelect
            progress={progress}
            onSelectLevel={handleSelectLevel}
            onBack={handleBackToHome}
          />
        )

      case PAGE_SETTINGS:
        return (
          <Settings
            soundEnabled={soundEnabled}
            onSoundToggle={handleSoundToggle}
            onClearData={clearAllData}
            onBack={handleBackToHome}
          />
        )

      case PAGE_LEADERBOARD:
        return (
          <Leaderboard
            mode={viewSharedData ? 'view-shared' : 'my-records'}
            sharedData={viewSharedData}
            onPlay={handlePlayFromShared}
            onHome={handleBackToHome}
          />
        )

      case PAGE_EDITOR:
        return (
          <Editor
            onBack={handleBackToHome}
            onOpenCustomLevels={handleOpenCustomLevels}
          />
        )

      case PAGE_CUSTOM_LEVELS:
        return (
          <CustomLevelsList
            onBack={handleOpenEditor}
            onPlayLevel={handlePlayCustomLevel}
            onGoHome={handleBackToHome}
          />
        )

      case PAGE_ACHIEVEMENTS:
        return (
          <Achievements
            unlockedMap={unlockedMap}
            stats={stats}
            titles={titles}
            totalCoinsEarned={totalCoinsEarned}
            onBack={handleBackToHome}
          />
        )

      case PAGE_DAILY_CHALLENGE:
        return (
          <DailyChallenge
            coins={coins}
            onUpdateCoins={addCoins}
            onBack={handleBackToHome}
          />
        )

      case PAGE_DAILY_REWARDS:
        return (
          <DailyRewards
            coins={coins}
            onUpdateCoins={addCoins}
            onBack={handleBackToHome}
          />
        )

      case PAGE_STORY:
        return (
          <StoryMode
            onBack={handleBackToHome}
            onCoinsEarned={addCoins}
          />
        )

      case PAGE_STATS:
        return (
          <Stats onBack={handleBackToHome} />
        )

      case PAGE_REPLAY:
        return (
          <Replay
            onBack={handleBackToHome}
            externalReplay={externalReplay}
            clearExternalReplay={() => setExternalReplay(null)}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="app">
      {renderContent()}
      <AchievementToastQueue queue={toastQueue} onDismiss={dismissToast} />
    </div>
  )
}

export default App
