import React from 'react'
import { LeaderboardPro } from './LeaderboardPro'

// V18: Legacy component that redirects to LeaderboardPro
// Keeping for backward compatibility with old share URLs (?rank=xxx)
export function Leaderboard({ onBack }) {
  return <LeaderboardPro onBack={onBack} />
}
