# 别踩白块（Don't Step on White）

经典钢琴块玩法的 Web + PWA 游戏。

**访问地址**: https://yeluo45.github.io/dont-step-white/

## V2 新功能

### 🏃 无尽模式
- **逐渐增多的白块** — 游戏开始每行1个白块，随分数增加白块数量逐渐增多（1→2→3...，最多3个）
- **命机制** — 初始3条命，踩白块扣1命，漏踩黑块扣1命，3命全失游戏结束
- **指数加速** — 速度随分数指数递增（800ms→180ms下限），每5分加速一次
- **Combo计分** — 连续踩中黑块 combo×2 加分，断则清零

### 🎁 道具系统
| 道具 | 图标 | 效果 |
|------|------|------|
| 护盾 Shield | 🛡️ | 下一次踩中白块不扣命 |
| 冰冻 Freeze | ❄️ | 3秒内所有白块暂停下落 |
| 双倍得分 Double | ✖️2 | 接下来5次踩块得分×2 |

- 30%概率在分数达到10/20/30...时掉落
- PC按 **D键** 使用，移动端**点击图标**使用
- 屏幕顶部显示当前持有道具（最多1个）

### 🎮 UI改动
- **左上角** — 分数 + Combo连击显示
- **右上角** — 3颗心形生命值
- **游戏结束** — 3字符昵称输入 + 3按钮（重新开始/返回主页/分享）

## 功能特性

- **经典钢琴块玩法** — 4列8行网格，黑块逐行下落
- **操作方式** — PC：← → 移动，空格/点击踩下；移动：左右滑动，点击踩下
- **历史最高分** — localStorage 持久化记录（dsw_v2_best）
- **暂停功能** — P 键暂停/继续
- **音效反馈** — 踩黑块音（800→1200Hz 上升音）、失败音（锯齿波下降音）
- **PWA 支持** — 可安装到 Android/iOS 主屏幕
- **离线缓存** — Service Worker 无网可玩

## 项目结构

```
dont-step-white/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Cell.jsx/.css      # 单个格子（黑/白/空）
│   │   ├── Controls.jsx/.css  # 底部控制栏（←/→/踩/暂停）
│   │   ├── Game.jsx/.css      # 游戏主容器，键盘/触摸事件
│   │   ├── GameOver.jsx/.css # 游戏结束画面（V2: 昵称+3按钮）
│   │   ├── Grid.jsx/.css      # 4×8 网格渲染
│   │   └── ScoreBoard.jsx/.css # 分数显示（V2: 含Combo）
│   ├── hooks/
│   │   ├── useAudio.js        # Web Audio API 音效
│   │   ├── useGame.js         # V2 游戏核心逻辑（无尽+道具）
│   │   └── useStorage.js      # localStorage 持久化
│   ├── utils/
│   │   └── constants.js        # V2 游戏常量
│   ├── App.jsx
│   └── main.jsx
├── vite.config.js
└── package.json
```

## 本地运行

```bash
npm install
npm run dev    # 开发模式 http://localhost:5173/dont-step-white/
npm run build # 生产构建
```

## 部署说明

项目已部署至 GitHub Pages（gh-pages 分支）。通过 GitHub Actions 自动构建推送，每次 master 分支更新后自动部署。

## 技术栈

- React 18 + Vite 5
- vite-plugin-pwa（Service Worker + Web App Manifest）
- Web Audio API 音效
- localStorage 持久化
