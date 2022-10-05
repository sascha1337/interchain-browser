const fetchToHandler = require('./fetch-to-handler')

module.exports = async function createHandler () {
  const makeFetch = require('gopher-fetch')

  const fetch = makeFetch({})

  return { handler: fetchToHandler(fetch) }
}
