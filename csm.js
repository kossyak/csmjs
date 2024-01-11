export default class CSM {
  constructor(entry) {
    this.context = this.value(entry.context)
    this.actions = entry.actions
    this.level = entry.actions
    this.current = []
    this.events = {}
  }
  async init() {
    const { action, opened, closed } = this.update()
    await this.emit('--init', { action, opened, closed, context: this.context, level: this.level })
  }
  destroy() {
    this.current = []
    this.context = []
    this.actions = {}
    this.level = {}
    this.emit('--destroy', {})
  }
  off(key) {
    if (key) {
      delete this.events[key]
    } else this.events = {}
  }
  value(v) {
    if (!v) return []
    return Array.isArray(v) ? v : [v]
  }
  deliver(path) {
    let i, target = {...this.actions}
    for (i = 0; i < path.length - 1; i++) target = target[path[i]]
    return target[path[i]]
  }
  to(target) {
    if (target.to === '/') {
      this.level = this.actions
    } else {
      const path = target.to.slice(1).split('/')
      this.level = this.deliver(path).actions
    }
  }
  async do(key, data) {
    let closed = []
    const target = {...this.level[key]}
    if (target.to) {
      this.to(target)
    } else if (target.actions) this.level = target.actions
    if (target) {
      if (!this.context.includes(key)) this.context.push(key)
      this.add(target)
      closed = this.remove(target)
      this.set(target)
    }
    let fl = this.current.includes(key)
    const { action, opened } = this.update(key, closed)
    if (fl) await this.emit('--do-' + key, { action, opened, closed, context: this.context, level: this.level, data })
    await this.emit('--update', { action, opened, closed, context: this.context, level: this.level })
    if (target.do) await this.do(target.do, data)
  }
  set(target) {
    if(target.set) this.context = this.value(target.set)
  }
  add(target) {
    if (target.add) {
      this.value(target.add).forEach(a => {
        if (!this.context.includes(a)) {
          this.context.push(a)
        }
      })
    }
  }
  remove(target) {
    const exclude = [...this.value(target.remove), ...this.value(target.toggle)]
    if (exclude.length) {
      const excludeSet = new Set(exclude)
      this.context = this.context.filter(c => !excludeSet.has(c))
    }
    return exclude
  }
  match(arr, once) {
    let count = 0
    for (const el of arr) {
      if (this.context.includes(el)) count++
    }
    return once ? Boolean(count) : arr.length === count
  }
  excludes(value) {
    const arr = this.value(value)
    return arr.length ? this.match(arr, true) : false
  }
  update(action, closed = []) {
    const opened = []
    for (const [key, target] of Object.entries(this.level)) {
      if (!this.excludes(target.excludes)) {
        const contains = [...this.value(target.toggle), ...this.value(target.contains)]
        if (action && this.level !== this.actions) contains.push(action)
        if (!contains.length) return console.error(`"${ key }" is not contained in the context`)
        if (this.match(contains)) {
          opened.push(key)
          this.emit('--open-' + key, { action, opened, closed, context: this.context, level: this.level })
        }
      }
    }
    closed.forEach(c => this.emit('--close-' + c, { action, opened, closed, context: this.context, level: this.level }))
    if (opened.toString() !== this.current.toString()) this.current = [...opened]
    return { action, opened, closed }
  }
  async emit(key, context, data) {
    if (!this.events[key]) return
    const callbacks = this.events[key]
    for await (const callback of callbacks) {
      await callback(context, data)
    }
  }
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