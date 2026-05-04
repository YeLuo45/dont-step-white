import React, { useState, useEffect, useCallback } from 'react'
import { useV4Leaderboard, encodeShareData, formatShareDate, isShareExpired } from '../hooks/useV4Leaderboard'
import { useAudio } from '../hooks/useAudio'
import './GameOver.css'

export function GameOver({ score, bestData, isNewHighScore, onRestart, earnedCoins = 0, levelId = null, onGoShop, onGoLevels, equippedSkin, isTimedMode = false }) {
  const [nickname, setNickname] = useState('')
  const [showShare, setShowShare] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [toast, setToast] = useState(null)

  const { addSharedRecord, generateShareUrl } = useV4Leaderboard()
  const { playClick, stopBGM } = useAudio()

  // V7: Stop BGM when game over
  useEffect(() => {
    stopBGM()
  }, [stopBGM])

  useEffect(() => {
    if (bestData?.nickname) {
      setNickname(bestData.nickname)
    }
  }, [bestData])

  // Generate share URL when nickname changes or share is clicked
  useEffect(() => {
    if (nickname && score > 0) {
      const skin = equippedSkin || 'default'
      const url = generateShareUrl(nickname, score, skin)
      setShareUrl(url || '')
    }
  }, [nickname, score, equippedSkin, generateShareUrl])

  const handleNicknameChange = (e) => {
    const val = e.target.value.slice(0, 3)
    setNickname(val)
  }

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  const handleShare = async () => {
    playClick()
    if (!nickname) {
      showToast('请先输入昵称')
      return
    }

    if (!shareUrl) {
      showToast('分享链接生成失败')
      return
    }

    // Save to localStorage
    const skin = equippedSkin || 'default'
    addSharedRecord(nickname, score, skin, shareUrl)

    // Try Web Share API first
    if (navigator.share) {
      try {
        const shareData = {
          title: isTimedMode ? '别踩白块 V6 限时挑战' : '别踩白块 V4',
          text: isTimedMode
            ? `别踩白块 V6 限时挑战 - ${nickname} 得到了 ${score} 分！⏱️`
            : `别踩白块 V4 - ${nickname} 得到了 ${score} 分！🏆`,
          url: shareUrl
        }
        await navigator.share(shareData)
        showToast('分享成功!')
        return
      } catch (err) {
        if (err.name !== 'AbortError') {
          // User cancelled or error, show copy option
          setShowShare(true)
        }
      }
    } else {
      // No Web Share API, show copy option
      setShowShare(true)
    }
  }

  const handleCopyLink = async () => {
    playClick()
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      showToast('已复制分享链接!')
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
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
  }

  const handleHome = () => {
    playClick()
    window.location.reload()
  }

  const handleRestart = () => {
    playClick()
    onRestart()
  }

  const handleGoShop = () => {
    playClick()
    onGoShop()
  }

  const handleGoLevels = () => {
    playClick()
    onGoLevels()
  }

  return (
    <div className="game-over-overlay">
      <div className="game-over-modal">
        <h2 className="game-over-title">{isTimedMode ? '限时挑战结束' : '游戏结束'}</h2>

        {/* Nickname input */}
        <div className="nickname-section">
          <input
            type="text"
            className="nickname-input"
            value={nickname}
            onChange={handleNicknameChange}
            placeholder="昵称"
            maxLength={3}
          />
        </div>

        {isNewHighScore && <div className="new-high-score">新纪录！</div>}

        <div className="game-over-scores">
          <div className="score-row">
            <span className="score-name">{isTimedMode ? '限时得分' : '本局得分'}</span>
            <span className="score-num">{score}</span>
          </div>
          <div className="score-row">
            <span className="score-name">{isTimedMode ? '限时纪录' : '最高纪录'}</span>
            <span className="score-num best">{bestData?.score || 0}</span>
          </div>
        </div>

        {/* V6: Timed mode extra stats */}
        {isTimedMode && (
          <div className="timed-mode-stats">
            <div className="timed-stat-row">
              <span className="timed-stat-label">🏆 成绩等级</span>
              <span className="timed-stat-value">
                {score >= 100 ? '大师' : score >= 70 ? '钻石' : score >= 50 ? '黄金' : score >= 30 ? '白银' : '青铜'}
              </span>
            </div>
          </div>
        )}

        {/* V3: Coins earned display */}
        {earnedCoins > 0 && (
          <div className="coins-earned">
            <span className="coins-earned-icon">🪙</span>
            <span>+{earnedCoins}</span>
          </div>
        )}

        {/* 3 buttons */}
        <div className="game-over-buttons">
          <button className="restart-btn" onClick={handleRestart}>重新开始</button>
          <div className="game-over-shortcuts">
            {!isTimedMode && <button className="shortcut-btn shop-btn" onClick={handleGoShop}>商店</button>}
            {!isTimedMode && <button className="shortcut-btn levels-btn" onClick={handleGoLevels}>关卡</button>}
          </div>
          <button className="home-btn" onClick={handleHome}>返回主页</button>
          <button className="share-btn" onClick={handleShare}>分享</button>
        </div>

        {showShare && shareUrl && (
          <div className="share-text">
            <div>分享链接：</div>
            <div className="share-url">{shareUrl}</div>
            <button className="copy-link-btn" onClick={handleCopyLink}>复制链接</button>
          </div>
        )}
      </div>

      {toast && <div className="share-toast">{toast}</div>}
    </div>
  )
}