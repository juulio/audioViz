import { useEffect, useRef, useState, useCallback } from 'react'

export function useAudioAnalyser(source: File | string, fftSize = 128) {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(
    new Uint8Array(fftSize / 2)
  )

  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)

  // Init audio once
  useEffect(() => {
    const loadAudio = async () => {
      const context = new AudioContext()
      setAudioContext(context)

      const url =
        typeof source === 'string' ? source : URL.createObjectURL(source)
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const buffer = await context.decodeAudioData(arrayBuffer)
      setAudioBuffer(buffer)

      const analyser = context.createAnalyser()
      analyser.fftSize = fftSize
      analyser.smoothingTimeConstant = 0.8

      analyserRef.current = analyser
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)

      // Start the data update loop
      const update = () => {
        requestAnimationFrame(update)
        if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current)
          setFrequencyData(new Uint8Array(dataArrayRef.current)) // copy for React
        }
      }

      update()
    }

    loadAudio()

    return () => {
      audioContext?.close()
    }
  }, [source, fftSize])

  const play = useCallback(() => {
    if (!audioContext || !audioBuffer || isPlaying) return

    const sourceNode = audioContext.createBufferSource()
    sourceNode.buffer = audioBuffer

    sourceNode.connect(analyserRef.current!)
    analyserRef.current!.connect(audioContext.destination)

    sourceNode.start()
    sourceNodeRef.current = sourceNode
    setIsPlaying(true)
  }, [audioContext, audioBuffer, isPlaying])

  const pause = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop()
      sourceNodeRef.current.disconnect()
      sourceNodeRef.current = null
      setIsPlaying(false)
    }
  }, [])

  return {
    frequencyData,
    isPlaying,
    play,
    pause,
  }
}
