import { useEffect, useRef, useState } from 'react'

export function useAudioAnalyser(audioUrl: string, fftSize = 128) {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(
    new Uint8Array(fftSize / 2)
  )

  useEffect(() => {
    const init = async () => {
      const context = new AudioContext()
      setAudioContext(context)

      const response = await fetch(audioUrl)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await context.decodeAudioData(arrayBuffer)

      const source = context.createBufferSource()
      source.buffer = audioBuffer

      const analyser = context.createAnalyser()
      analyser.fftSize = fftSize
      analyser.smoothingTimeConstant = 0.8

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      analyserRef.current = analyser
      dataArrayRef.current = dataArray

      source.connect(analyser)
      analyser.connect(context.destination)
      source.start()

      const update = () => {
        requestAnimationFrame(update)
        if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current)
          setFrequencyData(new Uint8Array(dataArrayRef.current)) // copy so React updates
        }
      }

      update()
    }

    init()

    return () => {
      audioContext?.close()
    }
  }, [audioUrl, fftSize])

  return frequencyData
}
