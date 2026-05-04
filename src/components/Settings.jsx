import React, { useState, useEffect } from 'react'
import { useAudio } from '../hooks/useAudio'
import './Settings.css'
import {
  CONTROL_MODES,
  SPEED_TIERS,
  ACCESSIBILITY_MODES,
  loadAdvancedSettings,
  saveAdvancedSettings,
  triggerVibration
} from '../utils/controlModes'

export function Settings({ soundEnabled, onSoundToggle, onClearData, onBack }) {
  const { getSettings, updateSettings, refreshSettings, playClick } = useAudio()
  const [showConfirm, setShowConfirm] = useState(false)
  const [localSettings, setLocalSettings] = useState({
    soundEnabled: true,
    bgmEnabled: true,
    soundVolume: 0.7,
    bgmVolume: 0.4
  })

  // V13: 高级设置状态
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [advancedSettings, setAdvancedSettings] = useState(loadAdvancedSettings)

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
    // V13: 加载高级设置
    setAdvancedSettings(loadAdvancedSettings())
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

  // V13: 高级设置处理器
  const handleAdvancedToggle = () => {
    playClick()
    if (advancedSettings.vibrationEnabled) triggerVibration([30])
    setAdvancedOpen(!advancedOpen)
  }

  const updateAdvanced = (key, value) => {
    const newSettings = { ...advancedSettings, [key]: value }
    setAdvancedSettings(newSettings)
    saveAdvancedSettings(newSettings)
    if (advancedSettings.vibrationEnabled) triggerVibration([20])
  }

  const handleControlModeChange = (mode) => {
    updateAdvanced('controlMode', mode)
  }

  const handleSensitivityChange = (e) => {
    updateAdvanced('sensitivity', parseInt(e.target.value))
  }

  const handleSpeedEndlessChange = (index) => {
    updateAdvanced('speedEndless', index)
  }

  const handleSpeedTimedChange = (index) => {
    updateAdvanced('speedTimed', index)
  }

  const handleSpeedStoryChange = (index) => {
    updateAdvanced('speedStory', index)
  }

  const handleVibrationToggle = () => {
    updateAdvanced('vibrationEnabled', !advancedSettings.vibrationEnabled)
  }

  const handleAutoSaveToggle = () => {
    updateAdvanced('autoSaveEnabled', !advancedSettings.autoSaveEnabled)
  }

  const handleColorFilterToggle = () => {
    updateAdvanced('colorFilter', !advancedSettings.colorFilter)
    // 应用颜色滤镜到body
    if (!advancedSettings.colorFilter) {
      document.body.classList.add('color-filter-active')
    } else {
      document.body.classList.remove('color-filter-active')
    }
  }

  const handleColorblindToggle = () => {
    updateAdvanced('colorblindMode', !advancedSettings.colorblindMode)
    if (!advancedSettings.colorblindMode) {
      document.body.classList.add('colorblind-mode-active')
    } else {
      document.body.classList.remove('colorblind-mode-active')
    }
  }

  const handleHighContrastToggle = () => {
    updateAdvanced('highContrast', !advancedSettings.highContrast)
    if (!advancedSettings.highContrast) {
      document.body.classList.add('high-contrast-active')
    } else {
      document.body.classList.remove('high-contrast-active')
    }
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

        {/* V13: 高级设置折叠面板 */}
        <div className="settings-item advanced-toggle" onClick={handleAdvancedToggle}>
          <span className="settings-label">⚙️ 高级设置</span>
          <span className={`toggle-btn ${advancedOpen ? 'on' : ''}`} style={{ pointerEvents: 'none' }}>
            {advancedOpen ? '收起' : '展开'}
          </span>
        </div>

        {advancedOpen && (
          <div className="advanced-panel">
            {/* 操作模式 */}
            <div className="advanced-section">
              <h4 className="advanced-section-title">操作模式</h4>
              <div className="control-mode-selector">
                <button
                  className={`mode-btn ${advancedSettings.controlMode === CONTROL_MODES.TOUCH ? 'active' : ''}`}
                  onClick={() => handleControlModeChange(CONTROL_MODES.TOUCH)}
                >
                  👆 触控
                </button>
                <button
                  className={`mode-btn ${advancedSettings.controlMode === CONTROL_MODES.SWIPE ? 'active' : ''}`}
                  onClick={() => handleControlModeChange(CONTROL_MODES.SWIPE)}
                >
                  👈👉 滑动
                </button>
                <button
                  className={`mode-btn ${advancedSettings.controlMode === CONTROL_MODES.GYROSCOPE ? 'active' : ''}`}
                  onClick={() => handleControlModeChange(CONTROL_MODES.GYROSCOPE)}
                >
                  📱 陀螺仪
                </button>
              </div>

              {/* 灵敏度调节 */}
              <div className="settings-item volume-item">
                <span className="settings-label">灵敏度</span>
                <input
                  type="range"
                  className="volume-slider"
                  min="0"
                  max="100"
                  step="10"
                  value={advancedSettings.sensitivity}
                  onChange={handleSensitivityChange}
                />
                <span className="volume-value">{advancedSettings.sensitivity}%</span>
              </div>
            </div>

            {/* 速度设置 */}
            <div className="advanced-section">
              <h4 className="advanced-section-title">速度设置</h4>

              {/* 无尽模式速度 */}
              <div className="speed-tier-selector">
                <span className="speed-tier-label">无尽模式</span>
                <div className="tier-buttons">
                  {SPEED_TIERS.ENDLESS.map((tier, idx) => (
                    <button
                      key={idx}
                      className={`tier-btn ${advancedSettings.speedEndless === idx ? 'active' : ''}`}
                      onClick={() => handleSpeedEndlessChange(idx)}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 限时模式速度 */}
              <div className="speed-tier-selector">
                <span className="speed-tier-label">限时挑战</span>
                <div className="tier-buttons">
                  {SPEED_TIERS.TIMED.map((tier, idx) => (
                    <button
                      key={idx}
                      className={`tier-btn ${advancedSettings.speedTimed === idx ? 'active' : ''}`}
                      onClick={() => handleSpeedTimedChange(idx)}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 剧情模式速度 */}
              <div className="speed-tier-selector">
                <span className="speed-tier-label">剧情模式</span>
                <div className="tier-buttons">
                  {SPEED_TIERS.STORY.map((tier, idx) => (
                    <button
                      key={idx}
                      className={`tier-btn ${advancedSettings.speedStory === idx ? 'active' : ''}`}
                      onClick={() => handleSpeedStoryChange(idx)}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 辅助功能 */}
            <div className="advanced-section">
              <h4 className="advanced-section-title">辅助功能</h4>
              <div className="settings-item">
                <span className="settings-label">颜色滤镜</span>
                <button
                  className={`toggle-btn ${advancedSettings.colorFilter ? 'on' : ''}`}
                  onClick={handleColorFilterToggle}
                >
                  {advancedSettings.colorFilter ? '开' : '关'}
                </button>
              </div>
              <div className="settings-item">
                <span className="settings-label">色盲模式</span>
                <button
                  className={`toggle-btn ${advancedSettings.colorblindMode ? 'on' : ''}`}
                  onClick={handleColorblindToggle}
                >
                  {advancedSettings.colorblindMode ? '开' : '关'}
                </button>
              </div>
              <div className="settings-item">
                <span className="settings-label">高对比度</span>
                <button
                  className={`toggle-btn ${advancedSettings.highContrast ? 'on' : ''}`}
                  onClick={handleHighContrastToggle}
                >
                  {advancedSettings.highContrast ? '开' : '关'}
                </button>
              </div>
            </div>

            {/* 其他设置 */}
            <div className="advanced-section">
              <h4 className="advanced-section-title">其他</h4>
              <div className="settings-item">
                <span className="settings-label">震动反馈</span>
                <button
                  className={`toggle-btn ${advancedSettings.vibrationEnabled ? 'on' : ''}`}
                  onClick={handleVibrationToggle}
                >
                  {advancedSettings.vibrationEnabled ? '开' : '关'}
                </button>
              </div>
              <div className="settings-item">
                <span className="settings-label">自动存档</span>
                <button
                  className={`toggle-btn ${advancedSettings.autoSaveEnabled ? 'on' : ''}`}
                  onClick={handleAutoSaveToggle}
                >
                  {advancedSettings.autoSaveEnabled ? '开' : '关'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="settings-footer">
        <p>别踩白块 V13</p>
      </div>
    </div>
  )
}