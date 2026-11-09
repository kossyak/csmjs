class CSM {
	constructor({ context, actions, shared }, onchange) {
		const ctx = this.value(context)
		this._context = ctx
		this.start_context = [...ctx]
		this.actions = actions
		this.level = actions
		this.path = []
		this.current = []
		this.events = {}
		this.shared = shared
		this.onchange = onchange
		this.include({ actions: this.actions })
	}

	destroy() {
		this.clear()
		this.path = []
		this.current = []
		this._context = []
		this.start_context = []
		this.actions = {}
		this.level = {}
		this.shared = {}
		this.events = {}
	}

	clear() {
		Object.keys(this.events).forEach(key => this.events[key].clear())
	}

	get context() {
		return this._context
	}

	set context(v) {
		this._context = v
	}

	reset() {
		this.level = this.actions
		this.context = [...this.start_context]
		this.path = []
		this.update()
	}

	value(v) {
		if (v === undefined || v === null) return []
		return Array.isArray(v) ? v : [v]
	}

	include(obj, path = []) {
		const includes = this.value(obj.includes)
		if (includes.length) {
			if (!obj.actions) {
				obj.actions = {}
			}
			includes.forEach(name => {
				if (this.shared?.[name]) {
					Object.assign(obj.actions, { [name]: this.shared[name] })
				}
			})
		}
		obj.actions && Object.entries(obj.actions).forEach(([key, value]) => {
			this.include(value, [...path, 'actions', key])
		})
	}

	deliver(path) {
		let i, target = { ...this.actions }
		for (i = 0; i < path.length - 1; i++) {
			target = target[path[i]]?.actions
			if (!target) return null
		}
		return target[path[i]]
	}

	children(path) {
		return this.level?.[path.split('-').at(-1)]
	}

	async activate(key, data, trigger) {
		let closed = []
		this.path = key.split('-')
		const target = this.deliver(this.path)
		if (!target) return
		
		if (target?.actions) {
			this.level = { ...target.actions }
		} else {
			this.path.pop()
		}

		if (target) {
			if (!this._context.includes(key)) this._context.push(key)
			this.add(target)
			closed = this.remove(target)
			this.set(target)
		}

		this.update(key)
		await this.emit(key, { action: key, target, trigger, opened: this.current, closed, context: this._context, level: this.level, data })
		
		target?.activate 
			? await this.activate(target.activate, data, key) 
			: await this.onchange?.({ action: key, target, opened: this.current, closed, context: this._context, level: this.level })
	}

	set(target) {
		if (target.set) this._context = this.value(target.set)
	}

	add(target) {
		if (!target.add) return
		this.value(target.add).forEach(a => {
			if (!this._context.includes(a)) {
				this._context.push(a)
			}
		})
	}

	remove(target) {
		const exclude = [...this.value(target.remove), ...this.value(target?.triggers)]
		if (exclude.length) {
			this._context = this._context.filter(c => {
				return !exclude.some(pattern => {
					if (typeof pattern === 'string' && pattern.endsWith('*')) {
						const prefix = pattern.slice(0, -1)
						return c.startsWith(prefix)
					}
					return c === pattern
				})
			})
		}
		return exclude
	}

	match(arr, once) {
		if (!arr.length) return true

		// Если элемент внутри массива сам является массивом -> это группа "ИЛИ"
		if (Array.isArray(arr[0])) {
			return arr.some(subArr => this.match(subArr, once))
		}

		let count = 0
		for (const el of arr) {
			if (this._context.includes(el)) count++
		}
		return once ? Boolean(count) : arr.length === count
	}

	excludes(value) {
		const arr = this.value(value)
		return arr.length ? this.match(arr, true) : false
	}

	update(action) {
		const opened = []
		const availableActions = { ...this.actions, ...this.level }

		for (const [key, target] of Object.entries(availableActions)) {
			if (this.excludes(target.excludes)) continue

			const triggers = this.value(target.triggers)
			const contains = this.value(target.contains)

			if (this.match(triggers, true) && this.match(contains)) {
				const isGlobal = key in this.actions && !(key in this.level)
				const keyPath = isGlobal ? [key].join('-') : [...this.path, key].join('-')
				opened.push(keyPath)
			}
		}
		this.current = [...opened]
		return { action, opened }
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

	off(key, callback) {
		if (!this.events[key]) return false
		const callbacks = this.events[key]
		const deleted = callbacks.delete(callback)
		if (callbacks.size === 0) {
			delete this.events[key]
		}
		return deleted
	}
}

function createCSM(...arg) {
	return new CSM(...arg)
}

export { createCSM }
