const fetchToHandler = require('./fetch-to-handler')

module.exports = async function createHandler () {
  const makeFetch = require('gemini-handle')

  const fetch = makeFetch()

  return { handler: fetchToHandler(fetch) }
}
