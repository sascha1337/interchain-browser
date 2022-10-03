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
const createIPFSHandler = require('./ipfs-protocol')
const createBrowserHandler = require('./browser-protocol')
const createGeminiHandler = require('./gemini-protocol')
const createBTHandler = require('./bt-protocol')
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
    { scheme: 'hybrid', privileges: BROWSER_PRIVILEGES },
    { scheme: 'magnet', privileges: LOW_PRIVILEGES },
    { scheme: 'gemini', privileges: P2P_PRIVILEGES },
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
  app.setAsDefaultProtocolClient('gemini')

  const { handler: browserProtocolHandler } = await createBrowserHandler()
  sessionProtocol.registerStreamProtocol('hybrid', browserProtocolHandler)
  globalProtocol.registerStreamProtocol('hybrid', browserProtocolHandler)

  // console.log('hyper start')
  const { handler: hyperProtocolHandler, close: closeHyper } = await createHyperHandler(hyperOptions, session)
  onCloseHandlers.push(closeHyper)
  sessionProtocol.registerStreamProtocol('hyper', hyperProtocolHandler)
  globalProtocol.registerStreamProtocol('hyper', hyperProtocolHandler)
  // console.log('hyper finish')

  // console.log('ipfs start')
  const { handler: ipfsProtocolHandler, close: closeIPFS } = await createIPFSHandler(ipfsOptions, session)
  onCloseHandlers.push(closeIPFS)
  sessionProtocol.registerStreamProtocol('ipfs', ipfsProtocolHandler)
  globalProtocol.registerStreamProtocol('ipfs', ipfsProtocolHandler)
  // console.log('ipfs finish')

  // console.log('bt start')
  const { handler: btHandler, close: closeBT } = await createBTHandler(btOptions, session)
  onCloseHandlers.push(closeBT)
  sessionProtocol.registerStreamProtocol('bt', btHandler)
  globalProtocol.registerStreamProtocol('bt', btHandler)
  // console.log('bt finish')

  const magnetHandler = await createMagnetHandler()
  sessionProtocol.registerStreamProtocol('magnet', magnetHandler)
  globalProtocol.registerStreamProtocol('magnet', magnetHandler)

  const { handler: torHandler } = await createTorHandler(torOptions, session)
  sessionProtocol.registerStreamProtocol('tor', torHandler)
  globalProtocol.registerStreamProtocol('tor', torHandler)
  sessionProtocol.registerStreamProtocol('tors', torHandler)
  globalProtocol.registerStreamProtocol('tors', torHandler)

  const { handler: geminiProtocolHandler } = await createGeminiHandler()
  sessionProtocol.registerStreamProtocol('gemini', geminiProtocolHandler)
  globalProtocol.registerStreamProtocol('gemini', geminiProtocolHandler)
}