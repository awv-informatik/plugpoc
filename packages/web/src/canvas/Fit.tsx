import { DrawingID, GeometryBounds } from '@buerli.io/core'
import { useDrawing } from '@buerli.io/react'
import { Bounds, useBounds } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import React from 'react'

const EMPTYARR = [] as never[]

const useIsLoading = (drawingId: DrawingID) => {
  const pending = useDrawing(drawingId, d => d.cad.pending) || EMPTYARR
  const loads = React.useMemo(() => {
    return pending.filter(p => p.name === 'BaseModeler.Load' || p.name === 'BaseModeler.LoadFromUrl')
  }, [pending])
  return loads.length > 0
}

/**
 * Fit to scene bounds if the ClassCAD geometry bounds changed.
 */
function Refresh({ ccBounds }: { ccBounds: GeometryBounds }) {
  const bounds = useBounds()

  React.useEffect(() => {
    bounds?.refresh().clip().fit()
  }, [bounds, ccBounds])

  return null
}

/**
 * Fit to scene bounds if the user double clicks the Canvas.
 */
function DblClick() {
  const bounds = useBounds()
  const gl = useThree(state => state.gl)

  React.useEffect(() => {
    function onDoubleClick() {
      bounds?.refresh().clip().fit()
    }
    gl.domElement.addEventListener('dblclick', onDoubleClick, { passive: true })
    return () => {
      gl.domElement.removeEventListener('dblclick', onDoubleClick)
    }
  }, [bounds, gl.domElement])

  return null
}

/**
 * Fits three scene to its bounds.
 */
export function Fit({ drawingId, children }: { drawingId: DrawingID; children?: React.ReactNode }) {
  const isLoading = useIsLoading(drawingId)
  const ccBounds = useDrawing(drawingId, d => d.geometry.bounds) as GeometryBounds

  return (
    <Bounds>
      {children}
      <DblClick />
      {isLoading && <Refresh ccBounds={ccBounds} />}
    </Bounds>
  )
}
