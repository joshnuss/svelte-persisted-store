import {writable as internal, get} from 'svelte/store'

export function writable(key, initialValue) {
  const store = internal(initialValue)
  const {subscribe, set} = store
  const json = typeof(localStorage) != 'undefined' ? localStorage.getItem(key) : null

  if (json) {
    set(JSON.parse(json))
  }

  function updateStorage(key, value) {
    if (typeof(localStorage) == 'undefined')
      return

    localStorage.setItem(key, JSON.stringify(value))
  }

  return {
    set(value) {
      updateStorage(key, value)
      set(value)
    },
    update(cb) {
      const value = cb(get(store))

      updateStorage(key, value)
      set(value)
    },
    subscribe
  }
}
