[![npm version](https://img.shields.io/npm/v/svelte-persisted-store.svg)](https://www.npmjs.com/package/svelte-persisted-store) [![license](https://img.shields.io/npm/l/svelte-persisted-store.svg)](LICENSE.md) [![codecov](https://codecov.io/gh/joshnuss/svelte-persisted-store/branch/master/graph/badge.svg?token=GU607D2YRQ)](https://codecov.io/gh/joshnuss/svelte-persisted-store)

# svelte-persisted-store

A Svelte store that persists to local storage. Can sync changes across browser tabs.

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

Then, to use it:

```javascript
import { get } from 'svelte/store'
import { preferences } from './stores'

preferences.subscribe(...) // subscribe to changes
preferences.update(...) // update value
preferences.set(...) // set value
get(preferences) // read value
$preferences // read value with automatic subscription
```

Additional options can be specified:

```javascript
import * as devalue from 'devalue'

// third parameter is options
export const preferences = persisted('local-storage-key', 'default-value', {
  serializer: devalue, // defaults to `JSON`
  storage: 'session', // 'session' for sessionStorage, defaults to 'local'
  syncTabs: true, // choose wether to sync localStorage across tabs, default is true
  onWriteError: (error) => {/* handle or rethrow */}, // Defaults to console.error with the error object
  onParseError: (raw, error) => {/* handle or rethrow */}, // Defaults to console.error with the error object
})
```

## License

MIT
