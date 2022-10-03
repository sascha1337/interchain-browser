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
  return { handler: protocolHandler, close }

  function close () {}

  async function protocolHandler (req, sendResponse) {
    const { url } = req

    const parsed = new URL(url)
    const { pathname, hostname } = parsed
    const toResolve = path.join(hostname, pathname)

    if (hostname === 'about') {
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

      sendResponse({
        statusCode,
        headers,
        data
      })

      return
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

      sendResponse({
        statusCode,
        headers,
        data
      })

      return
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

      sendResponse({
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

      sendResponse({
        statusCode,
        headers,
        data
      })
    }
  }
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
