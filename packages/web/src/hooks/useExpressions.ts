import { CCClasses, ccUtils } from '@buerli.io/classcad'
import { DrawingID, getDrawing, ObjectID } from '@buerli.io/core'
import { useDrawing } from '@buerli.io/react'
import React from 'react'

const isA = ccUtils.base.isA
const noId = 0

export const useExpressions = (drawingId: DrawingID, partId: ObjectID) => {
  const children = useDrawing(drawingId, d => d.structure.tree[partId]?.children)

  const exprSetId = React.useMemo(() => {
    const tree = getDrawing(drawingId)?.structure.tree
    return children?.find(c => isA(tree[c]?.class, CCClasses.CCExpressionSet)) || noId
  }, [children, drawingId])

  const expressionMems = useDrawing(drawingId, d => d.structure.tree[exprSetId]?.members)

  const expressions = React.useMemo(() => {
    const exprNames = Object.getOwnPropertyNames(expressionMems || {})
    const visibleExpr = exprNames.filter(name => expressionMems?.[name].visible)
    return visibleExpr.map(name => ({ name, value: expressionMems?.[name]?.value }))
  }, [expressionMems])

  return expressions
}
