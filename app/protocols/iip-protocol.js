const fetchToHandler = require('./fetch-to-handler')

module.exports = async function createHandler (options, session) {
  const makeFetch = require('garlic-fetch')

  const fetch = makeFetch(options)

  return fetchToHandler(fetch, session)
}
