const fetchToHandler = require('./fetch-to-handler')

module.exports = async function createHandler () {
  const makeFetch = require('gopher-handle')

  const fetch = makeFetch({})

  return fetchToHandler(fetch)
}
