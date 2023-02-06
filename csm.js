export default {
  context: [],
  current: [],
  actions: {},
  state: {},
  events: {},
  async create(entry) {
    this.context = this.value(entry.context)
    this.actions = entry.actions
    this.level = entry.actions
    await this.emit('_create', {...entry})
    this.context.forEach(key => this.emit(key, this.context))
    this.update()
  },
  destroy() {
    this.context = []
    this.actions = {}
    this.level = {}
    this.emit('_destroy', this.context)
  },
  off(key) {
    if (key) {
      delete this.events[key]
    } else this.events = {}
  },
  value(v) {
    if (!v) return []
    return Array.isArray(v) ? v : [v]
  },
  deliver(path) {
    let i, target = {...this.actions}
    for (i = 0; i < path.length - 1; i++) target = target[path[i]]
    return target[path[i]]
  },
  to(action) {
    if (action.to === '/') {
      this.level = this.actions
    } else {
      const path = action.to.slice(1).split('/')
      this.level = this.deliver(path).actions
    }
  },
  async action(key, data) {
    const action = {...this.level[key]}
    if (action.to) {
      this.to(action)
    } else if (action.actions) this.level = action.actions
    if (action) {
      if (!this.context.includes(key)) this.context.push(key)
      this.push(action)
      this.delete(action)
      this.set(action)
    }
    let fl = this.current.includes(key)
    this.update(key)
    if (fl) await this.emit(key, this.context, data)
  },
  set(action) {
    if(action.set) this.context = this.value(action.set)
  },
  push(action) {
    if (action.push) {
      this.value(action.push).forEach(a => {
        if (!this.context.includes(a)) {
          this.context.push(a)
        }
      })
    }
  },
  delete(action) {
    const exclude = [...this.value(action.delete), ...this.value(action.pop)]
    if (exclude.length) {
      const excludeSet = new Set(exclude)
      this.context = this.context.filter(c => !excludeSet.has(c))
    }
  },
  match(arr) {
    let count = 0
    for (const el of arr) {
      if (this.context.includes(el)) count++
    }
    return arr.length === count
  },
  tabu(target) {
    const arr = this.value(target)
    return arr.length ? this.match(arr) : false
  },
  update(trigger) {
    const actions = []
    for (const [key, action] of Object.entries(this.level)) {
      if (!this.tabu(action.tabu)) {
        const permit = [...this.value(action.pop), ...this.value(action.permit)]
        if (trigger && this.level !== this.actions) permit.push(trigger)
        if (!permit.length) return console.error('permit not found for ' + key)
        this.match(permit) && actions.push(key)
      }
    }
    this.emit('_change', {level: this.level, actions, trigger, context: this.context})
    if (actions.toString() !== this.current.toString()) {
      this.current = [...actions]
    }
  },
  async emit(key, context, data) {
    if (!this.events[key]) return
    const callbacks = this.events[key]
    for await (const callback of callbacks) {
      await callback(context, data)
    }
  },
  on(key, callback) {
    if (!this.events[key]) {
      this.events[key] = new Set()
    }
    const callbacks = this.events[key]
    if (!callbacks.has(callback)) {
      callbacks.add(callback)
    }
    return () => {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        delete this.events[key]
      }
    }
  }
}