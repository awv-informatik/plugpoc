import { DrawingID, ObjectID } from '@buerli.io/core'
import { Transform } from '@buerli.io/headless'
import { BuerliGeometry, useBuerli } from '@buerli.io/react'
import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import React from 'react'
import { Fit, useFit } from './canvas/Fit'
import { Lights } from './canvas/Lights'
import { ViewCube } from './canvas/ViewCube'
import { useExpressions } from './hooks/useExpressions'
import './styles.css'
import { create } from './wrapper'

const FILE_TYPE = 'of1'
const BASE_URL = 'https://raw.githubusercontent.com/awv-informatik/plugpoc/main/models'
const CARRIER_URL = `${BASE_URL}/Carrier.of1`
const PIN_URL = `${BASE_URL}/Pin.of1`
const SLEEVE_URL = `${BASE_URL}/Sleeve.of1`

const { run } = create()

const Expressions: React.FC<{ drawingId: DrawingID; partId: ObjectID }> = props => {
  const { drawingId, partId } = props
  const expressions = useExpressions(drawingId, partId)
  return (
    <>
      {expressions.map(expr => (
        <div key={expr.name} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: 'auto' }}>
          <div>{expr.name}</div>
          <input
            defaultValue={expr.value as any}
            onBlur={e =>
              expr.value?.toString() !== e.target.value.toString() &&
              run(async api => {
                api.setExpressions(partId, { name: expr.name, value: e.target.value })
              })
            }
          />
        </div>
      ))}
    </>
  )
}

const App: React.FC = () => {
  const drawingId = useBuerli(state => state.drawing.active)
  const fit = useFit(f => f.fit)
  const activeNodes = React.useRef<ObjectID[]>([])

  const [ids, setIds] = React.useState({ assemblyId: 0, carrierId: 0, pinId: 0, sleeveId: 0 })

  const expressions = useExpressions(drawingId!, ids.carrierId)
  const {
    // carrier_rect_depth,
    // carrier_rect_hight,
    // carrier_rect_with,
    first_pin_x,
    first_pin_y,
    pin_count_x,
    pin_count_y,
    // pin_dia,
    pin_dist_x,
    pin_dist_y,
  } = React.useMemo(() => {
    const values: any = {}
    for (const expr of expressions) {
      values[expr.name] = Number(expr.value)
    }
    return values
  }, [expressions])

  React.useEffect(() => {
    run(async api => {
      const asmId = await api.createRootAssembly()
      const cId = (await api.loadProductFromUrl(CARRIER_URL, FILE_TYPE))?.[0]
      const pId = (await api.loadProductFromUrl(PIN_URL, FILE_TYPE))?.[0]
      const sId = (await api.loadProductFromUrl(SLEEVE_URL, FILE_TYPE))?.[0]

      await api.addNode(cId!, asmId, [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ])

      setIds({ assemblyId: asmId || 0, carrierId: cId || 0, pinId: pId || 0, sleeveId: sId || 0 })
      fit()
    })
  }, [fit])

  React.useEffect(() => {
    run(async api => {
      const { assemblyId, pinId, sleeveId } = ids
      const nodes: { productId: ObjectID; ownerId: ObjectID; transformation: Transform }[] = []
      for (let ix = 0; ix < pin_count_x; ix++) {
        for (let iy = 0; iy < pin_count_y; iy++) {
          nodes.push({
            productId: pinId,
            ownerId: assemblyId,
            transformation: [
              { x: -first_pin_x + pin_dist_x * ix, y: first_pin_y - pin_dist_y * iy, z: 75 },
              { x: 1, y: 0, z: 0 },
              { x: 0, y: 1, z: 0 },
            ],
          })

          nodes.push({
            productId: sleeveId,
            ownerId: assemblyId,
            transformation: [
              { x: -first_pin_x + pin_dist_x * ix, y: first_pin_y - pin_dist_y * iy, z: 25 },
              { x: 1, y: 0, z: 0 },
              { x: 0, y: 1, z: 0 },
            ],
          })
        }
      }
      const toRemove = activeNodes.current.map(n => ({ referenceId: n, ownerId: assemblyId }))
      await api.removeNodes(...toRemove)
      const added = await api.addNodes(...nodes)
      activeNodes.current = added || []
    })
  }, [first_pin_x, first_pin_y, pin_count_x, pin_count_y, pin_dist_x, pin_dist_y, activeNodes, ids])

  return (
    <div className="App">
      <div style={{ zIndex: 10, position: 'absolute', top: '20px', left: '20px', paddingLeft: '50px' }}>
        <h2>Plug POC</h2>
        <h3>Carrier</h3>
        {drawingId && ids.carrierId && <Expressions drawingId={drawingId} partId={ids.carrierId} />}
        <h3>Pin</h3>
        {drawingId && ids.pinId && <Expressions drawingId={drawingId} partId={ids.pinId} />}
        <h3>Sleeve</h3>
        {drawingId && ids.sleeveId && <Expressions drawingId={drawingId} partId={ids.sleeveId} />}
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
          <ViewCube />
        </Canvas>
      </div>
    </div>
  )
}

export default App
