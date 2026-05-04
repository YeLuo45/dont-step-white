import React, { useMemo } from 'react'
import { useStats } from '../hooks/useStats'
import './Stats.css'

const PIE_COLORS = ['#4ade80', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa', '#34d399', '#f87171', '#38bdf8']

export function Stats({ onBack }) {
  const {
    stats,
    getModeTimeDistribution,
    getWeeklyActivity,
    getModeName,
    getAverageScore,
    getAverageTime,
    getAverageCombo,
    resetStats
  } = useStats()

  const modeDistribution = useMemo(() => getModeTimeDistribution(), [getModeTimeDistribution])
  const weeklyActivity = useMemo(() => getWeeklyActivity(), [getWeeklyActivity])

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}秒`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs > 0 ? `${mins}分${secs}秒` : `${mins}分钟`
  }

  const handleReset = () => {
    if (window.confirm('确定要重置所有统计数据吗？此操作不可撤销。')) {
      resetStats()
    }
  }

  // 计算环形图尺寸
  const pieSize = 140
  const strokeWidth = 24
  const radius = (pieSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = pieSize / 2

  // 计算每个扇形的 stroke-dasharray
  let accumulatedPercent = 0
  const pieSlices = modeDistribution.map((item, index) => {
    const percent = item.percentage / 100
    const dashLength = circumference * percent
    const dashOffset = circumference * (1 - accumulatedPercent)
    accumulatedPercent += percent
    return {
      ...item,
      dashArray: `${dashLength} ${circumference}`,
      dashOffset: -dashOffset + circumference * 0.25, // 从顶部开始
      color: PIE_COLORS[index % PIE_COLORS.length]
    }
  })

  // 柱状图最大值
  const maxGames = Math.max(...weeklyActivity.map(d => d.games), 1)

  return (
    <div className="stats">
      <h2 className="stats-title">📊 数据统计</h2>
      
      {/* 基础统计卡片 */}
      <div className="stats-section">
        <div className="stats-section-title">基础统计</div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalGames}</div>
            <div className="stat-label">总游戏次数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatTime(stats.totalTime)}</div>
            <div className="stat-label">总游戏时长</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{getAverageScore()}</div>
            <div className="stat-label">平均得分</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{getAverageCombo()}</div>
            <div className="stat-label">平均连击</div>
          </div>
        </div>
      </div>

      {/* 里程碑记录 */}
      <div className="stats-section">
        <div className="stats-section-title">里程碑记录</div>
        <div className="milestone-list">
          <div className="milestone-item">
            <span className="milestone-icon">🏆</span>
            <span className="milestone-label">最高分</span>
            <span className="milestone-value">{stats.bestScore}</span>
          </div>
          <div className="milestone-item">
            <span className="milestone-icon">⚡</span>
            <span className="milestone-label">最高连击</span>
            <span className="milestone-value">{stats.bestCombo}</span>
          </div>
          <div className="milestone-item">
            <span className="milestone-icon">⏱️</span>
            <span className="milestone-label">最长存活</span>
            <span className="milestone-value">{formatTime(stats.longestSurvival)}</span>
          </div>
        </div>
      </div>

      {/* 模式分布 */}
      <div className="stats-section">
        <div className="stats-section-title">模式分布</div>
        
        {/* 环形图 */}
        {modeDistribution.length > 0 ? (
          <div className="pie-chart-container">
            <svg width={pieSize} height={pieSize} className="pie-chart">
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#333"
                strokeWidth={strokeWidth}
              />
              {pieSlices.map((slice, index) => (
                <circle
                  key={slice.mode}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={slice.dashArray}
                  strokeDashoffset={slice.dashOffset}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${center} ${center})`}
                  className="pie-slice"
                />
              ))}
              <text x={center} y={center} textAnchor="middle" dominantBaseline="middle" className="pie-center-text">
                {modeDistribution.length}
              </text>
              <text x={center} y={center + 16} textAnchor="middle" className="pie-center-subtext">
                模式
              </text>
            </svg>
            
            {/* 图例 */}
            <div className="pie-legend">
              {pieSlices.map((slice, index) => (
                <div key={slice.mode} className="legend-item">
                  <span className="legend-color" style={{ background: slice.color }} />
                  <span className="legend-mode">{getModeName(slice.mode)}</span>
                  <span className="legend-percent">{slice.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-data">暂无数据</div>
        )}

        {/* 模式详情 */}
        {Object.keys(stats.modeStats).length > 0 && (
          <div className="mode-list">
            {Object.entries(stats.modeStats).map(([mode, data]) => (
              <div key={mode} className="mode-item">
                <div className="mode-header">
                  <span className="mode-name">{getModeName(mode)}</span>
                  <span className="mode-games">游玩 {data.games} 次</span>
                </div>
                <div className="mode-stats">
                  <span>最高分: {data.bestScore}</span>
                  <span>最高连击: {data.bestCombo}</span>
                  <span>总时长: {formatTime(data.totalTime)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7日活跃趋势 */}
      <div className="stats-section">
        <div className="stats-section-title">7日活跃趋势</div>
        <div className="bar-chart-container">
          {weeklyActivity.map((day, index) => (
            <div key={day.date} className="bar-item">
              <div className="bar-value">{day.games > 0 ? `${day.games}局` : '-'}</div>
              <div className="bar-wrapper">
                <div 
                  className="bar" 
                  style={{ 
                    height: `${(day.games / maxGames) * 100}%`,
                    background: day.games > 0 
                      ? `linear-gradient(180deg, #4ade80, #22c55e)` 
                      : '#333'
                  }}
                />
              </div>
              <div className="bar-label">{day.shortDate}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 重置按钮 */}
      <button className="stats-reset-btn" onClick={handleReset}>
        重置统计数据
      </button>

      {/* 返回按钮 */}
      <button className="stats-back-btn" onClick={onBack}>
        返回主页
      </button>
    </div>
  )
}
