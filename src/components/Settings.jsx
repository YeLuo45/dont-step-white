import React, { useState } from 'react'
import './Settings.css'

export function Settings({ soundEnabled, onSoundToggle, onClearData, onBack }) {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleClear = () => {
    onClearData()
    setShowConfirm(false)
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <h2 className="settings-title">设置</h2>
        <div style={{ width: 60 }}></div>
      </div>

      <div className="settings-list">
        <div className="settings-item">
          <span className="settings-label">音效</span>
          <button
            className={`toggle-btn ${soundEnabled ? 'on' : ''}`}
            onClick={onSoundToggle}
          >
            {soundEnabled ? '开' : '关'}
          </button>
        </div>

        <div className="settings-item danger">
          <span className="settings-label">清除数据</span>
          <button
            className="danger-btn"
            onClick={() => setShowConfirm(true)}
          >
            慎用
          </button>
        </div>

        {showConfirm && (
          <div className="confirm-dialog">
            <p>确定要清除所有数据吗？</p>
            <p className="confirm-warning">这将删除金币、皮肤、关卡进度！</p>
            <div className="confirm-buttons">
              <button className="confirm-cancel" onClick={() => setShowConfirm(false)}>取消</button>
              <button className="confirm-ok" onClick={handleClear}>确认清除</button>
            </div>
          </div>
        )}
      </div>

      <div className="settings-footer">
        <p>别踩白块 V3</p>
      </div>
    </div>
  )
}
