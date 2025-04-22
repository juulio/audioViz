import { useEffect, useRef } from 'react'
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
} from '@babylonjs/core'

interface BabylonCanvasProps {
  onSceneReady: (scene: Scene) => void
  onRender?: (scene: Scene) => void
}

export const BabylonCanvas = ({
  onSceneReady,
  onRender,
}: BabylonCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const engine = new Engine(canvasRef.current, true)
    const scene = new Scene(engine)

    // Default camera and light
    const camera = new ArcRotateCamera(
      'camera',
      Math.PI / 2,
      Math.PI / 3,
      10,
      new Vector3(0, 0, 0),
      scene
    )
    camera.attachControl(canvasRef.current, true)

    new HemisphericLight('light1', new Vector3(1, 1, 0), scene)

    // Call scene-ready handler
    onSceneReady(scene)

    engine.runRenderLoop(() => {
      onRender?.(scene)
      scene.render()
    })

    const handleResize = () => engine.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      scene.dispose()
      engine.dispose()
      window.removeEventListener('resize', handleResize)
    }
  }, [onSceneReady, onRender])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100vh' }} />
}
