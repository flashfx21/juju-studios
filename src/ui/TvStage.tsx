// ABOUTME: The big-screen frame: lays a TV screen out at the designed 1280x720, then scales it to fit the window.
// ABOUTME: Letterboxes when the window is not 16:9, so every TV screen matches the design exactly.
import { useEffect, useState, type ReactNode } from 'react'
import './TvStage.css'

const STAGE_WIDTH = 1280
const STAGE_HEIGHT = 720

function fitScale() {
  return Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT)
}

export function TvStage({ label, children }: { label: string; children: ReactNode }) {
  const [scale, setScale] = useState(fitScale)

  useEffect(() => {
    const onResize = () => setScale(fitScale())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className="tv-stage">
      <main
        className="tv-stage__screen"
        aria-label={label}
        style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform: `scale(${scale})` }}
      >
        {children}
      </main>
    </div>
  )
}
