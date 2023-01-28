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

const OF1 = 'of1'
const STP = 'stp'
const BASE_URL = 'https://raw.githubusercontent.com/awv-informatik/plugpoc/main/models'
const CARRIER_URL = `${BASE_URL}/Carrier.of1`
const PIN1_URL = `${BASE_URL}/1Pin.stp`
const SLEEVE1_URL = `${BASE_URL}/1Sleeve.stp`
const PIN2_URL = `${BASE_URL}/2Pin.stp`
const SLEEVE2_URL = `${BASE_URL}/2Sleeve.stp`

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
                api.setExpressions({ partId, members: [{ name: expr.name, value: e.target.value }] })
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

  const [ids, setIds] = React.useState({
    assemblyId: 0,
    carrierId: 0,
    pin1Id: 0,
    sleeve1Id: 0,
    pin2Id: 0,
    sleeve2Id: 0,
  })

  const expressions = useExpressions(drawingId!, ids.carrierId)
  const {
    // carrier_rect_depth,
    // carrier_rect_hight,
    // carrier_rect_with,
    first_pin_x,
    first_pin_y,
    pin_count_x,
    pin_count_y,
    pin_dia,
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
      const asmId = (await api.createRootAssembly()) || 0
      const cId = (await api.loadProductFromUrl(CARRIER_URL, OF1 as any))?.[0] || 0
      const p1Id = (await api.loadProductFromUrl(PIN1_URL, STP))?.[0] || 0
      const s1Id = (await api.loadProductFromUrl(SLEEVE1_URL, STP))?.[0] || 0
      const p2Id = (await api.loadProductFromUrl(PIN2_URL, STP))?.[0] || 0
      const s2Id = (await api.loadProductFromUrl(SLEEVE2_URL, STP))?.[0] || 0

      await api.addNodes({
        productId: cId!,
        ownerId: asmId,
        transformation: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
        ],
      })

      setIds({ assemblyId: asmId, carrierId: cId, pin1Id: p1Id, sleeve1Id: s1Id, pin2Id: p2Id, sleeve2Id: s2Id })
      fit()
    })
  }, [fit])

  React.useEffect(() => {
    run(async api => {
      const { assemblyId, pin1Id, sleeve1Id, pin2Id, sleeve2Id } = ids
      const pinId = pin_dia < 2 ? pin1Id : pin2Id
      const sleeveId = pin_dia < 2 ? sleeve1Id : sleeve2Id
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
              { x: -first_pin_x + pin_dist_x * ix, y: first_pin_y - pin_dist_y * iy, z: 50 },
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
  }, [first_pin_x, first_pin_y, pin_count_x, pin_count_y, pin_dist_x, pin_dist_y, activeNodes, ids, pin_dia])

  return (
    <div className="App">
      <div style={{ zIndex: 10, position: 'absolute', top: '20px', left: '20px', paddingLeft: '50px' }}>
        <h2>Plug POC</h2>
        <h3>Carrier</h3>
        {drawingId && ids.carrierId && <Expressions drawingId={drawingId} partId={ids.carrierId} />}
      </div>
      <div className="Container">
        <Canvas linear={true} dpr={[1, 2]} frameloop="demand" orthographic>
          <Fit>
            {drawingId && (
              <>
                <BuerliGeometry drawingId={drawingId} selection={false} />
                <Lights drawingId={drawingId} />
              </>
            )}
          </Fit>
          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
          <ViewCube />
        </Canvas>
      </div>
    </div>
  )
}

export default App
