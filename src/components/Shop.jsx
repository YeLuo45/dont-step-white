import React, { useState } from 'react'
import { EXTENDED_SKINS, SKIN_TABS, SKIN_RARITIES, RARITY_COLORS, RARITY_NAMES, applySkinCSS } from '../utils/constants'
import './Shop.css'

export function Shop({ coins, ownedSkins, equippedSkin, onBuy, onEquip, onBack }) {
  const [activeTab, setActiveTab] = useState('all')

  const handleAction = (skinId) => {
    if (skinId === equippedSkin) return
    if (ownedSkins.includes(skinId)) {
      onEquip(skinId)
    } else {
      onBuy(skinId)
    }
  }

  const getButtonText = (skinId, skin) => {
    if (skinId === equippedSkin) return '已装备'
    if (ownedSkins.includes(skinId)) return '装备'
    return `🪙 ${skin.price}`
  }

  const canAfford = (price) => coins >= price

  // 过滤皮肤
  const filteredSkins = Object.values(EXTENDED_SKINS).filter(skin => {
    if (activeTab === 'all') return true
    return skin.type === activeTab
  })

  // 获取皮肤等级颜色
  const getRarityColor = (rarity) => RARITY_COLORS[rarity] || RARITY_COLORS.common

  return (
    <div className="shop">
      <div className="shop-header">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <h2 className="shop-title">🎨 皮肤商店</h2>
        <div className="shop-coins">
          <span className="coins-icon">🪙</span>
          <span className="coins-value">{coins}</span>
        </div>
      </div>

      {/* V11: Tab切换 */}
      <div className="shop-tabs">
        {SKIN_TABS.map(tab => (
          <button
            key={tab.key}
            className={`shop-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div className="shop-grid">
        {filteredSkins.map((skin) => {
          const isOwned = ownedSkins.includes(skin.id)
          const isEquipped = equippedSkin === skin.id
          const isLocked = !canAfford(skin.price) && !isOwned

          return (
            <div
              key={skin.id}
              className={`skin-card ${isEquipped ? 'equipped' : ''} ${isLocked ? 'locked' : ''}`}
            >
              {/* 皮肤预览 */}
              <div
                className="skin-preview"
                style={{
                  background: typeof skin.bg === 'string' && skin.bg.includes('gradient') ? skin.bg : skin.bg,
                  borderColor: skin.accent
                }}
              >
                <div className="skin-sample" style={{ background: skin.accent }}></div>
                {/* 等级标签 */}
                <span
                  className="skin-rarity"
                  style={{ backgroundColor: getRarityColor(skin.rarity) }}
                >
                  {RARITY_NAMES[skin.rarity]}
                </span>
              </div>

              {/* 皮肤信息 */}
              <div className="skin-info">
                <h3 className="skin-name">{skin.name}</h3>
                <p className="skin-desc">{skin.description}</p>
                <p className="skin-price">
                  {skin.price === 0 ? '免费' : `🪙 ${skin.price}`}
                </p>
              </div>

              <button
                className={`skin-btn ${isEquipped ? 'equipped' : ''} ${isLocked ? 'disabled' : ''}`}
                onClick={() => handleAction(skin.id)}
                disabled={isEquipped || isLocked}
              >
                {getButtonText(skin.id, skin)}
              </button>
            </div>
          )
        })}
      </div>

      {/* 空状态提示 */}
      {filteredSkins.length === 0 && (
        <div className="shop-empty">
          <p>该分类暂无皮肤</p>
        </div>
      )}
    </div>
  )
}
