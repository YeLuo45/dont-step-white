import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Menu } from './components/Menu'
import { Game } from './components/Game'
import { Shop } from './components/Shop'
import { LevelSelect } from './components/LevelSelect'
import { Settings } from './components/Settings'
import { Leaderboard } from './components/Leaderboard'
import { useV3Store } from './hooks/useV3Store'
import { useV4Leaderboard } from './hooks/useV4Leaderboard'
import { LEVELS } from './utils/constants'
import './App.css'

const PAGE_HOME = 'home'
const PAGE_GAME = 'game'
const PAGE_SHOP = 'shop'
const PAGE_LEVELS = 'levels'
const PAGE_SETTINGS = 'settings'
const PAGE_LEADERBOARD = 'leaderboard'

function App() {
  const [currentPage, setCurrentPage] = useState(PAGE_HOME)
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [gameMode, setGameMode] = useState('endless') // 'endless' or level id
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [earnedCoins, setEarnedCoins] = useState(0)
  const [pendingNavigation, setPendingNavigation] = useState(null)
  const [viewSharedData, setViewSharedData] = useState(null)
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

  // Check URL for rank parameter on mount
  useEffect(() => {
    const sharedData = parseUrlRank()
    if (sharedData) {
      setViewSharedData(sharedData)
      setCurrentPage(PAGE_LEADERBOARD)
    }
  }, [parseUrlRank])

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
  const handleGameOver = useCallback((score, isEndlessMode) => {
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
  }, [selectedLevel, updateLevelScore, addCoins])

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

  // Navigate to leaderboard
  const handleOpenLeaderboard = useCallback(() => {
    setViewSharedData(null)
    setCurrentPage(PAGE_LEADERBOARD)
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
          />
        )

      case PAGE_GAME:
        return (
          <Game
            key={gameKeyRef.current}
            mode={gameMode}
            levelId={selectedLevel}
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

      default:
        return null
    }
  }

  return (
    <div className="app">
      {renderContent()}
    </div>
  )
}

export default App
