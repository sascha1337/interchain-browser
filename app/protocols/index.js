const { app, protocol: globalProtocol } = require('electron')

const P2P_PRIVILEGES = {
  standard: true,
  secure: true,
  allowServiceWorkers: true,
  supportFetchAPI: true,
  bypassCSP: false,
  corsEnabled: true,
  stream: true
}

const BROWSER_PRIVILEGES = {
  standard: false,
  secure: true,
  allowServiceWorkers: false,
  supportFetchAPI: true,
  bypassCSP: false,
  corsEnabled: true
}

const LOW_PRIVILEGES = {
  standard: false,
  secure: false,
  allowServiceWorkers: false,
  supportFetchAPI: false,
  bypassCSP: false,
  corsEnabled: true
}

const {
  ipfsOptions,
  torOptions,
  hyperOptions,
  btOptions
} = require('../config')

const createHyperHandler = require('./hyper-protocol')
const createTorHandler = require('./tor-protocol')
const createIipHandler = require('./iip-protocol')
const createIPFSHandler = require('./ipfs-protocol')
const createBrowserHandler = require('./browser-protocol')
const createGeminiHandler = require('./gemini-protocol')
const createBTHandler = require('./bt-protocol')
const createGopherHandler = require('./gopher-protocol')
const createMagnetHandler = require('./magnet-protocol')

const onCloseHandlers = []

module.exports = {
  registerPrivileges,
  setupProtocols,
  close
}

async function close () {
  await Promise.all(onCloseHandlers.map((handler) => handler()))
}

function registerPrivileges () {
  globalProtocol.registerSchemesAsPrivileged([
    { scheme: 'hyper', privileges: P2P_PRIVILEGES },
    { scheme: 'ipfs', privileges: P2P_PRIVILEGES },
    { scheme: 'bt', privileges: P2P_PRIVILEGES },
    { scheme: 'tor', privileges: P2P_PRIVILEGES },
    { scheme: 'tors', privileges: P2P_PRIVILEGES },
    { scheme: 'iip', privileges: P2P_PRIVILEGES },
    { scheme: 'iips', privileges: P2P_PRIVILEGES },
    { scheme: 'hybrid', privileges: BROWSER_PRIVILEGES },
    { scheme: 'magnet', privileges: LOW_PRIVILEGES },
    { scheme: 'gopher', privileges: P2P_PRIVILEGES },
    { scheme: 'gemini', privileges: P2P_PRIVILEGES }
  ])
}

async function setupProtocols (session) {
  const { protocol: sessionProtocol } = session

  app.setAsDefaultProtocolClient('hybrid')
  app.setAsDefaultProtocolClient('hyper')
  app.setAsDefaultProtocolClient('ipfs')
  app.setAsDefaultProtocolClient('bt')
  app.setAsDefaultProtocolClient('tor')
  app.setAsDefaultProtocolClient('tors')
  app.setAsDefaultProtocolClient('iip')
  app.setAsDefaultProtocolClient('iips')
  app.setAsDefaultProtocolClient('gopher')
  app.setAsDefaultProtocolClient('gemini')

  const { handler: btHandler, close: closeBT, fetch: btFetch } = await createBTHandler(btOptions, session)
  onCloseHandlers.push(closeBT)
  sessionProtocol.registerStreamProtocol('bt', btHandler)
  globalProtocol.registerStreamProtocol('bt', btHandler)

  const magnetHandler = await createMagnetHandler()
  sessionProtocol.registerStreamProtocol('magnet', magnetHandler)
  globalProtocol.registerStreamProtocol('magnet', magnetHandler)

  const { handler: hyperHandler, close: closeHyper, fetch: hyperFetch } = await createHyperHandler(hyperOptions, session)
  onCloseHandlers.push(closeHyper)
  sessionProtocol.registerStreamProtocol('hyper', hyperHandler)
  globalProtocol.registerStreamProtocol('hyper', hyperHandler)

  const { handler: ipfsHandler, close: closeIPFS, fetch: ipfsFetch } = await createIPFSHandler(ipfsOptions, session)
  onCloseHandlers.push(closeIPFS)
  sessionProtocol.registerStreamProtocol('ipfs', ipfsHandler)
  globalProtocol.registerStreamProtocol('ipfs', ipfsHandler)

  const torHandler = await createTorHandler(torOptions, session)
  sessionProtocol.registerStreamProtocol('tor', torHandler)
  globalProtocol.registerStreamProtocol('tor', torHandler)
  sessionProtocol.registerStreamProtocol('tors', torHandler)
  globalProtocol.registerStreamProtocol('tors', torHandler)

  const iipHandler = await createIipHandler(torOptions, session)
  sessionProtocol.registerStreamProtocol('iip', iipHandler)
  globalProtocol.registerStreamProtocol('iip', iipHandler)
  sessionProtocol.registerStreamProtocol('iips', iipHandler)
  globalProtocol.registerStreamProtocol('iips', iipHandler)

  const gopherProtocolHandler = await createGopherHandler()
  sessionProtocol.registerStreamProtocol('gopher', gopherProtocolHandler)
  globalProtocol.registerStreamProtocol('gopher', gopherProtocolHandler)

  const geminiProtocolHandler = await createGeminiHandler()
  sessionProtocol.registerStreamProtocol('gemini', geminiProtocolHandler)
  globalProtocol.registerStreamProtocol('gemini', geminiProtocolHandler)

  const browserProtocolHandler = await createBrowserHandler({bt: btFetch, ipfs: ipfsFetch, hyper: hyperFetch})
  sessionProtocol.registerStreamProtocol('hybrid', browserProtocolHandler)
  globalProtocol.registerStreamProtocol('hybrid', browserProtocolHandler)
}