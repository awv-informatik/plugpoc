import { CCClasses, ccUtils } from '@buerli.io/classcad'
import { ArrayMem, DrawingID, getDrawing, NOID, ObjectID, ObjectIdent } from '@buerli.io/core'
import { useDrawing } from '@buerli.io/react'
import React from 'react'

const useIdentMap = (drawingId: DrawingID, rootId: ObjectID) => {
  const rootChildren = useDrawing(drawingId, d => d.structure.tree[rootId])?.children
  const identMap = React.useMemo(() => {
    return rootChildren
      ? ccUtils.base.getChildren(rootId, CCClasses.IdentToIdMap, getDrawing(drawingId).structure.tree)?.[0]
      : NOID
  }, [drawingId, rootChildren, rootId])
  return identMap
}

const EMPTY: never[] = []

export const useMappedId = (drawingId: DrawingID, ident: ObjectIdent) => {
  const rootId = useDrawing(drawingId, d => d.structure.root)
  const identMapId = useIdentMap(drawingId, rootId!)
  const identMap = useDrawing(drawingId, d => d.structure.tree[identMapId || NOID])
  const map = (identMap?.members?.map as ArrayMem)?.members || EMPTY
  const mappedId = React.useMemo(() => {
    const arr = map.map(m => (m as ArrayMem).members.map(m1 => m1.value))
    const res = arr.find(entry => entry[0] === ident)
    return (res && res.length > 0 ? res[1] : NOID) as number
  }, [ident, map])
  return mappedId
}
