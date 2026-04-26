# 别踩白块（Don't Step on White）

经典钢琴块玩法的 Web + PWA 游戏。

**访问地址**: https://yeluo45.github.io/dont-step-white/

## 功能特性

- **经典钢琴块玩法** — 4列8行网格，黑块逐行下落
- **操作方式** — PC：← → 移动，空格/点击踩下；移动：左右滑动，点击踩下
- **分数系统** — 成功踩黑块 +1 分，速度随分数递增
- **历史最高分** — localStorage 持久化记录
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
│   │   ├── GameOver.jsx/.css # 游戏结束画面
│   │   ├── Grid.jsx/.css      # 4×8 网格渲染
│   │   └── ScoreBoard.jsx/.css # 分数显示
│   ├── hooks/
│   │   ├── useAudio.js        # Web Audio API 音效
│   │   ├── useGame.js         # 游戏核心逻辑（网格生成/移动/碰撞）
│   │   └── useStorage.js      # localStorage 持久化
│   ├── utils/
│   │   └── constants.js        # 游戏常量（速度/行列/状态）
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
