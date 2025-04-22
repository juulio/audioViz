import { useRef, useCallback } from 'react'
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
const AUDIO_URL = '/your-audio-file.mp3'

export const VisualizerScene = () => {
  const frequencyData = useAudioAnalyser(AUDIO_URL, BAR_COUNT * 2)
  const barRefs = useRef<Array<BABYLON.Mesh>>([])

  const onSceneReady = useCallback((scene: Scene) => {
    // Glow effect
    new GlowLayer('glow', scene)

    // Create bars in a circle
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
      const scaleY = value / 32 // Scale factor tweak here
      bar.scaling.y = Math.max(scaleY, 0.1)
      bar.position.y = bar.scaling.y / 2
    })
  }, [frequencyData])

  return <BabylonCanvas onSceneReady={onSceneReady} onRender={onRender} />
}
