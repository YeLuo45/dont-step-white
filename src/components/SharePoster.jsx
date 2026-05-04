import React, { useState, useEffect, useRef, useCallback } from 'react'
import QRCode from 'qrcode'
import { SKINS } from '../utils/skins'
import { formatShareDate } from '../hooks/useV4Leaderboard'
import './SharePoster.css'

// Poster canvas dimensions
const POSTER_WIDTH = 750
const POSTER_HEIGHT = 1334

// Mode labels
const MODE_LABELS = {
  endless: '无尽模式',
  timed: '限时挑战',
  story: '剧情模式',
  level: '关卡挑战',
  daily: '每日挑战'
}

export function SharePoster({
  nickname = '',
  score = 0,
  bestScore = 0,
  skinId = 'classic',
  mode = 'endless',
  bestData = null,
  titles = [],
  achievementsUnlocked = [],
  onNicknameChange,
  onClose
}) {
  const canvasRef = useRef(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [toast, setToast] = useState(null)
  const [editableNickname, setEditableNickname] = useState(nickname)

  // Get skin info
  const skinInfo = SKINS[skinId] || SKINS.classic

  // Get mode label
  const modeLabel = MODE_LABELS[mode] || '无尽模式'

  // Get rank/tier text
  const getRankText = (score, mode) => {
    if (mode === 'timed') {
      if (score >= 100) return '大师'
      if (score >= 70) return '钻石'
      if (score >= 50) return '黄金'
      if (score >= 30) return '白银'
      return '青铜'
    }
    if (score >= 200) return '王者'
    if (score >= 150) return '大师'
    if (score >= 100) return '钻石'
    if (score >= 70) return '黄金'
    if (score >= 50) return '白银'
    return '青铜'
  }

  // Generate QR code
  useEffect(() => {
    const generateQR = async () => {
      try {
        const shareUrl = `${window.location.origin}${window.location.pathname}`
        const dataUrl = await QRCode.toDataURL(shareUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        })
        setQrCodeDataUrl(dataUrl)
      } catch (err) {
        console.error('Failed to generate QR code:', err)
      }
    }
    generateQR()
  }, [])

  // Update nickname when prop changes
  useEffect(() => {
    setEditableNickname(nickname)
  }, [nickname])

  // Handle nickname change
  const handleNicknameChange = (e) => {
    const val = e.target.value.slice(0, 3)
    setEditableNickname(val)
    if (onNicknameChange) {
      onNicknameChange(val)
    }
  }

  // Show toast
  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  // Draw poster on canvas
  const drawPoster = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas || !qrCodeDataUrl) return null

    const ctx = canvas.getContext('2d')
    setIsGenerating(true)

    // Set canvas size
    canvas.width = POSTER_WIDTH
    canvas.height = POSTER_HEIGHT

    // Load QR code image
    const qrImage = new Image()
    qrImage.src = qrCodeDataUrl

    await new Promise((resolve) => {
      qrImage.onload = resolve
    })

    // Clear canvas
    ctx.clearRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT)

    // Draw background
    const gradient = ctx.createLinearGradient(0, 0, 0, POSTER_HEIGHT)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(0.5, '#16213e')
    gradient.addColorStop(1, '#0f0f23')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT)

    // Draw decorative elements - top left corner
    ctx.beginPath()
    ctx.arc(0, 0, 200, Math.PI, Math.PI * 1.5)
    ctx.fillStyle = 'rgba(100, 200, 255, 0.1)'
    ctx.fill()

    // Draw decorative elements - bottom right corner
    ctx.beginPath()
    ctx.arc(POSTER_WIDTH, POSTER_HEIGHT, 250, -Math.PI * 0.5, -Math.PI)
    ctx.fillStyle = 'rgba(100, 200, 255, 0.08)'
    ctx.fill()

    // Draw title background
    const titleGradient = ctx.createLinearGradient(0, 80, 0, 180)
    titleGradient.addColorStop(0, 'rgba(100, 200, 255, 0.2)')
    titleGradient.addColorStop(1, 'rgba(100, 200, 255, 0)')
    ctx.fillStyle = titleGradient
    ctx.fillRect(0, 80, POSTER_WIDTH, 100)

    // Draw game title
    ctx.font = 'bold 64px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#64c8ff'
    ctx.fillText('别踩白块', POSTER_WIDTH / 2, 150)

    // Draw subtitle
    ctx.font = '28px Arial, sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.fillText('V15 分享海报', POSTER_WIDTH / 2, 190)

    // Draw divider line
    ctx.beginPath()
    ctx.moveTo(100, 230)
    ctx.lineTo(POSTER_WIDTH - 100, 230)
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw nickname section
    ctx.font = 'bold 36px Arial, sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(`玩家: ${editableNickname || '???'}`, POSTER_WIDTH / 2, 300)

    // Draw mode badge
    const modeBadgeWidth = 160
    const modeBadgeHeight = 44
    const modeBadgeX = (POSTER_WIDTH - modeBadgeWidth) / 2
    const modeBadgeY = 330

    ctx.beginPath()
    ctx.roundRect(modeBadgeX, modeBadgeY, modeBadgeWidth, modeBadgeHeight, 22)
    ctx.fillStyle = mode === 'timed' ? '#ff6b6b' : '#4a9eff'
    ctx.fill()

    ctx.font = 'bold 22px Arial, sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(modeLabel, POSTER_WIDTH / 2, modeBadgeY + 30)

    // Draw score section background
    ctx.beginPath()
    ctx.roundRect(50, 420, POSTER_WIDTH - 100, 280, 20)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.2)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw score label
    ctx.font = '28px Arial, sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.fillText('最终得分', POSTER_WIDTH / 2, 480)

    // Draw score value
    ctx.font = 'bold 120px Arial, sans-serif'
    ctx.fillStyle = '#ffd700'
    ctx.fillText(score.toString(), POSTER_WIDTH / 2, 610)

    // Draw rank/tier
    const rank = getRankText(score, mode)
    ctx.font = 'bold 36px Arial, sans-serif'
    ctx.fillStyle = '#ff6b6b'
    ctx.fillText(`🏆 ${rank}`, POSTER_WIDTH / 2, 670)

    // Draw best score if available
    if (bestScore > 0 && bestScore !== score) {
      ctx.font = '24px Arial, sans-serif'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.fillText(`最高纪录: ${bestScore}`, POSTER_WIDTH / 2, 720)
    }

    // Draw skin section
    const skinY = 780
    ctx.beginPath()
    ctx.roundRect(50, skinY, POSTER_WIDTH - 100, 100, 16)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.fill()

    // Draw skin color preview
    const skinColor = skinInfo.block || '#64c8ff'
    ctx.beginPath()
    ctx.roundRect(80, skinY + 20, 60, 60, 12)
    ctx.fillStyle = skinColor
    ctx.fill()

    // Draw skin border glow
    ctx.shadowColor = skinColor
    ctx.shadowBlur = 15
    ctx.beginPath()
    ctx.roundRect(80, skinY + 20, 60, 60, 12)
    ctx.strokeStyle = skinColor
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.shadowBlur = 0

    // Draw skin name
    ctx.font = 'bold 28px Arial, sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'left'
    ctx.fillText(skinInfo.name, 160, skinY + 48)

    // Draw skin description
    ctx.font = '20px Arial, sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.fillText(`稀有度: ${skinInfo.rarity}`, 160, skinY + 80)

    // Draw titles if any
    let extraY = 920
    if (titles && titles.length > 0) {
      ctx.textAlign = 'center'
      ctx.font = 'bold 24px Arial, sans-serif'
      ctx.fillStyle = '#fbbf24'
      ctx.fillText(`🏅 称号: ${titles.join(' ')}`, POSTER_WIDTH / 2, extraY)
      extraY += 50
    }

    // Draw achievements if any
    if (achievementsUnlocked && achievementsUnlocked.length > 0) {
      ctx.textAlign = 'center'
      ctx.font = 'bold 22px Arial, sans-serif'
      ctx.fillStyle = '#8b5cf6'
      const achText = achievementsUnlocked.slice(0, 3).map(a => a.icon || '🏆').join(' ')
      ctx.fillText(`${achText} 等成就已解锁`, POSTER_WIDTH / 2, extraY)
      extraY += 50
    }

    // Draw date
    const dateStr = formatShareDate(Date.now())
    ctx.textAlign = 'center'
    ctx.font = '22px Arial, sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.fillText(`${dateStr}`, POSTER_WIDTH / 2, extraY)

    // Draw QR code section
    const qrY = extraY + 40
    const qrSize = 180
    const qrX = (POSTER_WIDTH - qrSize) / 2

    // Draw QR background
    ctx.beginPath()
    ctx.roundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 80, 20)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.fill()

    // Draw QR code
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

    // Draw QR label
    ctx.font = '18px Arial, sans-serif'
    ctx.fillStyle = '#333'
    ctx.fillText('扫码查看我的战绩', POSTER_WIDTH / 2, qrY + qrSize + 45)

    // Draw app name at bottom
    ctx.font = 'bold 24px Arial, sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.fillText('别踩白块', POSTER_WIDTH / 2, POSTER_HEIGHT - 50)

    setIsGenerating(false)
    return canvas.toDataURL('image/png')
  }, [editableNickname, score, bestScore, skinId, mode, modeLabel, qrCodeDataUrl, skinInfo, titles, achievementsUnlocked])

  // Download poster as PNG
  const handleDownload = async () => {
    try {
      const dataUrl = await drawPoster()
      if (!dataUrl) {
        showToast('海报生成中，请稍候')
        return
      }

      const link = document.createElement('a')
      link.download = `别踩白块_战绩_${editableNickname || '玩家'}_${Date.now()}.png`
      link.href = dataUrl
      link.click()
      showToast('海报已保存!')
    } catch (err) {
      console.error('Failed to download poster:', err)
      showToast('下载失败')
    }
  }

  // Copy poster to clipboard
  const handleCopyToClipboard = async () => {
    try {
      const canvas = canvasRef.current
      if (!canvas) {
        showToast('海报生成中，请稍候')
        return
      }

      // Draw first if not drawn
      await drawPoster()

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      showToast('已复制到剪贴板!')
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      showToast('复制失败，请手动保存')
    }
  }

  // Share via Web Share API
  const handleShare = async () => {
    try {
      const canvas = canvasRef.current
      if (!canvas) {
        showToast('海报生成中，请稍候')
        return
      }

      await drawPoster()

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      const file = new File([blob], `别踩白块_战绩_${editableNickname || '玩家'}.png`, { type: 'image/png' })

      if (navigator.share) {
        await navigator.share({
          title: '别踩白块 V15',
          text: `${editableNickname} 在${modeLabel}得到了 ${score} 分！🏆`,
          files: [file]
        })
        showToast('分享成功!')
      } else {
        // Fallback: download
        handleDownload()
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to share:', err)
        showToast('分享失败')
      }
    }
  }

  return (
    <div className="share-poster-overlay">
      <div className="share-poster-container">
        <div className="share-poster-header">
          <h3>分享海报</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Nickname editor */}
        <div className="poster-nickname-editor">
          <label>编辑昵称:</label>
          <input
            type="text"
            value={editableNickname}
            onChange={handleNicknameChange}
            placeholder="昵称"
            maxLength={3}
          />
        </div>

        {/* Canvas preview */}
        <div className="poster-preview">
          <canvas ref={canvasRef} className="poster-canvas" />
        </div>

        {/* Action buttons */}
        <div className="poster-actions">
          <button
            className="poster-btn download-btn"
            onClick={handleDownload}
            disabled={isGenerating}
          >
            📥 下载海报
          </button>
          <button
            className="poster-btn copy-btn"
            onClick={handleCopyToClipboard}
            disabled={isGenerating}
          >
            📋 复制图片
          </button>
          <button
            className="poster-btn share-btn"
            onClick={handleShare}
            disabled={isGenerating}
          >
            🔗 分享
          </button>
        </div>
      </div>

      {toast && <div className="poster-toast">{toast}</div>}
    </div>
  )
}

export default SharePoster
