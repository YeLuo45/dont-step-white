import React, { useState, useEffect } from 'react'
import { useV4Leaderboard, isShareExpired, formatShareDate } from '../hooks/useV4Leaderboard'
import { SKINS } from '../utils/constants'
import './Leaderboard.css'

export function Leaderboard({ 
  mode = 'my-records', // 'my-records' or 'view-shared'
  sharedData = null,   // data from URL when mode='view-shared'
  onPlay = null,
  onHome = null 
}) {
  const { 
    sharedRecords, 
    getMyBest, 
    getValidRecords,
    generateShareUrl 
  } = useV4Leaderboard()
  
  const [toast, setToast] = useState(null)
  const [copyLoading, setCopyLoading] = useState(false)

  const validRecords = getValidRecords()
  const myBest = getMyBest()

  // Show toast message
  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  // Copy URL to clipboard
  const handleCopyUrl = async (url) => {
    if (copyLoading) return
    setCopyLoading(true)
    try {
      await navigator.clipboard.writeText(url)
      showToast('已复制分享链接!')
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        showToast('已复制分享链接!')
      } catch (e) {
        showToast('复制失败，请手动复制')
      }
      document.body.removeChild(textArea)
    }
    setCopyLoading(false)
  }

  // Get skin name
  const getSkinName = (skinId) => {
    return SKINS[skinId]?.name || '经典'
  }

  // View shared mode - showing someone else's shared record
  if (mode === 'view-shared' && sharedData) {
    const expired = isShareExpired(sharedData.t)
    
    return (
      <div className="leaderboard">
        <div className="view-mode-card">
          <div className="view-mode-title">好友战绩</div>
          
          <div className="view-mode-nickname">{sharedData.n}</div>
          <div className="view-mode-skin">皮肤: {getSkinName(sharedData.sk)}</div>
          
          {expired && (
            <div className="view-mode-expired">⚠️ 此战绩已过期</div>
          )}
          
          <div className="view-mode-score">{sharedData.s}</div>
          <div className="view-mode-score-label">最终得分</div>
          
          <div className="view-mode-date">
            分享于 {formatShareDate(sharedData.t)}
          </div>
          
          <div className="view-mode-divider" />
          
          {myBest && (
            <div className="my-best-section">
              <div className="my-best-label">我的最高分</div>
              <div className="my-best-value">{myBest.score}</div>
            </div>
          )}
          
          <div className="view-mode-actions">
            <button className="leaderboard-btn play-btn" onClick={onPlay}>
              我也要玩!
            </button>
            <button className="leaderboard-btn home-btn" onClick={onHome}>
              返回主页
            </button>
          </div>
        </div>
        
        {toast && <div className="toast">{toast}</div>}
      </div>
    )
  }

  // My records mode - showing user's own shared history
  return (
    <div className="leaderboard">
      <h2 className="leaderboard-title">🏆 我的战绩</h2>
      <p className="leaderboard-subtitle">查看历史分享记录</p>
      
      {validRecords.length === 0 ? (
        <div className="empty-records">
          <p>暂无分享记录</p>
          <p style={{ marginTop: 8, fontSize: 12 }}>
            游戏结束后点击「分享」即可生成战绩链接
          </p>
        </div>
      ) : (
        <div className="leaderboard-section">
          <div className="leaderboard-section-title">
            历史分享 ({validRecords.length})
          </div>
          
          {validRecords.map((record, index) => {
            const expired = isShareExpired(record.t)
            return (
              <div 
                key={index} 
                className={`shared-record ${expired ? 'expired' : ''}`}
              >
                <div className="record-info">
                  <div className="record-nickname">
                    {record.n}
                    {expired && <span className="expired-badge">已过期</span>}
                  </div>
                  <div className="record-details">
                    <span>皮肤: {getSkinName(record.sk)}</span>
                  </div>
                </div>
                <div>
                  <div className={`record-score ${expired ? 'expired' : ''}`}>
                    {record.s}
                  </div>
                  <div className={`record-date ${expired ? 'expired' : ''}`}>
                    {formatShareDate(record.t)}
                  </div>
                </div>
                <div className="record-actions">
                  <button 
                    className="copy-btn" 
                    onClick={() => handleCopyUrl(record.url)}
                    disabled={copyLoading}
                  >
                    复制
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {myBest && (
        <div className="leaderboard-section">
          <div className="leaderboard-section-title">我的最高分</div>
          <div style={{ 
            fontSize: 32, 
            fontWeight: 'bold', 
            color: '#ffd700',
            fontFamily: "'Courier New', monospace"
          }}>
            {myBest.score}
          </div>
        </div>
      )}
      
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
