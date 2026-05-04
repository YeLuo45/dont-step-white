// 游戏常量
export const COLS = 4
export const ROWS = 8
export const INITIAL_SPEED = 800
export const MIN_SPEED = 180
export const SPEED_INCREASE_INTERVAL = 5
export const SPEED_INCREASE_RATE = 0.88

export const CELL_EMPTY = 0
export const CELL_WHITE = 1
export const CELL_BLACK = 2

export const GAME_STATE_IDLE = 'idle'
export const GAME_STATE_PLAYING = 'playing'
export const GAME_STATE_PAUSED = 'paused'
export const GAME_STATE_GAME_OVER = 'gameover'

// V2: 无尽模式
export const INITIAL_LIVES = 3
export const MAX_WHITE_BLOCKS_BASE = 1
export const MAX_WHITE_BLOCKS_INCREMENT = 1
export const MAX_WHITE_BLOCKS_INTERVAL = 8

// V2: 道具系统
export const POWERUP_SHIELD = 'shield'
export const POWERUP_FREEZE = 'freeze'
export const POWERUP_DOUBLE = 'double'
export const POWERUP_DROP_CHANCE = 0.3
export const POWERUP_FREEZE_DURATION = 3000
export const POWERUP_DOUBLE_COUNT = 5
export const STORAGE_BEST = 'dsw_v2_best'

// V3: 金币经济系统
export const STORAGE_COINS = 'dsw_v3_coins'
export const STORAGE_EQUIPPED = 'dsw_v3_equipped'
export const STORAGE_OWNED = 'dsw_v3_owned'
export const STORAGE_PROGRESS = 'dsw_v3_progress'

// V3: 金币获取
export const COINS_DAILY_FIRST = 30
export const COINS_STREAK_BONUS = 50
export const COINS_STREAK_THRESHOLD = 3

// V3: 皮肤商店
export const SKINS = {
  default: { id: 'default', name: '经典', price: 0, bg: '#1a1a2e', accent: '#64c8ff' },
  neon: { id: 'neon', name: '霓虹', price: 100, bg: '#0a0a1a', accent: '#ff00ff' },
  minimal: { id: 'minimal', name: '简约', price: 80, bg: '#f5f5f5', accent: '#333333' },
  cyber: { id: 'cyber', name: '赛博', price: 150, bg: '#001122', accent: '#00ffff' }
}

// V3: 关卡定义
export const LEVELS = [
  { id: 'time60', name: '限时60秒', rule: '60秒倒计时', passScore: 30, unlock: null },
  { id: 'speed', name: '极速模式', rule: '速度×2', passScore: 20, unlock: 'time60' },
  { id: 'pure', name: '纯净模式', rule: '无道具', passScore: 25, unlock: 'time60' },
  { id: 'survival', name: '生死局', rule: '1命+白块从2开始', passScore: 15, unlock: 'speed' },
  { id: 'slow', name: '巨慢模式', rule: '速度×0.5', passScore: 40, unlock: 'pure' },
  { id: 'endless', name: '无限模式', rule: '无命限制', passScore: null, unlock: 'survival' }
]
