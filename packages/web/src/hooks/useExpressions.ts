import { CCClasses, ccUtils } from '@buerli.io/classcad'
import { DrawingID, getDrawing, ObjectID } from '@buerli.io/core'
import { ApiHistory } from '@buerli.io/headless'
import { useDrawing } from '@buerli.io/react'
import React from 'react'

const isA = ccUtils.base.isA
const noId = Number.MIN_SAFE_INTEGER

type RunFunc = (callback: (api: ApiHistory) => Promise<void>) => Promise<void>

export const useExpressions = (drawingId: DrawingID, partId: ObjectID, run: RunFunc) => {
  const [stamp, setStamp] = React.useState(0)
  const children = useDrawing(drawingId, d => d.structure.tree[partId]?.children)

  const exprSetId = React.useMemo(() => {
    const tree = getDrawing(drawingId)?.structure.tree
    return children?.find(c => isA(tree[c]?.class, CCClasses.CCExpressionSet)) || noId
  }, [children, drawingId])

  const expressionMems = useDrawing(drawingId, d => d.structure.tree[exprSetId]?.members)

  const { names, details } = React.useMemo(() => {
    const exprNames = Object.getOwnPropertyNames(expressionMems || {})
    const visibleExpr = exprNames.filter(name => expressionMems?.[name].visible)
    const res: Record<string, any> = {}
    for (const expr of visibleExpr) {
      res[expr] = {
        value: expressionMems?.[expr]?.value,
        onChange: (name: string, value: any) => {
          run(async api => {
            await api.setExpressions(partId, { name, value })
            setStamp(Date.now())
          })
        },
      }
    }
    return { names: visibleExpr, details: res }
  }, [expressionMems, partId, run])

  return { stamp, names, details }
}
