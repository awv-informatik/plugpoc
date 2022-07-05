import { init, SocketIOClient } from '@buerli.io/classcad'
import { render } from 'react-dom'
import App from './App'

/////////////////////////////////////////////////
// Init connection between Buerli and ClassCAD //
/////////////////////////////////////////////////
const CCSERVERURL = 'ws://localhost:8182'
init(id => new SocketIOClient(CCSERVERURL, id))

/////////////////////////////////////////////////
// Render the application component /////////////
/////////////////////////////////////////////////
const rootElement = document.getElementById('root')
render(<App />, rootElement)
