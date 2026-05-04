import React, { useState, useEffect, useCallback } from 'react'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { STORY_CHAPTERS } from '../hooks/useStoryGame'
import './LeaderboardPro.css'

const TABS = {
  GLOBAL: 'global',
  LOCAL: 'local',
  FRIENDS: 'friends',
  LEVEL: 'level'
}

const MODE_FILTERS = [
  { id: 'all', name: '全部' },
  { id: 'endless', name: '无尽' },
  { id: 'timed', name: '限时' },
  { id: 'story', name: '剧情' },
  { id: 'daily', name: '每日' }
]

export function LeaderboardPro({ onBack }) {
  const [activeTab, setActiveTab] = useState(TABS.GLOBAL)
  const [toast, setToast] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [friendCodeInput, setFriendCodeInput] = useState('')
  const [modeFilter, setModeFilter] = useState('all')
  const [selectedChapter, setSelectedChapter] = useState(null)

  const {
    getGlobalLeaderboard,
    getLocalLeaderboard,
    getFriendsLeaderboard,
    getLevelLeaderboard,
    getMyBest,
    getMyNickname,
    friends,
    addFriend,
    removeFriend,
    parseFriendFromUrl,
    generateFriendShareUrl
  } = useLeaderboard()

  // Check for friend data in URL on mount
  useEffect(() => {
    const friendData = parseFriendFromUrl()
    if (friendData && friendData.c) {
      addFriend(friendData.c, friendData.n || '好友', friendData.s)
      showToast('已添加好友: ' + (friendData.n || '好友'))
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  // Render medal icon for top 3
  const renderRank = (rank, isLocal) => {
    if (rank === 1) return <span className="medal">🏆</span>
    if (rank === 2) return <span className="medal">🥈</span>
    if (rank === 3) return <span className="medal">🥇</span>
    return rank
  }

  // Get top class for item styling
  const getTopClass = (rank) => {
    if (rank === 1) return 'top-1'
    if (rank === 2) return 'top-2'
    if (rank === 3) return 'top-3'
    return ''
  }

  // === Global Tab ===
  const renderGlobalTab = () => {
    const leaderboard = getGlobalLeaderboard()
    const myBest = getMyBest()

    return (
      <div className="leaderboard-tab-content">
        {myBest.score > 0 && (
          <div className="my-rank-card">
            <div className="my-rank-header">
              <span className="my-rank-label">我的最高分</span>
              <span className="my-rank-value">
                全球排名 #{leaderboard.find(p => p.isLocal)?.rank || '-'}
              </span>
            </div>
            <div className="my-rank-score">{myBest.score}</div>
          </div>
        )}

        <div className="leaderboard-list">
          {leaderboard.slice(0, 20).map((player) => (
            <div
              key={player.id}
              className={`leaderboard-item ${getTopClass(player.rank)} ${player.isLocal ? 'highlight' : ''}`}
            >
              <div className="item-rank">{renderRank(player.rank)}</div>
              <div className="item-info">
                <div className="item-nickname">
                  {player.nickname}
                  {player.isLocal && <span style={{ marginLeft: 6, fontSize: 12, color: '#4ade80' }}>(我)</span>}
                </div>
                <div className="item-meta">{player.date}</div>
              </div>
              <div className="item-score">{player.score}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // === Local Tab ===
  const renderLocalTab = () => {
    const allScores = getLocalLeaderboard()
    const filtered = modeFilter === 'all'
      ? allScores
      : allScores.filter(s => s.mode === modeFilter)

    return (
      <div className="leaderboard-tab-content">
        <div className="filter-tabs">
          {MODE_FILTERS.map(f => (
            <button
              key={f.id}
              className={`filter-tab ${modeFilter === f.id ? 'active' : ''}`}
              onClick={() => setModeFilter(f.id)}
            >
              {f.name}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📱</div>
            <div className="empty-state-text">
              暂无{modeFilter !== 'all' ? MODE_FILTERS.find(f => f.id === modeFilter)?.name : ''}记录<br />
              开始游戏即可自动记录
            </div>
          </div>
        ) : (
          <div className="leaderboard-list">
            {filtered.map((item, index) => (
              <div key={item.id} className="leaderboard-item">
                <div className="item-rank" style={{ fontSize: 14 }}>{index + 1}</div>
                <div className="item-info">
                  <div className="item-nickname">{item.modeIcon} {item.modeName}</div>
                  <div className="item-meta">{item.date}</div>
                </div>
                <div className="item-score">{item.score}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // === Friends Tab ===
  const handleAddFriend = () => {
    const code = friendCodeInput.trim().toUpperCase()
    if (!code) {
      showToast('请输入好友码')
      return
    }
    if (code.length !== 6) {
      showToast('好友码为6位字母')
      return
    }
    const result = addFriend(code, '好友' + code.slice(-4), 0)
    if (result.success) {
      showToast('好友添加成功!')
      setShowAddModal(false)
      setFriendCodeInput('')
    } else {
      showToast(result.error || '添加失败')
    }
  }

  const handleShareMyCode = () => {
    const nickname = getMyNickname()
    const myBest = getMyBest()
    const url = generateFriendShareUrl(nickname, myBest.score)
    if (url) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('分享链接已复制!')
      }).catch(() => {
        showToast('复制失败，请手动复制')
      })
    }
    setShowShareModal(false)
  }

  const friendsList = getFriendsLeaderboard()

  const renderFriendsTab = () => {
    return (
      <div className="leaderboard-tab-content">
        <div className="friend-actions">
          <button className="add-friend-btn" onClick={() => setShowAddModal(true)}>
            👥 添加好友
          </button>
          <button className="share-btn" onClick={() => setShowShareModal(true)}>
            🔗 分享我的
          </button>
        </div>

        {friendsList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-text">
              暂无好友<br />
              点击"添加好友"输入好友码<br />
              或点击"分享我的"生成邀请链接
            </div>
          </div>
        ) : (
          <div className="leaderboard-list">
            {friendsList.map((friend, index) => (
              <div key={friend.code} className="friend-item">
                <div className="item-rank" style={{ fontSize: 14 }}>{index + 1}</div>
                <div className="friend-info">
                  <div className="friend-nickname">
                    {friend.nickname}
                    {friend.stale && <span className="offline-badge">离线</span>}
                  </div>
                  <div className="friend-code">{friend.code}</div>
                </div>
                <div className={`friend-score ${friend.stale ? 'item-score-stale' : ''}`}>
                  {friend.score}
                </div>
                <button className="friend-remove" onClick={() => removeFriend(friend.code)}>
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // === Level Tab ===
  const renderLevelTab = () => {
    const allLevels = getLevelLeaderboard()

    // Filter by chapter if selected
    const filtered = selectedChapter
      ? allLevels.filter(l => l.chapterId === selectedChapter)
      : allLevels

    return (
      <div className="leaderboard-tab-content">
        <div className="chapter-selector">
          <button
            className={`chapter-btn ${selectedChapter === null ? 'active' : ''}`}
            onClick={() => setSelectedChapter(null)}
          >
            全部
          </button>
          {STORY_CHAPTERS.map(ch => (
            <button
              key={ch.id}
              className={`chapter-btn ${selectedChapter === ch.id ? 'active' : ''}`}
              onClick={() => setSelectedChapter(ch.id)}
            >
              {ch.name}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <div className="empty-state-text">
              暂无关卡记录<br />
              完成剧情模式关卡即可上榜
            </div>
          </div>
        ) : (
          <div className="leaderboard-list">
            {filtered.map((level) => (
              <div key={level.id} className="level-item">
                <div className="level-icon">
                  {level.completed ? '✅' : '🔒'}
                </div>
                <div className="level-info">
                  <div className="level-name">{level.name}</div>
                  <div className="level-chapter">{level.chapterName}</div>
                </div>
                {level.stars > 0 && (
                  <div className="level-stars">
                    {'⭐'.repeat(level.stars)}
                  </div>
                )}
                <div className={`level-score ${!level.completed ? 'item-score-stale' : ''}`}>
                  {level.bestScore}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case TABS.GLOBAL:
        return renderGlobalTab()
      case TABS.LOCAL:
        return renderLocalTab()
      case TABS.FRIENDS:
        return renderFriendsTab()
      case TABS.LEVEL:
        return renderLevelTab()
      default:
        return null
    }
  }

  return (
    <div className="leaderboard-pro">
      <button className="back-btn" onClick={onBack}>
        ← 返回
      </button>

      <h2 className="leaderboard-pro-title">🏆 排行榜 Pro</h2>

      <div className="leaderboard-tabs">
        <button
          className={`leaderboard-tab ${activeTab === TABS.GLOBAL ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.GLOBAL)}
        >
          <span className="leaderboard-tab-icon">🌍</span>
          <span>全球</span>
        </button>
        <button
          className={`leaderboard-tab ${activeTab === TABS.LOCAL ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.LOCAL)}
        >
          <span className="leaderboard-tab-icon">📱</span>
          <span>本地</span>
        </button>
        <button
          className={`leaderboard-tab ${activeTab === TABS.FRIENDS ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.FRIENDS)}
        >
          <span className="leaderboard-tab-icon">👥</span>
          <span>好友</span>
        </button>
        <button
          className={`leaderboard-tab ${activeTab === TABS.LEVEL ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.LEVEL)}
        >
          <span className="leaderboard-tab-icon">🎯</span>
          <span>关卡</span>
        </button>
      </div>

      {renderTabContent()}

      {/* Add Friend Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-title">添加好友</div>
            <input
              type="text"
              className="modal-input"
              placeholder="输入6位好友码"
              value={friendCodeInput}
              onChange={e => setFriendCodeInput(e.target.value.toUpperCase())}
              maxLength={6}
              autoFocus
            />
            <div className="modal-buttons">
              <button className="modal-btn modal-btn-cancel" onClick={() => setShowAddModal(false)}>
                取消
              </button>
              <button className="modal-btn modal-btn-confirm" onClick={handleAddFriend}>
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-title">分享我的战绩</div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>
              分享后，好友可通过链接添加你为好友
            </p>
            <div className="modal-buttons">
              <button className="modal-btn modal-btn-cancel" onClick={() => setShowShareModal(false)}>
                取消
              </button>
              <button className="modal-btn modal-btn-confirm" onClick={handleShareMyCode}>
                复制链接
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
