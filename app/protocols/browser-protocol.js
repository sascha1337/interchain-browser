const path = require('path')
const mime = require('mime/lite')
const ScopedFS = require('scoped-fs')
const { Readable } = require('stream')
const fs = new ScopedFS(path.join(__dirname, '../pages'))
const packageJSON = require('../../package.json')
const pathVar = path

const { theme } = require('../config')

const CHECK_PATHS = [
  (path) => path,
  (path) => path + pathVar.sep,
  (path) => path.slice(0, -1),
  (path) => path + 'index.html',
  (path) => path.slice(0, -1) + pathVar.sep + 'index.html',
  (path) => path + pathVar.sep + 'index.html',
  (path) => path + '.html',
  (path) => path.slice(0, -1) + '.html',
]

module.exports = async function createHandler () {

  function close () {}

  async function protocolHandler (req, sendResponse) {
    const { url } = req

    const parsed = new URL(url)
    const { pathname, hostname } = parsed
    const toResolve = path.join(hostname, pathname)

    if(hostname === 'about'){
      const statusCode = 200

      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Allow-CSP-From': '*',
        'Content-Type': 'text/html'
      }

      const htmlData = `<html><head><title>about</title></head><body>
      <p>This is a web browser for the peer to peer internet</p>
      <p>
      Hybrid uses the following protocols
      <ul>
      <li>Bittorrent | bt://</li>
      <li>Tor | tor:// for http:// | tors:// for https://</li>
      <li>IPFS | ipfs://</li>
      <li>Hypercore | hyper://</li>
      <li>Gemini | gemini://</li>
      <li>Gopher | gopher://</li>
      </ul>
      As p2p expands, we will add more protocols
      </p>
      <p>Some of my online names are the following
      <ul>
      <li>resession | https://github.com/resession</li>
      <li>ducksandgoats | https://github.com/ducksandgoats</li>
      <li>hybridware | https://github.com/HybridWare</li>
      </ul>
      </p>
      <p>Repo for the browser is https://github.com/HybridWare/hybrid-browser</p>
      <p>Message me anytime on these profiles</p>
      </body></html>`

      const data = intoStream(htmlData)

      return sendResponse({
        statusCode,
        headers,
        data
      })
    } else if (hostname === 'info') {
      const statusCode = 200

      const packagesToRender = [
        'log-fetch',
        'chunk-fetch',
        'list-fetch',
        'onion-fetch'
      ]

      const { version } = packageJSON

      const dependencies = {}
      for (const name of packagesToRender) {
        dependencies[name] = packageJSON.dependencies[name]
      }

      const aboutInfo = {
        version,
        dependencies
      }

      const data = intoStream(JSON.stringify(aboutInfo, null, '\t'))

      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Allow-CSP-From': '*',
        'Content-Type': 'application/json'
      }

      return sendResponse({
        statusCode,
        headers,
        data
      })
    } else if ((hostname === 'theme') && (pathname === '/vars.css')) {
      const statusCode = 200

      const themes = Object
        .keys(theme)
        .map((name) => `  --hy-theme-${name}: ${theme[name]};`)
        .join('\n')

      const data = intoStream(`
:root {
  --hy-color-blue: #0000FF;
  --hy-color-black: #000000;
  --hy-color-white: #FFFFFF;
  --hy-color-red: #FF0000;
}

:root {
${themes}
}
      `)

      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Allow-CSP-From': '*',
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/css'
      }

      return sendResponse({
        statusCode,
        headers,
        data
      })
    }

    try {
      const resolvedPath = await resolveFile(toResolve)
      const statusCode = 200

      const contentType = mime.getType(resolvedPath) || 'text/plain'

      const data = fs.createReadStream(resolvedPath)

      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Allow-CSP-From': 'hybrid://welcome',
        'Cache-Control': 'no-cache',
        'Content-Type': contentType
      }

      return sendResponse({
        statusCode,
        headers,
        data
      })
    } catch (e) {
      const statusCode = 404

      const data = fs.createReadStream('404.html')

      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Allow-CSP-From': '*',
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/html'
      }

      return sendResponse({
        statusCode,
        headers,
        data
      })
    }
  }
  return { handler: protocolHandler, close }
}

async function resolveFile (path) {
  for (const toTry of CHECK_PATHS) {
    const tryPath = toTry(path)
    if (await exists(tryPath)){
      return tryPath
    }
  }
  throw new Error('Not Found')
}

function exists (path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stat) => {
      if (err) {
        if (err.code === 'ENOENT') resolve(false)
        else reject(err)
      } else resolve(stat.isFile())
    })
  })
}

function intoStream (data) {
  return new Readable({
    read () {
      this.push(data)
      this.push(null)
    }
  })
}
