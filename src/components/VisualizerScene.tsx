import { useRef, useState, useCallback } from 'react'
import { Scene } from '@babylonjs/core'
import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  GlowLayer,
  Vector3,
} from '@babylonjs/core'
import { BabylonCanvas } from './BabylonCanvas'
import { useAudioAnalyser } from '../hooks/useAudioAnalyzer'

const BAR_COUNT = 64
const DEFAULT_AUDIO_URL = '/your-audio-file.mp3'

export const VisualizerScene = () => {
  const [audioSource, setAudioSource] = useState<File | string>(
    DEFAULT_AUDIO_URL
  )
  const { frequencyData, play, pause, isPlaying } = useAudioAnalyser(
    audioSource,
    BAR_COUNT * 2
  )
  const barRefs = useRef<Array<BABYLON.Mesh>>([])

  const onSceneReady = useCallback((scene: Scene) => {
    new GlowLayer('glow', scene)

    const radius = 4
    for (let i = 0; i < BAR_COUNT; i++) {
      const angle = (i / BAR_COUNT) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius

      const bar = MeshBuilder.CreateBox(
        `bar-${i}`,
        { height: 1, width: 0.2, depth: 0.2 },
        scene
      )
      bar.position = new Vector3(x, 0.5, z)
      bar.lookAt(Vector3.Zero())

      const mat = new StandardMaterial(`mat-${i}`, scene)
      mat.emissiveColor = Color3.Random()
      bar.material = mat

      barRefs.current[i] = bar
    }
  }, [])

  const onRender = useCallback(() => {
    frequencyData.forEach((value, i) => {
      const bar = barRefs.current[i]
      if (!bar) return

      const targetScaleY = Math.max(value / 64, 0.1)
      const clampedY = Math.min(targetScaleY, 5)

      // Smoothly interpolate current scale toward target
      const currentY = bar.scaling.y
      const lerpedY = currentY + (clampedY - currentY) * 0.02 // adjust 0.2 for smoother/slower transition

      bar.scaling.y = lerpedY
      bar.position.y = lerpedY / 2
    })
  }, [frequencyData])

  // const onRender = useCallback(() => {
  //   frequencyData.forEach((value, i) => {
  //     const bar = barRefs.current[i]
  //     if (!bar) return
  //     const scaleY = value / 92
  //     bar.scaling.y = Math.max(scaleY, 0.1)
  //     bar.position.y = bar.scaling.y / 2
  //   })
  // }, [frequencyData])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAudioSource(file)
    }
  }

  return (
    <>
      <div
        style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10 }}
      >
        <input type="file" accept="audio/*" onChange={handleFileChange} />
        <button
          onClick={isPlaying ? pause : play}
          style={{
            marginLeft: '1rem',
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>

      <BabylonCanvas onSceneReady={onSceneReady} onRender={onRender} />
    </>
  )
}
