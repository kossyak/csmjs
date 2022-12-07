export default {
  context: [],
  current: [],
  state: {},
  events: {},
  create(entry) {
    this.context = this.value(entry.context)
    this.state = entry.state
    this.emit('_create', {...entry})
    this.context.forEach(key => this.emit(key, this.context))
    this.update()
  },
  destroy() {
    this.context = []
    this.state = {}
    this.emit('_destroy', this.context)
  },
  off() {
    this.events = {}
  },
  value(v) {
    if (!v) return []
    return Array.isArray(v) ? v : [v]
  },
  async action(key, data) {
    const action = this.state[key]
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
  tabu(action) {
    if (action.tabu) {
      return this.value(action.tabu).some((a) => this.context.includes(a))
    }
  },
  update(trigger) {
    const actions = []
    for (const [key, action] of Object.entries(this.state)) {
      if (!this.tabu(action)) {
        let count = 0
        const permit = [...this.value(action.pop), ...this.value(action.permit)]
        if (permit.length) {
          for (const p of permit) {
            if (this.context.includes(p)) count++
          }
          if (permit.length === count) actions.push(key)
        } else actions.push(key)
      }
    }
    this.emit('_change', {actions, trigger, context: this.context})
    if (actions.toString() !== this.current.toString()) {
      this.current = [...actions]
    }
  },
  async emit(key, context, data) {
    if (!this.events[key]) return
    const callbacks = this.events[key]
    for (const callback of callbacks) {
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
