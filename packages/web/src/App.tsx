import { DrawingID, ObjectID, ObjectIdent } from '@buerli.io/core'
import { Transform } from '@buerli.io/headless'
import { BuerliGeometry, useBuerli } from '@buerli.io/react'
import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import React from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Fit, useFit } from './canvas/Fit'
import { Lights } from './canvas/Lights'
import { ViewCube } from './canvas/ViewCube'
import { useExpressions } from './hooks/useExpressions'
import { useMappedId } from './hooks/useMappedId'
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

const rootIdent = uuidv4()
const carrierIdent = uuidv4()
const pin1Ident = uuidv4()
const pin2Ident = uuidv4()
const sleeve1Ident = uuidv4()
const sleeve2Ident = uuidv4()

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
  const [readyStamp, setReadyStamp] = React.useState(0)

  const carrierId = useMappedId(drawingId!, carrierIdent)
  const expressions = useExpressions(drawingId!, carrierId!)
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
      await api.createRootAssembly('Assembly', { ident: rootIdent })
      await api.loadProductFromUrl(CARRIER_URL, OF1 as any, { ident: carrierIdent })?.[0]
      await api.loadProductFromUrl(PIN1_URL, STP, { ident: pin1Ident })?.[0]
      await api.loadProductFromUrl(SLEEVE1_URL, STP, { ident: sleeve1Ident })?.[0]
      await api.loadProductFromUrl(PIN2_URL, STP, { ident: pin2Ident })?.[0]
      await api.loadProductFromUrl(SLEEVE2_URL, STP, { ident: sleeve2Ident })?.[0]

      await api.addNodes({
        productId: carrierIdent,
        ownerId: rootIdent,
        transformation: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
        ],
      })

      setReadyStamp(Date.now())
      fit()
    })
  }, [fit])

  React.useEffect(() => {
    run(async api => {
      const toRemove = activeNodes.current.map(n => ({ referenceId: n }))
      await api.removeNodes(...toRemove)

      if (readyStamp <= 0) return // Use readyStamp to prevent hook dependency eslint error
      const pinId = pin_dia < 2 ? pin1Ident : pin2Ident
      const sleeveId = pin_dia < 2 ? sleeve1Ident : sleeve2Ident
      const nodes: { productId: ObjectIdent; ownerId: ObjectIdent; transformation: Transform }[] = []
      for (let ix = 0; ix < pin_count_x; ix++) {
        for (let iy = 0; iy < pin_count_y; iy++) {
          nodes.push({
            productId: pinId,
            ownerId: rootIdent,
            transformation: [
              { x: -first_pin_x + pin_dist_x * ix, y: first_pin_y - pin_dist_y * iy, z: 75 },
              { x: 1, y: 0, z: 0 },
              { x: 0, y: 1, z: 0 },
            ],
          })

          nodes.push({
            productId: sleeveId,
            ownerId: rootIdent,
            transformation: [
              { x: -first_pin_x + pin_dist_x * ix, y: first_pin_y - pin_dist_y * iy, z: 50 },
              { x: 1, y: 0, z: 0 },
              { x: 0, y: 1, z: 0 },
            ],
          })
        }
      }

      const added = await api.addNodes(...nodes)
      activeNodes.current = added || []
      console.info(activeNodes.current)
    })
  }, [first_pin_x, first_pin_y, pin_count_x, pin_count_y, pin_dist_x, pin_dist_y, activeNodes, readyStamp, pin_dia])

  return (
    <div className="App">
      <div style={{ zIndex: 10, position: 'absolute', top: '20px', left: '20px', paddingLeft: '50px' }}>
        <h2>Plug POC</h2>
        <h3>Carrier</h3>
        {drawingId && carrierId && <Expressions drawingId={drawingId} partId={carrierId} />}
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
