/* eslint-env browser */

import React, { Component, PropTypes } from 'react'
import { Provider } from 'react-redux'
import GithubCorner from 'react-github-corner'
import { loadEvents } from '../../ducks/events'
import { loadNotes } from '../../ducks/notes'
import AuthBox from '../AuthBox/AuthBox'
import EventLog from '../EventLog/EventLog'
import Notes from '../Notes/Notes'
import RawViewModal from '../RawView/RawViewModal'
import logo from './logo.svg'
import './App.css'

const propTypes = {
  store: PropTypes.shape({
    dispatch: PropTypes.func.isRequired,
    subscribe: PropTypes.func.isRequired
  }).isRequired
}

class App extends Component {
  state = { websocket: null }

  componentWillMount () {
    const { store } = this.props

    store.dispatch(loadEvents('/api/events?limit=50&order=DESC'))
    store.dispatch(loadNotes('/api/notes?order=DESC'))

    try {
      this.setState({ websocket: this.connectToWebsocket(store) })
    } catch (error) {
      console.error(error.stack)
    }
  }

  componentWillUnmount () {
    const { websocket } = this.state
    websocket.close()
  }

  connectToWebsocket (store) {
    const { hostname, port } = document.location
    const fixedPort = parseInt(port, 10) === 3000 ? 4000 : port   // so the dev server proxy is not used

    const wsProtocol = document.location.protocol.match(/^https:$/i) ? 'wss:' : 'ws:'
    const websocket = new WebSocket(`${wsProtocol}//${hostname}:${fixedPort}/websocket`)
    websocket.onmessage = this.onWebSocketMessage.bind(this, store)

    return websocket
  }

  onWebSocketMessage (store, event) {
    const remoteEvents = JSON.parse(event.data)
    remoteEvents.forEach((remoteEvent) => store.dispatch(remoteEvent))
  }

  render () {
    const { store } = this.props

    return (
      <Provider store={store}>
        <div className='App'>
          <GithubCorner
            href='https://github.com/flux-capacitor/flux-capacitor'
            bannerColor='#FD6C6C'
            octoColor='#fff'
            width={80}
            height={80}
            direction='right'
          />
          <div className='App-header'>
            <img src={logo} className='App-logo' alt='logo' />
          </div>
          <section className='App-intro'>
            <AuthBox />
            <div className='clear flex-row flex-wrap'>
              <Notes />
              <EventLog />
            </div>
            <div className='text-justify'>
              <h4>What is happening here?</h4>
              <p>
                The <a href='https://github.com/flux-capacitor/flux-capacitor'>⚛&nbsp;<b>Flux Capacitor</b></a> powers
                the event log and the realtime updates. It handles the dispatched events (actions) and invokes the reducers.
              </p>
              <p>
                The notes and the last 50 events are initially requested from the
                server and a websocket connection pushes every new event in realtime.
              </p>
              <p>
                The pushed events are reduced on the client to update the notes
                using the backend reducer and <a href='https://www.npmjs.com/package/flux-capacitor-reduxify'>reduxify</a>.
              </p>
              <p>
                All the data here is live data from the server. Try opening this app in
                a new window and change something there!
              </p>
              <h4>Pants down. Show me the sources!</h4>
              <p>
                <span>Check out the </span>
                <a href='https://github.com/flux-capacitor/flux-capacitor/tree/master/sample/frontend' rel='nofollow'>Frontend</a>
                <span> and </span>
                <a href='https://github.com/flux-capacitor/flux-capacitor/tree/master/sample/server' rel='nofollow'>Server</a>
                <span> sources.</span>
              </p>
            </div>
          </section>
          <RawViewModal />
        </div>
      </Provider>
    )
  }
}

App.propTypes = propTypes

export default App
