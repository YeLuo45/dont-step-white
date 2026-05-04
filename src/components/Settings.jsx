import React, { useState, useEffect } from 'react'
import { useAudio } from '../hooks/useAudio'
import './Settings.css'

export function Settings({ soundEnabled, onSoundToggle, onClearData, onBack }) {
  const { getSettings, updateSettings, refreshSettings, playClick } = useAudio()
  const [showConfirm, setShowConfirm] = useState(false)
  const [localSettings, setLocalSettings] = useState({
    soundEnabled: true,
    bgmEnabled: true,
    soundVolume: 0.7,
    bgmVolume: 0.4
  })

  // Load settings on mount
  useEffect(() => {
    refreshSettings()
    const settings = getSettings()
    setLocalSettings({
      soundEnabled: settings.soundEnabled,
      bgmEnabled: settings.bgmEnabled,
      soundVolume: settings.soundVolume,
      bgmVolume: settings.bgmVolume
    })
  }, [getSettings, refreshSettings])

  const handleSoundToggle = () => {
    playClick()
    const newValue = !localSettings.soundEnabled
    setLocalSettings(prev => ({ ...prev, soundEnabled: newValue }))
    updateSettings({ soundEnabled: newValue })
    if (onSoundToggle) {
      onSoundToggle(newValue)
    }
  }

  const handleBgmToggle = () => {
    playClick()
    const newValue = !localSettings.bgmEnabled
    setLocalSettings(prev => ({ ...prev, bgmEnabled: newValue }))
    updateSettings({ bgmEnabled: newValue })
  }

  const handleSoundVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setLocalSettings(prev => ({ ...prev, soundVolume: newVolume }))
    updateSettings({ soundVolume: newVolume })
  }

  const handleBgmVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setLocalSettings(prev => ({ ...prev, bgmVolume: newVolume }))
    updateSettings({ bgmVolume: newVolume })
  }

  const handleClear = () => {
    playClick()
    onClearData()
    setShowConfirm(false)
  }

  const handleBack = () => {
    playClick()
    onBack()
  }

  const handleShowConfirm = () => {
    playClick()
    setShowConfirm(true)
  }

  const handleCancelConfirm = () => {
    playClick()
    setShowConfirm(false)
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <button className="back-btn" onClick={handleBack}>← 返回</button>
        <h2 className="settings-title">设置</h2>
        <div style={{ width: 60 }}></div>
      </div>

      <div className="settings-list">
        {/* Sound Effects Toggle */}
        <div className="settings-item">
          <span className="settings-label">音效</span>
          <button
            className={`toggle-btn ${localSettings.soundEnabled ? 'on' : ''}`}
            onClick={handleSoundToggle}
          >
            {localSettings.soundEnabled ? '开' : '关'}
          </button>
        </div>

        {/* Sound Volume Slider */}
        {localSettings.soundEnabled && (
          <div className="settings-item volume-item">
            <span className="settings-label">音效音量</span>
            <input
              type="range"
              className="volume-slider"
              min="0"
              max="1"
              step="0.1"
              value={localSettings.soundVolume}
              onChange={handleSoundVolumeChange}
            />
            <span className="volume-value">{Math.round(localSettings.soundVolume * 100)}%</span>
          </div>
        )}

        {/* BGM Toggle */}
        <div className="settings-item">
          <span className="settings-label">背景音乐</span>
          <button
            className={`toggle-btn ${localSettings.bgmEnabled ? 'on' : ''}`}
            onClick={handleBgmToggle}
          >
            {localSettings.bgmEnabled ? '开' : '关'}
          </button>
        </div>

        {/* BGM Volume Slider */}
        {localSettings.bgmEnabled && (
          <div className="settings-item volume-item">
            <span className="settings-label">BGM音量</span>
            <input
              type="range"
              className="volume-slider"
              min="0"
              max="1"
              step="0.1"
              value={localSettings.bgmVolume}
              onChange={handleBgmVolumeChange}
            />
            <span className="volume-value">{Math.round(localSettings.bgmVolume * 100)}%</span>
          </div>
        )}

        <div className="settings-item danger">
          <span className="settings-label">清除数据</span>
          <button
            className="danger-btn"
            onClick={handleShowConfirm}
          >
            慎用
          </button>
        </div>

        {showConfirm && (
          <div className="confirm-dialog">
            <p>确定要清除所有数据吗？</p>
            <p className="confirm-warning">这将删除金币、皮肤、关卡进度！</p>
            <div className="confirm-buttons">
              <button className="confirm-cancel" onClick={handleCancelConfirm}>取消</button>
              <button className="confirm-ok" onClick={handleClear}>确认清除</button>
            </div>
          </div>
        )}
      </div>

      <div className="settings-footer">
        <p>别踩白块 V7</p>
      </div>
    </div>
  )
}