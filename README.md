[![npm version](https://img.shields.io/npm/v/svelte-persisted-store.svg)](https://www.npmjs.com/package/svelte-persisted-store) [![license](https://img.shields.io/npm/l/svelte-persisted-store.svg)](LICENSE.md) [![codecov](https://codecov.io/gh/joshnuss/svelte-persisted-store/branch/master/graph/badge.svg?token=GU607D2YRQ)](https://codecov.io/gh/joshnuss/svelte-persisted-store)

# svelte-persisted-store

A Svelte store that persists to local storage. Supports changes across multiple tabs.

## Installation

```bash
npm install svelte-persisted-store
```

## Usage

Define the store:

```javascript
import { persisted } from 'svelte-persisted-store'

// First param `preferences` is the local storage key.
// Second param is the initial value.
export const preferences = persisted('preferences', {
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

You can also optionally set the `serializer`, `storage` and `onError` type:

```javascript
import * as devalue from 'devalue'

// third parameter is options.
export const preferences = persisted('local-storage-key', 'default-value', {
  serializer: devalue, // defaults to `JSON`
  storage: 'session', // 'session' for sessionStorage, defaults to 'local'
  syncTabs: true // choose wether to sync localStorage across tabs, default is true
  onError: (e) => {/* Do something */} // Defaults to console.error with the error object
})
```

As the library will swallow errors encountered when reading from browser storage it is possible to specify a custom function to handle the error. Should the swallowing not be desirable, it is possible to re-throw the error like the following example (not recommended):

```javascript
export const preferences = persisted('local-storage-key', 'default-value', {
  onError: (e) => {
    throw e
  }
})
```

## License

MIT
