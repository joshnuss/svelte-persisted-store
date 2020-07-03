# svelte-local-storage-store

A store that keeps data in local storage.

## Installation

```bash
npm install svelte-local-storage-store
```

## Usage

Define a store:

```javascript
import { writable } from 'svelte-local-storage-store'

// `preferences` is the key, it will be:
//  - Synced with localStorage
//  - Accessible via pub/sub
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
- [ ] Support sapper, when no `process.browser` use initial value
- [ ] Add tests

## License

MIT
