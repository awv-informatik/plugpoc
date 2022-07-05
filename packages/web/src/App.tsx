import { BuerliGeometry, useBuerli } from '@buerli.io/react'
import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import React from 'react'
import { Fit } from './canvas/Fit'
import Lights from './canvas/Lights'
import './styles.css'
import { create } from './wrapper'

const { run } = create()

export default function App() {
  const drawingId = useBuerli(state => state.drawing.active)

  React.useEffect(() => {
    run(async api => {
      await api.loadFromUrl('https://raw.githubusercontent.com/awv-informatik/buerligons/main/samples/Clamp.of1')
    })
  }, [])

  return (
    <div className="App">
      <h1>Plug POC</h1>
      <div className="Container">
        <Canvas linear={true} dpr={[1, 2]} frameloop="demand" orthographic>
          {drawingId && (
            <Fit drawingId={drawingId}>
              <BuerliGeometry drawingId={drawingId} selection={false} />
              <Lights drawingId={drawingId} />
            </Fit>
          )}
          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
        </Canvas>
      </div>
    </div>
  )
}
