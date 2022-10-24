const fs = require('fs-extra')
const { Readable } = require('stream')

module.exports = function fetchToHandler (fetch, session) {

  async function * readBody (body) {
    for (const chunk of body) {
      if (chunk.bytes) {
        yield await Promise.resolve(chunk.bytes)
      } else if (chunk.blobUUID) {
        yield await session.getBlobData(chunk.blobUUID)
      } else if (chunk.file) {
        yield * Readable.from(fs.createReadStream(chunk.file))
      }
    }
  }

  return async function protocolHandler (req, sendResponse) {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Allow-CSP-From': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Request-Headers': '*'
    }

    try {

      const { url, headers: requestHeaders, method, uploadData } = req

      const body = uploadData ? Readable.from(readBody(uploadData)) : null

      const response = await fetch({ url, headers: requestHeaders, method, body, session })

      const { status: statusCode, body: responseBody, headers: responseHeaders } = response

      for (const [key, value] of responseHeaders) {
        if (Array.isArray(value)) {
          headers[key] = value[0]
        } else {
          headers[key] = value
        }
      }

      const isAsync = responseBody[Symbol.asyncIterator]

      const data = isAsync ? Readable.from(responseBody, { objectMode: false }) : responseBody

      sendResponse({
        statusCode,
        headers,
        data
      })
    } catch (e) {
      console.error(e)
      sendResponse({
        statusCode: 500,
        headers,
        data: intoStream(e.stack)
      })
    }
  }
}

function intoStream (data) {
  return new Readable({
    read () {
      this.push(data)
      this.push(null)
    }
  })
}
