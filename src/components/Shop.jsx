import React from 'react'
import { SKINS } from '../utils/constants'
import './Shop.css'

export function Shop({ coins, ownedSkins, equippedSkin, onBuy, onEquip, onBack }) {
  const handleAction = (skinId) => {
    if (skinId === equippedSkin) return
    if (ownedSkins.includes(skinId)) {
      onEquip(skinId)
    } else {
      onBuy(skinId)
    }
  }

  const getButtonText = (skinId) => {
    if (skinId === equippedSkin) return '已装备'
    if (ownedSkins.includes(skinId)) return '装备'
    return `🪙 ${SKINS[skinId].price}`
  }

  const canAfford = (price) => coins >= price

  return (
    <div className="shop">
      <div className="shop-header">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <h2 className="shop-title">皮肤商店</h2>
        <div className="shop-coins">
          <span className="coins-icon">🪙</span>
          <span className="coins-value">{coins}</span>
        </div>
      </div>
      <div className="shop-grid">
        {Object.values(SKINS).map((skin) => (
          <div
            key={skin.id}
            className={`skin-card ${equippedSkin === skin.id ? 'equipped' : ''} ${!canAfford(skin.price) && !ownedSkins.includes(skin.id) ? 'locked' : ''}`}
          >
            <div className="skin-preview" style={{ background: skin.bg, borderColor: skin.accent }}>
              <div className="skin-sample" style={{ background: skin.accent }}></div>
            </div>
            <div className="skin-info">
              <h3 className="skin-name">{skin.name}</h3>
              <p className="skin-price">
                {skin.price === 0 ? '免费' : `🪙 ${skin.price}`}
              </p>
            </div>
            <button
              className={`skin-btn ${equippedSkin === skin.id ? 'equipped' : ''} ${!canAfford(skin.price) && !ownedSkins.includes(skin.id) ? 'disabled' : ''}`}
              onClick={() => handleAction(skin.id)}
              disabled={equippedSkin === skin.id || (!canAfford(skin.price) && !ownedSkins.includes(skin.id))}
            >
              {getButtonText(skin.id)}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
