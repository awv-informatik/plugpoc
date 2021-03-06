import { DrawingID } from '@buerli.io/core'
import { BuerliGeometry, useBuerli, useDrawing } from '@buerli.io/react'
import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import React from 'react'
import { Fit } from './canvas/Fit'
import Lights from './canvas/Lights'
import { useExpressions } from './hooks/useExpressions'
import './styles.css'
import { create } from './wrapper'

const FILE_URL = 'https://raw.githubusercontent.com/awv-informatik/plugpoc/main/models/Box.of1'
const FILE_TYPE = 'of1'

const { run } = create()

const Expressions: React.FC<{ drawingId: DrawingID }> = props => {
  const { drawingId } = props
  const partId = useDrawing(drawingId, d => d.structure.root) || 0
  const expressions = useExpressions(drawingId, partId)
  return (
    <>
      {expressions.map(expr => (
        <div key={expr.name} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '200px' }}>
          <div>{expr.name}</div>
          <input
            defaultValue={expr.value as any}
            onBlur={e =>
              expr.value?.toString() !== e.target.value.toString() &&
              run(async api => {
                api.setExpressions(partId, { name: expr.name, value: e.target.value })
              })
            }></input>
        </div>
      ))}
    </>
  )
}

export default function App() {
  const drawingId = useBuerli(state => state.drawing.active)

  React.useEffect(() => {
    run(async api => api.loadFromUrl(FILE_URL, FILE_TYPE))
  }, [])

  return (
    <div className="App">
      <div style={{ paddingLeft: '50px' }}>
        <h2>Plug POC</h2>
        {drawingId && <Expressions drawingId={drawingId} />}
      </div>
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
