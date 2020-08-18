import {writable as internal, get} from 'svelte/store'

export function writable(key, initialValue) {
  const store = internal(initialValue)
  const {subscribe, set} = store
  const json = typeof(localStorage) != 'undefined' ? localStorage.getItem(key) : null

  if (json) {
    set(JSON.parse(json))
  }

  return {
    set(value) {
      typeof(localStorage) != 'undefined' ? localStorage.setItem(key, JSON.stringify(value)) : null
      set(value)
    },
    update(cb) {
      const value = cb(get(store))
      this.set(value)
    },
    subscribe
  }
}
