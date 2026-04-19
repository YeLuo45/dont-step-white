import { useCallback, useRef } from 'react'

export function useAudio() {
  const audioContextRef = useRef(null)

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])

  const playStep = useCallback(() => {
    try {
      const ctx = getAudioContext()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(800, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05)
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.1)
    } catch (e) {}
  }, [getAudioContext])

  const playFail = useCallback(() => {
    try {
      const ctx = getAudioContext()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.type = 'sawtooth'
      oscillator.frequency.setValueAtTime(300, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3)
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.3)
    } catch (e) {}
  }, [getAudioContext])

  return { playStep, playFail }
}
