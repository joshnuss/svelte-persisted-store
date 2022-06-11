[![npm version](https://img.shields.io/npm/v/svelte-local-storage-store.svg)](https://www.npmjs.com/package/svelte-local-storage-store) [![license](https://img.shields.io/npm/l/svelte-local-storage-store.svg)](LICENSE.md) [![codecov](https://codecov.io/gh/joshnuss/svelte-local-storage-store/branch/master/graph/badge.svg?token=GU607D2YRQ)](https://codecov.io/gh/joshnuss/svelte-local-storage-store)

# svelte-local-storage-store

A store that adds pub/sub to local storage. Supports changes across multiple tabs.

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
// Third param optional fromJSON handler
// Forth param optional toJSON handler
export const preferences = writable('preferences', {
    theme: 'dark',
    pane: '50%',
    ...
  },
  (json) => {
    // used for anything that needs to be converted
    // from JSON to JS values like Dates
    return { theme: json.dark, pane: json.pane, ... }
  },
  (preferences) => {
    // used for anything that needs to be manually
    // converted to JSON
    return { theme: preferences.dark, pane: preferences.pane, ... }
  }
)
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

## License

MIT
