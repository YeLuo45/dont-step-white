import { useCallback, useRef } from 'react'

const STORAGE_SETTINGS = 'dsw_settings'

// Default settings
const DEFAULT_SETTINGS = {
  soundEnabled: true,
  bgmEnabled: true,
  soundVolume: 0.7,
  bgmVolume: 0.4
}

// Load settings from localStorage
function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_SETTINGS)
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    }
  } catch (e) {}
  return DEFAULT_SETTINGS
}

// Save settings to localStorage
function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings))
  } catch (e) {}
}

export function useAudio() {
  const audioContextRef = useRef(null)
  const bgmIntervalRef = useRef(null)
  const bgmNotesRef = useRef([])
  const settingsRef = useRef(loadSettings())

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])

  // Play a tone helper
  const playTone = useCallback((type, freqStart, freqEnd, duration, volume = 0.3) => {
    try {
      const ctx = getAudioContext()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.type = type
      oscillator.frequency.setValueAtTime(freqStart, ctx.currentTime)
      if (freqEnd !== freqStart) {
        oscillator.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration)
      }
      gainNode.gain.setValueAtTime(volume * settingsRef.current.soundVolume, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration)
    } catch (e) {}
  }, [getAudioContext])

  // Step on black block - rising pleasant tone
  const playStepBlack = useCallback(() => {
    if (!settingsRef.current.soundEnabled) return
    playTone('sine', 600, 1000, 0.08, 0.4)
    // Second harmonic for richness
    setTimeout(() => {
      playTone('sine', 800, 1200, 0.06, 0.2)
    }, 30)
  }, [playTone])

  // Step on white block - fail buzzer
  const playStepWhite = useCallback(() => {
    if (!settingsRef.current.soundEnabled) return
    // Harsh buzz
    playTone('sawtooth', 200, 150, 0.2, 0.35)
    // Lower thud
    setTimeout(() => {
      playTone('sine', 100, 60, 0.15, 0.3)
    }, 50)
  }, [playTone])

  // Powerup collect - magical sparkle
  const playPowerup = useCallback(() => {
    if (!settingsRef.current.soundEnabled) return
    // Ascending arpeggio
    const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        playTone('sine', freq, freq * 1.02, 0.15, 0.25)
      }, i * 60)
    })
  }, [playTone])

  // UI click - soft tick
  const playClick = useCallback(() => {
    if (!settingsRef.current.soundEnabled) return
    playTone('sine', 1200, 1400, 0.04, 0.15)
  }, [playTone])

  // Countdown warning - urgent beep
  const playWarning = useCallback(() => {
    if (!settingsRef.current.soundEnabled) return
    playTone('square', 880, 880, 0.1, 0.25)
    setTimeout(() => {
      playTone('square', 880, 880, 0.1, 0.25)
    }, 150)
  }, [playTone])

  // Original playStep (kept for compatibility)
  const playStep = useCallback(() => {
    playStepBlack()
  }, [playStepBlack])

  // Original playFail
  const playFail = useCallback(() => {
    playStepWhite()
  }, [playStepWhite])

  // Piano note helper - creates a piano-like tone with harmonics
  const playPianoNote = useCallback((frequency, startTime, duration, volume) => {
    try {
      const ctx = getAudioContext()
      const t = startTime
      
      // Fundamental
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(frequency, t)
      gain1.gain.setValueAtTime(0, t)
      gain1.gain.linearRampToValueAtTime(volume, t + 0.01) // Attack
      gain1.gain.exponentialRampToValueAtTime(volume * 0.4, t + 0.1) // Decay
      gain1.gain.exponentialRampToValueAtTime(0.01, t + duration) // Release
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(t)
      osc1.stop(t + duration)

      // Second harmonic (quieter)
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(frequency * 2, t)
      gain2.gain.setValueAtTime(0, t)
      gain2.gain.linearRampToValueAtTime(volume * 0.15, t + 0.01)
      gain2.gain.exponentialRampToValueAtTime(0.01, t + duration * 0.8)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(t)
      osc2.stop(t + duration)

      // Third harmonic (even quieter)
      const osc3 = ctx.createOscillator()
      const gain3 = ctx.createGain()
      osc3.type = 'sine'
      osc3.frequency.setValueAtTime(frequency * 3, t)
      gain3.gain.setValueAtTime(0, t)
      gain3.gain.linearRampToValueAtTime(volume * 0.05, t + 0.01)
      gain3.gain.exponentialRampToValueAtTime(0.01, t + duration * 0.6)
      osc3.connect(gain3)
      gain3.connect(ctx.destination)
      osc3.start(t)
      osc3.stop(t + duration)
    } catch (e) {}
  }, [getAudioContext])

  // BGM melody - C major pentatonic loop at 80 BPM
  // 80 BPM = 750ms per beat
  const BGM_BEAT = 750 // ms
  const BGM_NOTES = [
    // Bar 1: C4, E4, G4, C5
    { freq: 261.63, dur: 1 },
    { freq: 329.63, dur: 1 },
    { freq: 392.00, dur: 1 },
    { freq: 523.25, dur: 1 },
    // Bar 2: G4, E4, C4 (descending)
    { freq: 392.00, dur: 1 },
    { freq: 329.63, dur: 1 },
    { freq: 261.63, dur: 2 },
    // Bar 3: C4, G4, E4, G4
    { freq: 261.63, dur: 1 },
    { freq: 392.00, dur: 1 },
    { freq: 329.63, dur: 1 },
    { freq: 392.00, dur: 1 },
    // Bar 4: C4 rest, C4 (resolve)
    { freq: 261.63, dur: 1 },
    { freq: 261.63, dur: 1 },
    { freq: 293.66, dur: 1 }, // D4
    { freq: 329.63, dur: 1 }, // E4
  ]
  const BGM_LOOP_BEATS = 16 // Total beats per loop

  // Start BGM loop
  const startBGM = useCallback(() => {
    if (!settingsRef.current.bgmEnabled) return
    stopBGM() // Clear any existing

    const ctx = getAudioContext()
    let beatIndex = 0
    const startTime = ctx.currentTime + 0.1

    const scheduleNotes = () => {
      if (!settingsRef.current.bgmEnabled) return
      
      const now = ctx.currentTime
      const vol = settingsRef.current.bgmVolume * 0.5

      // Schedule 4 beats ahead
      for (let i = 0; i < 4; i++) {
        const noteIdx = beatIndex % BGM_NOTES.length
        const note = BGM_NOTES[noteIdx]
        const noteDuration = (note.dur * BGM_BEAT) / 1000
        
        playPianoNote(note.freq, now + (i * BGM_BEAT) / 1000, noteDuration, vol)
        
        beatIndex += note.dur
      }
    }

    // Initial schedule
    scheduleNotes()
    
    // Schedule next batch every beat
    bgmIntervalRef.current = setInterval(() => {
      if (!settingsRef.current.bgmEnabled) {
        stopBGM()
        return
      }
      scheduleNotes()
    }, BGM_BEAT)
  }, [getAudioContext, playPianoNote])

  // Stop BGM
  const stopBGM = useCallback(() => {
    if (bgmIntervalRef.current) {
      clearInterval(bgmIntervalRef.current)
      bgmIntervalRef.current = null
    }
  }, [])

  // Update settings
  const updateSettings = useCallback((newSettings) => {
    settingsRef.current = { ...settingsRef.current, ...newSettings }
    saveSettings(settingsRef.current)
  }, [])

  // Get current settings
  const getSettings = useCallback(() => {
    return { ...settingsRef.current }
  }, [])

  // Refresh settings from localStorage (call after external changes)
  const refreshSettings = useCallback(() => {
    settingsRef.current = loadSettings()
  }, [])

  return {
    playStep,
    playFail,
    playStepBlack,
    playStepWhite,
    playPowerup,
    playClick,
    playWarning,
    startBGM,
    stopBGM,
    updateSettings,
    getSettings,
    refreshSettings
  }
}