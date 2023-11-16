[![npm version](https://img.shields.io/npm/v/svelte-persisted-store.svg)](https://www.npmjs.com/package/svelte-persisted-store) [![license](https://img.shields.io/npm/l/svelte-persisted-store.svg)](LICENSE.md) [![codecov](https://codecov.io/gh/joshnuss/svelte-persisted-store/branch/master/graph/badge.svg?token=GU607D2YRQ)](https://codecov.io/gh/joshnuss/svelte-persisted-store)

# svelte-persisted-store

A Svelte store that persists to either local storage or cookies. Supports changes across multiple tabs for local storage.

## Installation

```bash
npm install svelte-persisted-store
```

## Usage

### Local Storage store
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

You can also optionally set the `serializer` or `storage` type:

```javascript
import * as devalue from 'devalue'

// third parameter is options.
export const preferences = persisted('local-storage-key', 'default-value', {
  serializer: devalue, // defaults to `JSON`
  storage: 'session' // 'session' for sessionStorage or 'cookie' for storing in cookies, defaults to 'local'
})
```

### Cookie storage store
The cookie storage stores the same as the local storage stores, except for when running server-side. On the server it needs to manually be initiated with the cookie value. Using SvelteKit, this can be done like the following example:

```javascript
// page.ts
import type { PageLoad } from './$types';
import { persisted } from 'svelte-persisted-store'

export const load: PageLoad = ({ cookies }) => {
  return {
    preferences: persisted('preferences', JSON.parse(cookies.get('preferences')), {storage: 'cookie'})
  };
};
```

As cookies also have a couple of different configuration paramaters, the configuration paramater of the cookie storage store exposes these:
```javascript
import { persisted } from 'svelte-persisted-store'

// third parameter is options.
export const preferences = persisted('local-storage-key', 'default-value', {
  storage: 'cookie',
  serializer: JSON,
  cookieOptions: {
    sameSite: 'Strict', // Default: "Strict"; Options: "Strict" | "Lax" | "None"
    secure: true, // Default: true; Options: true | false
    path: "/", // Default: "/"; Options: any string
    expires: new Date(), // Default: A year from now; Options: Any date object
  }
})
```


## License

MIT
