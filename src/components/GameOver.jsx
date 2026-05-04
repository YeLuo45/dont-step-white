import React, { useState, useEffect } from 'react'
import './GameOver.css'

export function GameOver({ score, bestData, isNewHighScore, onRestart }) {
  const [nickname, setNickname] = useState('')
  const [showShare, setShowShare] = useState(false)

  useEffect(() => {
    if (bestData?.nickname) {
      setNickname(bestData.nickname)
    }
  }, [bestData])

  const handleNicknameChange = (e) => {
    const val = e.target.value.slice(0, 3)
    setNickname(val)
  }

  const handleShare = async () => {
    const text = `别踩白块 V2 - 我得到了 ${score} 分！🏆`
    if (navigator.share) {
      try {
        await navigator.share({ title: '别踩白块', text })
      } catch (err) {
        setShowShare(true)
      }
    } else {
      setShowShare(true)
    }
  }

  const handleHome = () => {
    window.location.reload()
  }

  return (
    <div className="game-over-overlay">
      <div className="game-over-modal">
        <h2 className="game-over-title">游戏结束</h2>

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
            <span className="score-name">本局得分</span>
            <span className="score-num">{score}</span>
          </div>
          <div className="score-row">
            <span className="score-name">最高纪录</span>
            <span className="score-num best">{bestData?.score || 0}</span>
          </div>
        </div>

        {/* 3 buttons */}
        <div className="game-over-buttons">
          <button className="restart-btn" onClick={onRestart}>重新开始</button>
          <button className="home-btn" onClick={handleHome}>返回主页</button>
          <button className="share-btn" onClick={handleShare}>分享</button>
        </div>

        {showShare && (
          <div className="share-text">
            分享得分：别踩白块 V2 - {score} 分！
          </div>
        )}
      </div>
    </div>
  )
}
