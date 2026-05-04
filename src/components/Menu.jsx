import React from 'react'
import './Menu.css'

export function Menu({ coins, onStartGame, onOpenShop, onOpenLevels, onOpenSettings, onOpenLeaderboard }) {
  return (
    <div className="menu">
      <div className="coins-display" onClick={onOpenShop}>
        <span className="coins-icon">🪙</span>
        <span className="coins-value">{coins}</span>
      </div>
      <h1 className="menu-title">别踩白块</h1>
      <p className="menu-desc">黑块下落，点击踩下<br />踩到白块或漏踩黑块则失败</p>
      <button className="menu-btn primary" onClick={onStartGame}>开始游戏</button>
      <button className="menu-btn" onClick={onOpenShop}>🛒 皮肤商店</button>
      <button className="menu-btn" onClick={onOpenLevels}>⭐ 关卡挑战</button>
      <button className="menu-btn" onClick={onOpenLeaderboard}>🏆 我的战绩</button>
      <button className="menu-btn" onClick={onOpenSettings}>⚙️ 设置</button>
      <div className="menu-hint">
        <p>PC: ← → 移动 | 空格/点击 踩下 | D 使用道具</p>
        <p>移动: 左右滑动 | 点击 踩下</p>
      </div>
    </div>
  )
}
