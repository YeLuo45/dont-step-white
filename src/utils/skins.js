// V11: 皮肤商店 - 10种内置皮肤
// 类型: block(格子) / background(背景) / effect(特效) / cursor(指示器)
// 等级: free(免费) / common(普通) / rare(稀有) / legendary(传说)

// CSS变量说明:
// --skin-block: 黑块颜色
// --skin-bg: 背景色
// --skin-accent: 强调色
// --skin-effect: 特效颜色
// --skin-cursor: 指示器颜色

export const SKIN_TYPES = {
  BLOCK: 'block',      // 格子
  BACKGROUND: 'background', // 背景
  EFFECT: 'effect',    // 特效
  CURSOR: 'cursor'     // 指示器
}

export const SKIN_RARITIES = {
  FREE: 'free',        // 免费
  COMMON: 'common',    // 普通
  RARE: 'rare',         // 稀有
  LEGENDARY: 'legendary' // 传说
}

export const RARITY_COLORS = {
  free: '#9ca3af',      // 灰色
  common: '#22c55e',    // 绿色
  rare: '#3b82f6',      // 蓝色
  legendary: '#f59e0b'  // 金色
}

export const RARITY_NAMES = {
  free: '免费',
  common: '普通',
  rare: '稀有',
  legendary: '传说'
}

export const SKINS = {
  // === 格子类 (block) ===
  classic: {
    id: 'classic',
    name: '经典',
    type: SKIN_TYPES.BLOCK,
    rarity: SKIN_RARITIES.FREE,
    price: 0,
    description: '经典配色，永不过时',
    block: '#64c8ff',
    bg: '#1a1a2e',
    accent: '#64c8ff',
    effect: '#64c8ff',
    cursor: '#64c8ff'
  },
  neon: {
    id: 'neon',
    name: '霓虹炫彩',
    type: SKIN_TYPES.BLOCK,
    rarity: SKIN_RARITIES.COMMON,
    price: 100,
    description: '赛博朋克风格，霓虹灯光',
    block: '#ff00ff',
    bg: '#0a0a1a',
    accent: '#ff00ff',
    effect: '#00ffff',
    cursor: '#ff00ff'
  },
  forest: {
    id: 'forest',
    name: '森林绿意',
    type: SKIN_TYPES.BLOCK,
    rarity: SKIN_RARITIES.COMMON,
    price: 120,
    description: '清新自然的绿色主题',
    block: '#22c55e',
    bg: '#0f1f0f',
    accent: '#22c55e',
    effect: '#86efac',
    cursor: '#22c55e'
  },

  // === 背景类 (background) ===
  galaxy: {
    id: 'galaxy',
    name: '银河星空',
    type: SKIN_TYPES.BACKGROUND,
    rarity: SKIN_RARITIES.RARE,
    price: 200,
    description: '深邃星空，浩瀚银河',
    block: '#818cf8',
    bg: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    accent: '#818cf8',
    effect: '#c4b5fd',
    cursor: '#818cf8'
  },
  sunset: {
    id: 'sunset',
    name: '落日余晖',
    type: SKIN_TYPES.BACKGROUND,
    rarity: SKIN_RARITIES.RARE,
    price: 220,
    description: '温暖夕阳，橙红渐变',
    block: '#f97316',
    bg: 'linear-gradient(135deg, #1a1a2e, #4a1942, #1a1a2e)',
    accent: '#f97316',
    effect: '#fdba74',
    cursor: '#fb923c'
  },
  ocean: {
    id: 'ocean',
    name: '深海蓝调',
    type: SKIN_TYPES.BACKGROUND,
    rarity: SKIN_RARITIES.RARE,
    price: 180,
    description: '神秘海洋，深邃宁静',
    block: '#06b6d4',
    bg: 'linear-gradient(135deg, #0c4a6e, #155e75, #0f172a)',
    accent: '#06b6d4',
    effect: '#67e8f9',
    cursor: '#22d3ee'
  },

  // === 特效类 (effect) ===
  rainbow: {
    id: 'rainbow',
    name: '彩虹光效',
    type: SKIN_TYPES.EFFECT,
    rarity: SKIN_RARITIES.LEGENDARY,
    price: 500,
    description: '五彩斑斓，彩虹特效',
    block: '#ef4444',
    bg: '#1a1a2e',
    accent: '#f59e0b',
    effect: 'linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6)',
    cursor: '#f59e0b'
  },
  aurora: {
    id: 'aurora',
    name: '极光之舞',
    type: SKIN_TYPES.EFFECT,
    rarity: SKIN_RARITIES.LEGENDARY,
    price: 600,
    description: '绚丽极光，北欧风情',
    block: '#10b981',
    bg: '#0a192f',
    accent: '#10b981',
    effect: 'linear-gradient(135deg, #10b981, #06b6d4, #8b5cf6)',
    cursor: '#34d399'
  },

  // === 指示器类 (cursor) ===
  gold: {
    id: 'gold',
    name: '金色指针',
    type: SKIN_TYPES.CURSOR,
    rarity: SKIN_RARITIES.COMMON,
    price: 150,
    description: '尊贵金色，华丽指针',
    block: '#eab308',
    bg: '#1a1a2e',
    accent: '#eab308',
    effect: '#fde047',
    cursor: '#facc15'
  },
  crystal: {
    id: 'crystal',
    name: '水晶之芒',
    type: SKIN_TYPES.CURSOR,
    rarity: SKIN_RARITIES.RARE,
    price: 280,
    description: '晶莹剔透，璀璨水晶',
    block: '#a78bfa',
    bg: '#1e1b4b',
    accent: '#a78bfa',
    effect: '#c4b5fd',
    cursor: '#8b5cf6'
  }
}

// 获取皮肤分类标签
export const SKIN_TABS = [
  { key: 'all', name: '全部' },
  { key: SKIN_TYPES.BLOCK, name: '格子' },
  { key: SKIN_TYPES.BACKGROUND, name: '背景' },
  { key: SKIN_TYPES.EFFECT, name: '特效' },
  { key: SKIN_TYPES.CURSOR, name: '指示器' }
]

// 应用皮肤CSS变量到根元素
export function applySkinCSS(skinId) {
  const skin = SKINS[skinId] || SKINS.classic
  const root = document.documentElement

  root.style.setProperty('--skin-block', skin.block)
  root.style.setProperty('--skin-bg', skin.bg)
  root.style.setProperty('--skin-accent', skin.accent)
  root.style.setProperty('--skin-effect', typeof skin.effect === 'string' && skin.effect.includes('gradient') ? skin.effect : skin.effect)
  root.style.setProperty('--skin-cursor', skin.cursor)

  // 如果是渐变背景，应用到body
  if (typeof skin.bg === 'string' && skin.bg.includes('gradient')) {
    document.body.style.background = skin.bg
  } else {
    document.body.style.background = skin.bg
  }
}
