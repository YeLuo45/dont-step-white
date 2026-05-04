// 操作模式常量
export const CONTROL_MODES = {
  TOUCH: 'touch',           // 触控：点击移动+踩下
  SWIPE: 'swipe',           // 滑动手势：左右滑动移动，点击踩下
  GYROSCOPE: 'gyroscope'    // 陀螺仪：倾斜设备移动，点击踩下
}

// 速度档位定义
export const SPEED_TIERS = {
  ENDLESS: [
    { label: '1档', value: 1000 },
    { label: '2档', value: 800 },
    { label: '3档', value: 600 },
    { label: '4档', value: 400 },
    { label: '5档', value: 300 }
  ],
  TIMED: [
    { label: '1档', value: 800 },
    { label: '2档', value: 600 },
    { label: '3档', value: 400 }
  ],
  STORY: [
    { label: '1档', value: 800 },
    { label: '2档', value: 600 },
    { label: '3档', value: 400 }
  ]
}

// 辅助功能模式
export const ACCESSIBILITY_MODES = {
  COLOR_FILTER: 'colorFilter',     // 颜色滤镜
  COLORBLIND_MODE: 'colorblind',    // 色盲模式
  HIGH_CONTRAST: 'highContrast'     // 高对比度
}

// localStorage key
export const STORAGE_ADVANCED_SETTINGS = 'dsw_v13_advanced_settings'

// 默认高级设置
export const DEFAULT_ADVANCED_SETTINGS = {
  // 操作模式
  controlMode: CONTROL_MODES.TOUCH,
  sensitivity: 50,  // 0-100，默认50
  
  // 速度设置（各模式独立）
  speedEndless: 2,     // 无尽模式档位索引（0-4）
  speedTimed: 1,        // 限时模式档位索引（0-2）
  speedStory: 1,        // 剧情模式档位索引（0-2）
  
  // 辅助功能
  colorFilter: false,
  colorblindMode: false,
  highContrast: false,
  
  // 震动反馈
  vibrationEnabled: true,
  
  // 自动存档
  autoSaveEnabled: true
}

// 获取速度值（根据模式和档位）
export function getSpeedForMode(mode, tierIndex) {
  const tiers = SPEED_TIERS[mode.toUpperCase()] || SPEED_TIERS.ENDLESS
  const index = Math.min(Math.max(0, tierIndex), tiers.length - 1)
  return tiers[index].value
}

// 滑动手势检测
export class SwipeGestureDetector {
  constructor(onSwipe, sensitivity = 50) {
    this.onSwipe = onSwipe
    this.sensitivity = sensitivity // 0-100
    this.touchStartX = null
    this.touchStartY = null
    this.minSwipeDistance = Math.round(30 + (100 - sensitivity) * 0.3) // 30-60px
  }
  
  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX
    this.touchStartY = e.touches[0].clientY
  }
  
  handleTouchEnd(e) {
    if (this.touchStartX === null) return
    
    const diffX = e.changedTouches[0].clientX - this.touchStartX
    const diffY = e.changedTouches[0].clientY - this.touchStartY
    
    // 只识别水平滑动（水平距离大于垂直距离）
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > this.minSwipeDistance) {
      this.onSwipe(diffX < 0 ? 'left' : 'right')
    }
    
    this.touchStartX = null
    this.touchStartY = null
  }
  
  updateSensitivity(sensitivity) {
    this.sensitivity = sensitivity
    this.minSwipeDistance = Math.round(30 + (100 - sensitivity) * 0.3)
  }
}

// 陀螺仪检测
export class GyroscopeDetector {
  constructor(onTilt, sensitivity = 50) {
    this.onTilt = onTilt
    this.sensitivity = sensitivity
    this.gamma = 0 // 左右倾斜角度
    this.threshold = Math.round(10 + (100 - sensitivity) * 0.2) // 10-30度
    this.lastTilt = null
    this.tiltDebounce = 150 // ms
    this.lastTiltTime = 0
  }
  
  start() {
    if (typeof DeviceOrientationEvent !== 'undefined') {
      // 检查是否需要请求权限（iOS 13+）
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // 需要用户触发请求权限
        return 'permission_required'
      }
      window.addEventListener('deviceorientation', this.handleOrientation.bind(this))
      return 'active'
    }
    return 'not_supported'
  }
  
  stop() {
    window.removeEventListener('deviceorientation', this.handleOrientation.bind(this))
  }
  
  handleOrientation(event) {
    this.gamma = event.gamma || 0 // 左右倾斜 -90 到 90
    
    const now = Date.now()
    if (now - this.lastTiltTime < this.tiltDebounce) return
    
    if (Math.abs(this.gamma) > this.threshold) {
      const direction = this.gamma < 0 ? 'left' : 'right'
      if (direction !== this.lastTilt) {
        this.lastTilt = direction
        this.lastTiltTime = now
        this.onTilt(direction)
      }
    } else {
      this.lastTilt = null
    }
  }
  
  updateSensitivity(sensitivity) {
    this.sensitivity = sensitivity
    this.threshold = Math.round(10 + (100 - sensitivity) * 0.2)
  }
}

// 震动反馈
export function triggerVibration(pattern = [50]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

// 读取高级设置
export function loadAdvancedSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_ADVANCED_SETTINGS)
    if (stored) {
      return { ...DEFAULT_ADVANCED_SETTINGS, ...JSON.parse(stored) }
    }
  } catch (e) {
    console.warn('Failed to load advanced settings:', e)
  }
  return DEFAULT_ADVANCED_SETTINGS
}

// 保存高级设置
export function saveAdvancedSettings(settings) {
  try {
    localStorage.setItem(STORAGE_ADVANCED_SETTINGS, JSON.stringify(settings))
  } catch (e) {
    console.warn('Failed to save advanced settings:', e)
  }
}
