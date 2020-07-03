# svelte-local-storage-store

A store that adds pub/sub to local storage.

## Installation

```bash
npm install svelte-local-storage-store
```

## Usage

Define the store:

```javascript
import { writable } from 'svelte-local-storage-store'

// First param `preferences` is the local storage key.
// Second param is the initial value.
export const preferences = writable('preferences', {
  theme: 'dark',
  pane: '50%',
  ...
})
```

Then when you want to use the store:
  
```javascript
import { get } from 'svelte/store'
import { preferences } from './stores'

preferences.subscribe(...) // subscribe to changes
preferences.update(...) // update value
preferences.set(...) // set value
get(preferences) // read value
$preferences // read value with automatic subscription
```

## TODO

- [ ] Support multiple tabs / capture event when localStorage changes
- [ ] Add tests

## License

MIT
