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

const { run } = create()

const Expressions: React.FC<{ drawingId: DrawingID }> = props => {
  const { drawingId } = props
  const partId = useDrawing(drawingId, d => d.structure.root) || 0
  const { names, details } = useExpressions(drawingId, partId, run)
  return (
    <>
      {names.map(name => (
        <div key={name} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '200px' }}>
          <div>{name}</div>
          <input
            type={'number'}
            defaultValue={details[name].value}
            onBlur={e =>
              Number(details[name].value) !== Number(e.target.value) && details[name].onChange(name, e.target.value)
            }></input>
        </div>
      ))}
    </>
  )
}

export default function App() {
  const drawingId = useBuerli(state => state.drawing.active)

  React.useEffect(() => {
    run(async api => {
      await api.loadFromUrl('https://raw.githubusercontent.com/awv-informatik/buerligons/main/samples/Clamp.of1')
    })
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
