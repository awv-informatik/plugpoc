import { GizmoHelper, GizmoViewcube, GizmoViewport } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import React from 'react'

export const ViewCube: React.FC = () => {
  const { gl, scene, camera } = useThree()
  // Takes over render queue so that we can autoclear the scene, this allows
  // Plugins to draw on top of it for their own purposes
  useFrame(() => {
    gl.autoClear = true
    gl.render(scene, camera)
  }, 1)

  return (
    <GizmoHelper renderPriority={2} alignment="top-right" margin={[80, 80]}>
      <group scale={0.8}>
        <group scale={2.25} position={[-30, -30, -30]} rotation={[0, 0, 0]}>
          <GizmoViewport
            disabled
            axisScale={[0.8, 0.02, 0.02]}
            axisHeadScale={0.45}
            hideNegativeAxes
            labelColor="black"
          />
        </group>
        <GizmoViewcube
          font="24px Inter var, Arial, sans-serif"
          faces={['Right', 'Left', 'Back', 'Front', 'Top', 'Bottom']}
        />
      </group>
    </GizmoHelper>
  )
}
