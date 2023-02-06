const item = {
  template: `
    <div class="item">
      <div class="fx">
        <button class="itemBtn"><span class="text"></span></button>
        <a class="details LstClose"></a>
      </div>
      <div class="detailsContent"></div>
    </div>`,
  props: {
    proxies: {
      item: {},
      hot: {},
      details: { default: false },
    },
    methods: {
      _action: {},
      _details: {}
    }
  },
  handlers: {
    details(v) {
      v ? this.node.details.classList.add('csm-active') : this.node.details.classList.remove('csm-active')
    }
  },
  nodes() {
    return {
      item: {
        className: () => 'item' + (this.proxy.item.hide ? ' csm-hide' : ''),
      },
      itemBtn: {
        disabled: () => this.proxy.item.hide,
        onclick: () => this.method._action(this.proxy.item.id),
      },
      text: {
        textContent: () => this.proxy.item.text || this.proxy.item.id
      },
      detailsContent: {
        innerHTML: () => {
          return this.proxy.item && this.proxy.details ? this.method.details(this.proxy.item) : ''
        }
      },
      details: {
        style: () => {
          return {
            display: this.proxy.hot ? 'block' : 'none'
          }
        },
        onclick: (event) => {
          event.stopPropagation()
          this.proxy.details = !this.proxy.details
        }
      }
    }
  },
  methods: {
    details(item) {
      let st = ''
      for (const key in Object.assign({}, item)) {
        if (key === 'pop' || key === 'permit' || key === 'push' || key === 'delete'|| key === 'tabu' || key === 'to') {
          st += `<p><strong>${key}</strong>: ${item[key].toString()}</p>`
        } else if (key === 'actions') {
          st += `<p><strong>${key}</strong>: true</p>`
        }
      }
      return st
    }
  }
}

export default {
  template: `<div class="csm-column">
      <div class="csm-header">
          <div class="csm-bar">
            <h1 class="name"></h1>
            <button class="hot">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 15 12" style="enable-background:new 0 0 15 12;" xml:space="preserve">
              <path d="M14,1v8H1V1H14 M15,0H0v10h15V0L15,0z"/>
              <rect x="3.5" y="11" width="8" height="1"/>
            </button>
          </div>
          <div class="context"></div>
          <div class="notify"></div>
          <nav>
            <button class="prev LstArrow"></button>
            <button class="next LstArrow"></button>
          </nav>
      </div>
      <div class="actions"></div>
  </div>`,
  props: {
    params: {
      name: {}
    },
    methods: {
      action: {}
    }
  },
  params: {
    level: {},
    actions: [],
    setTimeoutId: null
  },
  proxies: {
    notify: [],
    current: 0,
    actions: [],
    context: [],
    hot: false,
  },
  handlers: {
    hot(v){
      v ? this.node.hot.classList.add('csm-active') : this.node.hot.classList.remove('csm-active')
      this.method.actions()
    },
    current(v) {
      this.method.notify(this.proxy.notify[v] || '')
    }
  },
  nodes() {
    return {
      prev: {
        disabled: () => this.proxy.current === 0,
        onclick: () => this.proxy.current--
      },
      next: {
        disabled: () => this.proxy.current === this.proxy.notify.length - 1 || this.proxy.notify.length === 0,
        onclick: () => this.proxy.current++
      },
      name: {
        textContent: this.param.name,
        onclick: () => this.proxy.actions = []
      },
      notify: {
        onclick: () => this.method.notify('')
      },
      hot: {
        onclick: () => this.proxy.hot = !this.proxy.hot
      },
      context: {
        textContent: () => this.proxy.hot ? 'context: ' + this.proxy.context.join(' ') : ''
      },
      actions: {
        component: {
          iterate: () => this.proxy.actions,
          src: item,
          proxies: {
            item: (item) => item,
            hot: () => this.proxy.hot,
          },
          methods: {
            _action: (id) => this.method.action(id)
          }
        }
      }
    }
  },
  methods: {
    notify(txt) {
      if (this.node.notify.textContent === txt) return
      let i = 0
      this.node.notify.textContent = ''
      const typeWriter = () => {
        if (i < txt.length) {
          this.node.notify.textContent += txt.charAt(i)
          i++
          this.param.setTimeoutId = setTimeout(typeWriter, 50)
        } else clearTimeout(this.param.setTimeoutId)
      }
      clearTimeout(this.param.setTimeoutId)
      typeWriter()
    },
    async actions() {
      this.proxy.notify = []
      this.proxy.current = 0
      this.proxy.actions = []
      // await new Promise(resolve => setTimeout(resolve, 2000))
      const actions = this.param.actions
      if (this.proxy.hot) {
        for (const key in this.param.level) {
          const action = this.replicate(this.param.level[key])
          action.id = key
          action.hide = !actions.includes(key) || action.hasOwnProperty('notify')
          this.proxy.actions.push(action)
        }
      } else {
        actions.forEach(key => {
          const action = this.replicate(this.param.level[key])
          if (action.notify) {
            this.proxy.notify = Array.isArray(action.notify) ? action.notify : [action.notify]
            this.method.notify(this.proxy.notify[0])
          } else {
            action.id = key
            this.proxy.actions.push(action)
          }
        })
      }
    },
    change(arg) {
      delete this.proxy.context
      this.proxy.context = arg.context
      this.param.actions = arg.actions
      this.param.level = arg.level
      this.method.actions()
    }
  }
}
