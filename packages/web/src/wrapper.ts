/* eslint-disable no-shadow */
import { ccAPI, init, SocketIOClient } from '@buerli.io/classcad'
import { DrawingID, ObjectID } from '@buerli.io/core'
import { ApiHistory, history } from '@buerli.io/headless'
import { suspend } from 'suspend-react'

/////////////////////////////////////////////////
// Init connection between Buerli and ClassCAD //
/////////////////////////////////////////////////

const CCSERVERURL = 'ws://localhost:8182'
init(id => new SocketIOClient(CCSERVERURL, id), {
  config: { geometry: { points: { hidden: true }, edges: { color: 'black' } } },
})

/////////////////////////////////////////////////
// Buerli API creator function
//   - Creates the history api instance
//   - Wraps the history into a suspense mechanism
//   - Taken from an other proof of concept
/////////////////////////////////////////////////

type Tuple<T = any> = [T] | T[]
type Await<T> = T extends Promise<infer V> ? V : never

const create = <Return = PlugAPI>() => {
  const instance = new PlugHistory()
  const api = new Promise<Return>(res => instance.init(api => res(api as unknown as Return)))
  return {
    cache: <Keys extends Tuple<unknown>, Fn extends (api: Return, ...keys: Keys) => Promise<unknown>>(
      callback: Fn,
      dependencies: Keys,
    ) => suspend(async (...keys: Keys) => callback(await api, ...keys) as Await<ReturnType<Fn>>, dependencies),
    run: async <Fn extends (api: Return) => Promise<unknown>>(callback: Fn) =>
      callback(await api) as Await<ReturnType<Fn>>,
  }
}

///////////////////////////////////////////////
// PROTOTYP API
///////////////////////////////////////////////

export type PlugAPI = ApiHistory & ReturnType<typeof plugAPI>

const plugAPI = (instance: PlugHistory) => ({
  getApi: async () => instance._api,

  getDrawingId: async () => instance.drId,

  loadFromUrl: async (url: string, type: 'of1' = 'of1') => {
    const response = await ccAPI.base.callSafeAPI(instance.drId, 'BaseModeler', 'LoadFromUrl', [url, type])
    if (response && response.results.length > 0) {
      return response.results[0]?.result as ObjectID[]
    }
    return null
  },

  saveToUrl: async (url: string, type: 'of1' = 'of1') => {
    const response = await ccAPI.base.callSafeAPI(instance.drId, 'BaseModelerAPI', 'LoadFromUrl', [url, type])
    if (response && response.results.length > 0) {
      return response.results[0]?.result as ObjectID[]
    }
    return null
  },
})

class PlugHistory extends history {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  _api: PlugAPI
  override init(callback: (api: PlugAPI) => void) {
    return super.init(api => {
      const ext = plugAPI(this)
      const innerAPI = { ...api, ...ext }
      this._api = innerAPI
      callback(innerAPI)
    })
  }

  public get drId(): DrawingID {
    return (this as any).drawingId
  }
}

export { create }
