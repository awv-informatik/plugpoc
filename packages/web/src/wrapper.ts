/* eslint-disable no-shadow */
import { init, SocketIOClient } from '@buerli.io/classcad'
import { ApiHistory, history } from '@buerli.io/headless'

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
//   - Taken from an other proof of concept
/////////////////////////////////////////////////

type Await<T> = T extends Promise<infer V> ? V : never

const create = <Return = ApiHistory>() => {
  const instance = new history()
  const api = new Promise<Return>(res => instance.init(api => res(api as unknown as Return)))
  return {
    run: async <Fn extends (api: Return) => Promise<unknown>>(callback: Fn) =>
      callback(await api) as Await<ReturnType<Fn>>,
  }
}

export { create }
