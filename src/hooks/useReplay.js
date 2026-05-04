import { useState, useCallback, useRef } from 'react'

const STORAGE_REPLAYS = 'dsw_v17_replays'
const MAX_REPLAYS = 10

// Encode replay data to base64 for URL sharing
function encodeReplay(replay) {
  try {
    return btoa(JSON.stringify(replay))
  } catch (e) {
    console.error('Failed to encode replay:', e)
    return null
  }
}

// Decode replay from base64 URL parameter
function decodeReplay(encoded) {
  try {
    return JSON.parse(atob(encoded))
  } catch (e) {
    console.error('Failed to decode replay:', e)
    return null
  }
}

// Load replays from localStorage
function loadReplays() {
  try {
    const data = localStorage.getItem(STORAGE_REPLAYS)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('Failed to load replays:', e)
    return []
  }
}

// Save replays to localStorage
function saveReplays(replays) {
  try {
    // Keep only the latest MAX_REPLAYS
    const trimmed = replays.slice(-MAX_REPLAYS)
    localStorage.setItem(STORAGE_REPLAYS, JSON.stringify(trimmed))
    return trimmed
  } catch (e) {
    console.error('Failed to save replays:', e)
    return replays
  }
}

export function useReplay() {
  const [replays, setReplays] = useState(() => loadReplays())

  // Recording state
  const isRecordingRef = useRef(false)
  const recordingStartTimeRef = useRef(0)
  const recordingActionsRef = useRef([])

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackIndex, setPlaybackIndex] = useState(0)
  const [playbackSpeed, setPlaybackSpeedState] = useState(1) // 1, 2, 4
  const playbackTimerRef = useRef(null)
  const playbackDataRef = useRef(null)

  // Start recording a new replay
  const startRecording = useCallback(() => {
    isRecordingRef.current = true
    recordingStartTimeRef.current = Date.now()
    recordingActionsRef.current = []
  }, [])

  // Record a single action (column clicked)
  const recordAction = useCallback((col) => {
    if (!isRecordingRef.current) return
    const timestamp = Date.now() - recordingStartTimeRef.current
    recordingActionsRef.current.push({ col, timestamp })
  }, [])

  // Stop recording and return the recorded replay data
  const stopRecording = useCallback((score, mode) => {
    isRecordingRef.current = false
    const replay = {
      id: Date.now().toString(36),
      score,
      mode: mode || 'endless',
      actions: recordingActionsRef.current,
      duration: recordingActionsRef.current.length > 0
        ? recordingActionsRef.current[recordingActionsRef.current.length - 1].timestamp
        : 0,
      createdAt: Date.now()
    }
    recordingActionsRef.current = []
    return replay
  }, [])

  // Cancel recording without saving
  const cancelRecording = useCallback(() => {
    isRecordingRef.current = false
    recordingActionsRef.current = []
  }, [])

  // Save a replay to localStorage
  const saveReplay = useCallback((replay) => {
    const updated = [...replays, replay]
    const trimmed = saveReplays(updated)
    setReplays(trimmed)
  }, [replays])

  // Delete a replay
  const deleteReplay = useCallback((id) => {
    const updated = replays.filter(r => r.id !== id)
    saveReplays(updated)
    setReplays(updated)
  }, [replays])

  // Get shareable URL for a replay
  const getShareUrl = useCallback((id) => {
    const replay = replays.find(r => r.id === id)
    if (!replay) return null
    const encoded = encodeReplay(replay)
    if (!encoded) return null
    const url = new URL(window.location.href)
    url.searchParams.set('replay', encoded)
    return url.toString()
  }, [replays])

  // Parse replay from URL parameter
  const parseUrlReplay = useCallback(() => {
    const params = new URLSearchParams(window.location.search)
    const encoded = params.get('replay')
    if (!encoded) return null
    const replay = decodeReplay(encoded)
    if (!replay || !replay.actions || !Array.isArray(replay.actions)) return null
    return replay
  }, [])

  // Clear URL replay parameter
  const clearUrlReplay = useCallback(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.has('replay')) {
      url.searchParams.delete('replay')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  // --- Playback engine ---

  // Load a replay for playback (returns actions array for external replay engine)
  const loadReplayForPlayback = useCallback((id) => {
    const replay = replays.find(r => r.id === id)
    if (!replay) return null
    playbackDataRef.current = replay
    setPlaybackIndex(0)
    setIsPlaying(false)
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current)
      playbackTimerRef.current = null
    }
    return replay
  }, [replays])

  // Load a parsed replay (from URL) for playback
  const loadExternalReplay = useCallback((replay) => {
    playbackDataRef.current = replay
    setPlaybackIndex(0)
    setIsPlaying(false)
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current)
      playbackTimerRef.current = null
    }
    return replay
  }, [])

  // Set playback speed
  const setPlaybackSpeed = useCallback((speed) => {
    setPlaybackSpeedState(speed)
  }, [])

  // Get current playback progress (0-1)
  const getPlaybackProgress = useCallback(() => {
    if (!playbackDataRef.current) return 0
    const total = playbackDataRef.current.duration || 1
    if (playbackIndex >= playbackDataRef.current.actions.length) return 1
    const currentAction = playbackDataRef.current.actions[playbackIndex]
    if (!currentAction) return 1
    return Math.min(currentAction.timestamp / total, 1)
  }, [playbackIndex])

  // Get current action index
  const getCurrentIndex = useCallback(() => {
    return playbackIndex
  }, [playbackIndex])

  // Check if playback is complete
  const isPlaybackComplete = useCallback(() => {
    if (!playbackDataRef.current) return true
    return playbackIndex >= playbackDataRef.current.actions.length
  }, [playbackIndex])

  // Step playback forward (called by external timer, returns next action or null)
  const stepPlayback = useCallback(() => {
    if (!playbackDataRef.current) return null
    if (playbackIndex >= playbackDataRef.current.actions.length) {
      setIsPlaying(false)
      return null
    }
    const action = playbackDataRef.current.actions[playbackIndex]
    setPlaybackIndex(prev => prev + 1)
    return action
  }, [playbackIndex])

  // Get next action timestamp (for scheduling)
  const getNextActionTimestamp = useCallback(() => {
    if (!playbackDataRef.current) return null
    if (playbackIndex >= playbackDataRef.current.actions.length) return null
    return playbackDataRef.current.actions[playbackIndex].timestamp
  }, [playbackIndex])

  // Start playback (for external replay engine to consume actions)
  const startPlayback = useCallback(() => {
    if (!playbackDataRef.current) return
    setIsPlaying(true)
  }, [])

  // Pause playback
  const pausePlayback = useCallback(() => {
    setIsPlaying(false)
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current)
      playbackTimerRef.current = null
    }
  }, [])

  // Stop playback and reset
  const stopPlayback = useCallback(() => {
    setIsPlaying(false)
    setPlaybackIndex(0)
    playbackDataRef.current = null
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current)
      playbackTimerRef.current = null
    }
  }, [])

  // Get replay by ID
  const getReplayById = useCallback((id) => {
    return replays.find(r => r.id === id) || null
  }, [replays])

  // Get all replays
  const getReplays = useCallback(() => {
    return replays
  }, [replays])

  return {
    // Recording
    startRecording,
    recordAction,
    stopRecording,
    cancelRecording,
    saveReplay,
    isRecording: () => isRecordingRef.current,

    // Playback
    isPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    loadReplayForPlayback,
    loadExternalReplay,
    startPlayback,
    pausePlayback,
    stopPlayback,
    stepPlayback,
    getPlaybackProgress,
    getCurrentIndex,
    isPlaybackComplete,
    getNextActionTimestamp,
    getReplayById,
    getReplays,
    deleteReplay,
    getShareUrl,

    // URL
    parseUrlReplay,
    clearUrlReplay,
  }
}
