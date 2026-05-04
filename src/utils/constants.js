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
