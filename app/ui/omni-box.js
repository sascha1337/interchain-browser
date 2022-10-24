/* global HTMLElement, CustomEvent, customElements */

const { CID } = require('multiformats/cid')

const IPNS_PREFIX = '/ipns/'
const IPFS_PREFIX = '/ipfs/'

class OmniBox extends HTMLElement {
  constructor () {
    super()
    this.firstLoad = true
    this.lastSearch = 0
  }

  get options () {
    return document.querySelector('#' + this.getAttribute('nav-options-id'))
  }

  connectedCallback () {
    this.innerHTML = ` 
      <section class="omni-box-header">
        <button class="hidden omni-box-button omni-box-back" title="Go back in history"><</button>
        <button class="hidden omni-box-button omni-box-forward" title="Go forward in history">></button>
        <button class="omni-box-button omni-box-home" title="Go to the homepage">⊡</button>
        <form class="omni-box-form">
          <input class="omni-box-target-input" readonly></input>
          <input class="omni-box-input" title="Enter search params">
          <button class="omni-box-button" type="submit" title="Load page or Reload">⊙</button>
        </form>
        <button class="omni-box-button omni-box-copy" title="Copy the current resource">↑</button>
        <button class="omni-box-button omni-box-uncopy" title="Uncopy the current resource">↓</button>
        <button class="omni-box-button omni-box-delete" title="Delete the current resource">-</button>
        <button class="omni-box-button omni-box-open" title="Open a new window">+</button>
        <button class="omni-box-button omni-box-close" title="Close the current window">×</button>
      </section>
    `
    this.backButton = this.$('.omni-box-back')
    this.forwardButton = this.$('.omni-box-forward')
    this.form = this.$('.omni-box-form')
    this.input = this.$('.omni-box-input')
    this.targetUrl = this.$('.omni-box-target-input')
    this.homeButton = this.$('.omni-box-home')
    this.openButton = this.$('.omni-box-open')
    this.closeButton = this.$('.omni-box-close')
    this.deleteButton = this.$('.omni-box-delete')
    this.copyButton = this.$('.omni-box-copy')
    this.uncopyButton = this.$('.omni-box-uncopy')

    this.input.addEventListener('focus', () => {
      this.input.select()
    })

    this.targetUrl.addEventListener('focus', () => {
      this.showInput()
      this.input.select()
    })

    this.input.addEventListener('blur', () => {
      this.input.blur()
    })

    this.form.addEventListener('submit', (e) => {
      e.preventDefault(true)

      const rawURL = this.getURL()

      let url = rawURL

      if (!isURL(rawURL)) {
        if (looksLikeIPFS(rawURL)) {
          url = makeIPFS(rawURL)
        } else if (isBareLocalhost(rawURL)) {
          url = makeHttp(rawURL)
        } else if (looksLikeDomain(rawURL)) {
          url = makeHttps(rawURL)
        } else {
          url = makeDuckDuckGo(rawURL)
        }
      }

      this.clearOptions()

      const searchID = Date.now()
      this.lastSearch = searchID

      if(url.startsWith('bt') || url.startsWith('ipfs') || url.startsWith('hyper')){
        this.deleteButton.removeAttribute('disabled')
      } else {
        this.deleteButton.setAttribute('disabled', true)
      }

      this.dispatchEvent(new CustomEvent('navigate', { detail: { url } }))
    })
    this.input.addEventListener('input', () => {
      this.updateOptions()
    })
    this.input.addEventListener('keydown', ({ keyCode, key }) => {
      // Pressed down arrow
      if (keyCode === 40) this.selectNext()

      // Pressed up arrow
      if (keyCode === 38) this.selectPrevious()

      if (keyCode === 39) {
        const { selectionStart, selectionEnd, value } = this.input
        const isAtEnd = (selectionStart === value.length) && (selectionEnd === value.length)
        if (isAtEnd) this.fillWithSelected()
      }

      if (key === 'Escape') {
        this.clearOptions()
        this.input.blur()
        this.dispatchEvent(new CustomEvent('unfocus'))
      }
    })

    this.backButton.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('back'))
    })
    this.forwardButton.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('forward'))
    })
    this.homeButton.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('home'))
    })
    this.openButton.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('open'))
    })
    this.closeButton.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('close'))
    })
    this.deleteButton.addEventListener('click', () => {
      try {
        const url = new URL(this.getURL())
        let check = null
        if(url.protocol === 'bt:'){
          check = 'hybrid://handle/bt/remove/?url=' + url.toString()
        } else if(url.protocol === 'ipfs:'){
          check = 'hybrid://handle/ipfs/remove/?url=' + url.toString()
        } else if(url.protocol === 'hyper:'){
          check = 'hybrid://handle/hyper/remove/?url=' + url.toString()
        } else {
          console.log('protocol must be supported')
        }
        if(check){
          this.dispatchEvent(new CustomEvent('delete', {detail: {url: check}}))
        }
      } catch (err) {
        console.error(err)
      }
    })
    this.copyButton.addEventListener('click', () => {
      try {
        const url = new URL(this.getURL())
        let check = null
        if(url.protocol === 'bt:'){
          check = 'hybrid://handle/bt/echo/?url=' + url.toString()
        } else if(url.protocol === 'ipfs:'){
          check = 'hybrid://handle/ipfs/pin/?url=' + url.toString()
        } else if(url.protocol === 'hyper:'){
          check = 'hybrid://handle/hyper/mount/?url=' + url.toString()
        } else {
          console.log('protocol must be supported')
        }
        if(check){
          this.dispatchEvent(new CustomEvent('delete', {detail: {url: check}}))
        }
      } catch (err) {
        console.error(err)
      }
    })
    this.uncopyButton.addEventListener('click', () => {
      try {
        const url = new URL(this.getURL())
        let check = null
        if(url.protocol === 'bt:'){
          check = 'hybrid://handle/bt/unecho/?url=' + url.toString()
        } else if(url.protocol === 'ipfs:'){
          check = 'hybrid://handle/ipfs/unpin/?url=' + url.toString()
        } else if(url.protocol === 'hyper:'){
          check = 'hybrid://handle/hyper/unmount/?url=' + url.toString()
        } else {
          console.log('protocol must be supported')
        }
        if(check){
          this.dispatchEvent(new CustomEvent('delete', {detail: {url: check}}))
        }
      } catch (err) {
        console.error(err)
      }
    })
  }

  clearOptions () {
    this.options.innerHTML = ''
  }

  getURL () {
    const item = this.getSelected()

    return item ? item.dataset.url : this.input.value
  }

  getSelected () {
    return (this.options.querySelector('[data-selected]') || this.options.firstElementChild)
  }

  selectNext () {
    const item = this.getSelected()

    if (!item) return

    const sibling = item.nextElementSibling

    if (!sibling) return

    item.removeAttribute('data-selected')
    sibling.setAttribute('data-selected', 'selected')
  }

  selectPrevious () {
    const item = this.getSelected()

    if (!item) return

    const sibling = item.previousElementSibling

    if (!sibling) return

    item.removeAttribute('data-selected')
    sibling.setAttribute('data-selected', 'selected')
  }

  fillWithSelected () {
    const item = this.getSelected()

    if (!item) return

    const { url } = item.dataset

    this.input.value = url
  }

  async updateOptions () {
    const query = this.input.value

    const searchID = Date.now()
    this.lastSearch = searchID

    this.clearOptions()

    if (!query) {
      return
    }

    this.dispatchEvent(new CustomEvent('search', { detail: { query, searchID } }))
  }

  async setSearchResults (results, query, searchID) {
    if (this.lastSearch !== searchID) {
      return console.debug('Urlbar changed since query finished', this.lastSearch, searchID, query)
    }

    const finalItems = []

    if (isURL(query)) {
      finalItems.push(this.makeNavItem(query, `Go to ${query}`))
    } else if (looksLikeIPFS(query)) {
      const url = makeIPFS(query)
      finalItems.push(this.makeNavItem(url, `Go to ${url}`))
    } else if (isBareLocalhost(query)) {
      finalItems.push(this.makeNavItem(makeHttp(query), `Go to http://${query}`))
    } else if (looksLikeDomain(query)) {
      finalItems.push(this.makeNavItem(makeHttps(query), `Go to https://${query}`))
    } else {
      finalItems.push(
        this.makeNavItem(
          makeDuckDuckGo(query),
          `Search for "${query}" on DuckDuckGo`
        )
      )
    }

    finalItems.push(...results
      .map(({ title, url }) => this.makeNavItem(url, `${title} - ${url}`))
    )

    for (const item of finalItems) {
      this.options.appendChild(item)
    }

    this.getSelected().setAttribute('data-selected', 'selected')
  }

  makeNavItem (url, text) {
    const element = document.createElement('button')
    element.classList.add('omni-box-nav-item')
    element.classList.add('omni-box-button')
    element.dataset.url = url
    element.innerText = text
    element.onclick = () => {
      this.clearOptions()

      this.dispatchEvent(new CustomEvent('navigate', { detail: { url } }))
    }
    return element
  }

  static get observedAttributes () {
    return ['src', 'back', 'forward']
  }

  attributeChangedCallback (name, oldValue, newValue) {
    if (name === 'src') {
      this.input.value = newValue
      if (this.firstLoad && (newValue === window.DEFAULT_PAGE)) {
        this.firstLoad = false
        this.focus()
      }
    } if (name === 'back') {
      this.backButton.classList.toggle('hidden', newValue === 'hidden')
    } else if (name === 'forward') {
      this.forwardButton.classList.toggle('hidden', newValue === 'hidden')
    }
  }

  get src () {
    return this.input.value
  }

  set src (value) {
    this.setAttribute('src', value)
  }

  showInput (show = true) {
    this.targetUrl.classList.toggle('hidden', show)
    this.input.classList.toggle('hidden', !show)
  }

  showTarget (url) {
    this.targetUrl.value = url
    const inputSelected = this.input === document.activeElement

    if (url && !inputSelected) {
      this.showInput(false)
    } else {
      this.showInput(true)
    }
  }

  focus () {
    this.input.focus()
    this.input.select()
  }

  $ (query) {
    return this.querySelector(query)
  }

  convertURL (rawURL) {
  }
}

function makeHttp (query) {
  return `http://${query}`
}

function makeHttps (query) {
  return `https://${query}`
}

function makeDuckDuckGo (query) {
  return `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
}

function isURL (string) {
  try {
    // localhost: is a valid url apparently!
    if (isBareLocalhost(string)) return false
    return !!new URL(string)
  } catch {
    return false
  }
}

function looksLikeDomain (string) {
  return !string.match(/\s/) && string.includes('.')
}

function isBareLocalhost (string) {
  return string.match(/^localhost(:[0-9]+)?\/?$/)
}

function looksLikeIPFS (string) {
  return string.startsWith(IPFS_PREFIX)
}

function makeIPFS (path) {
  const sections = path.slice(IPFS_PREFIX.length).split('/')
  const cid = sections[0]
  if (cid.startsWith('Qm')) {
    const parsed = CID.parse(cid)
    sections[0] = parsed.toV1().toString()
  }
  const final = sections.join('/')
  return `ipfs://${final}`
}

function looksLikeIPNS (string) {
  return string.startsWith(IPNS_PREFIX)
}

function makeIPNS (path) {
  return `ipns://${path.slice(IPNS_PREFIX.length)}`
}

customElements.define('omni-box', OmniBox)
