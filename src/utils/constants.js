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

// V4: 分享式排行榜
export const STORAGE_SHARED = 'dsw_v4_shared'

// V6: 限时挑战模式
export const GAME_MODE_TIMED = 'timed'
export const STORAGE_BEST_TIMED = 'dsw_v6_best_timed'
export const TIMED_INITIAL_TIME = 60
export const TIMED_TIME_BONUS = 3
export const TIMED_SPEED_TIER_1 = 800
export const TIMED_SPEED_TIER_2 = 600
export const TIMED_SPEED_TIER_3 = 400
export const TIMED_SPEED_TIER_4 = 300

// V13: 高级速度档位 (无尽模式 5档)
export const ENDLESS_SPEED_TIER_1 = 1000
export const ENDLESS_SPEED_TIER_2 = 800
export const ENDLESS_SPEED_TIER_3 = 600
export const ENDLESS_SPEED_TIER_4 = 400
export const ENDLESS_SPEED_TIER_5 = 300

// V13: 高级速度档位 (剧情模式 3档)
export const STORY_SPEED_TIER_1 = 800
export const STORY_SPEED_TIER_2 = 600
export const STORY_SPEED_TIER_3 = 400

// V3: 金币获取
export const COINS_DAILY_FIRST = 30
export const COINS_STREAK_BONUS = 50
export const COINS_STREAK_THRESHOLD = 3

// V3: 皮肤商店 (向后兼容，简化为block类)
export const SKINS = {
  default: { id: 'default', name: '经典', price: 0, bg: '#1a1a2e', accent: '#64c8ff' },
  neon: { id: 'neon', name: '霓虹', price: 100, bg: '#0a0a1a', accent: '#ff00ff' },
  minimal: { id: 'minimal', name: '简约', price: 80, bg: '#f5f5f5', accent: '#333333' },
  cyber: { id: 'cyber', name: '赛博', price: 150, bg: '#001122', accent: '#00ffff' }
}

// V11: 扩展皮肤系统 (完整10种皮肤)
export { SKINS as EXTENDED_SKINS, SKIN_TYPES, SKIN_RARITIES, RARITY_COLORS, RARITY_NAMES, SKIN_TABS, applySkinCSS } from './skins'

// V3: 关卡定义
export const LEVELS = [
  { id: 'time60', name: '限时60秒', rule: '60秒倒计时', passScore: 30, unlock: null },
  { id: 'speed', name: '极速模式', rule: '速度×2', passScore: 20, unlock: 'time60' },
  { id: 'pure', name: '纯净模式', rule: '无道具', passScore: 25, unlock: 'time60' },
  { id: 'survival', name: '生死局', rule: '1命+白块从2开始', passScore: 15, unlock: 'speed' },
  { id: 'slow', name: '巨慢模式', rule: '速度×0.5', passScore: 40, unlock: 'pure' },
  { id: 'endless', name: '无限模式', rule: '无命限制', passScore: null, unlock: 'survival' }
]

// V18: 排行榜 Pro - 预置全球玩家数据
export const MOCK_GLOBAL_PLAYERS = [
  { id: 1, nickname: '🏆 巅峰王者', score: 4987, date: '2026-04-28' },
  { id: 2, nickname: '🎮 游戏达人', score: 4652, date: '2026-04-27' },
  { id: 3, nickname: '⚡ 闪电侠', score: 4398, date: '2026-04-29' },
  { id: 4, nickname: '🎯 神射手', score: 4103, date: '2026-04-25' },
  { id: 5, nickname: '🔥 烈焰战神', score: 3987, date: '2026-04-26' },
  { id: 6, nickname: '❄️ 冰霜之王', score: 3754, date: '2026-04-24' },
  { id: 7, nickname: '🌙 暗夜骑士', score: 3621, date: '2026-04-23' },
  { id: 8, nickname: '☀️ 光明使者', score: 3487, date: '2026-04-22' },
  { id: 9, nickname: '🌊 海浪之声', score: 3354, date: '2026-04-21' },
  { id: 10, nickname: '🌲 森林精灵', score: 3201, date: '2026-04-20' },
  { id: 11, nickname: '⛰️ 山巅勇者', score: 3098, date: '2026-04-19' },
  { id: 12, nickname: '🌈 彩虹之魂', score: 2987, date: '2026-04-18' },
  { id: 13, nickname: '⭐ 星际旅者', score: 2854, date: '2026-04-17' },
  { id: 14, nickname: '🎪 马戏团之星', score: 2741, date: '2026-04-16' },
  { id: 15, nickname: '🎨 色彩大师', score: 2623, date: '2026-04-15' },
  { id: 16, nickname: '🎭 影子戏法', score: 2514, date: '2026-04-14' },
  { id: 17, nickname: '🎵 音律精灵', score: 2398, date: '2026-04-13' },
  { id: 18, nickname: '🔮 预言家', score: 2287, date: '2026-04-12' },
  { id: 19, nickname: '🗡️ 剑客', score: 2154, date: '2026-04-11' },
  { id: 20, nickname: '🛡️ 守护者', score: 2032, date: '2026-04-10' }
]

// V18: 排行榜 Pro - localStorage Keys
export const STORAGE_FRIENDS = 'dsw_v18_friends'
export const STORAGE_FRIEND_CACHE = 'dsw_v18_cache'
export const STORAGE_GLOBAL = 'dsw_v18_global'

// V18: 游戏模式标识
export const GAME_MODE_ENDLESS = 'endless'
export const GAME_MODE_STORY = 'story'
export const GAME_MODE_DAILY = 'daily'
