import React, { useEffect } from 'react'
import { useAudio } from '../hooks/useAudio'
import './Menu.css'

export function Menu({ coins, onStartGame, onOpenShop, onOpenLevels, onOpenSettings, onOpenLeaderboard, onStartTimedMode }) {
  const { playClick, startBGM, getSettings } = useAudio()

  // V7: Start BGM when menu mounts
  useEffect(() => {
    const settings = getSettings()
    if (settings.bgmEnabled) {
      startBGM()
    }
  }, [startBGM, getSettings])

  const handleClick = (callback) => {
    playClick()
    callback()
  }

  return (
    <div className="menu">
      <div className="coins-display" onClick={() => handleClick(onOpenShop)}>
        <span className="coins-icon">🪙</span>
        <span className="coins-value">{coins}</span>
      </div>
      <h1 className="menu-title">别踩白块</h1>
      <p className="menu-desc">黑块下落，点击踩下<br />踩到白块或漏踩黑块则失败</p>
      <button className="menu-btn primary" onClick={() => handleClick(onStartGame)}>开始游戏</button>
      <button className="menu-btn timed" onClick={() => handleClick(onStartTimedMode)}>⏱️ 限时挑战</button>
      <button className="menu-btn" onClick={() => handleClick(onOpenShop)}>🛒 皮肤商店</button>
      <button className="menu-btn" onClick={() => handleClick(onOpenLevels)}>⭐ 关卡挑战</button>
      <button className="menu-btn" onClick={() => handleClick(onOpenLeaderboard)}>🏆 我的战绩</button>
      <button className="menu-btn" onClick={() => handleClick(onOpenSettings)}>⚙️ 设置</button>
      <div className="menu-hint">
        <p>PC: ← → 移动 | 空格/点击 踩下 | D 使用道具</p>
        <p>移动: 左右滑动 | 点击 踩下</p>
      </div>
    </div>
  )
}