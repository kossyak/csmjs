window.csm = {
  context: [],
  actions: {},
  events: {},
  create(entry) {
    this.context = entry.context || []
    this.actions = entry.state
    this.emit('_create', {...entry})
    this.update()
  },
  destroy() {
    this.context = []
    this.actions = {}
    this.emit('_destroy', this.context)
  },
  off() {
    this.events = {}
  },
  value(v) {
    if (!v) return []
    return Array.isArray(v) ? v : [v]
  },
  action(key) {
    const action = this.actions[key]
    if (action) {
      if (!this.context.includes(key)) this.context.push(key)
      this.push(action)
      this.delete(action)
      this.set(action)
      this.update(key)
    }
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
    for (const [key, action] of Object.entries(this.actions)) {
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
    actions.forEach(key => this.emit(key, this.context))
    this.emit('_change', { actions, trigger, context: this.context })
  },
  emit(key, context) {
    if (!this.events[key]) return
    const callbacks = this.events[key]
    for (const callback of callbacks) {
      callback(context)
    }
  },
  on(key, callback) {
    if (!this.events[key]) {
      this.events[key] = new Set()
    }
    const callbacks = this.events[key]
    callbacks.add(callback)
    return () => {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        delete this.events[key]
      }
    }
  }
}