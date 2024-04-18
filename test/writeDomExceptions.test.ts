/**
 * @vitest-environment jsdom
 * @vitest-environment-options { "storageQuota": "0" }
 */

import { persisted } from '../index'
import { expect, vi, beforeEach, describe, it } from 'vitest'

beforeEach(() => localStorage.clear())

describe('persisted()', () => {

  it('logs error encountered when saving to local storage', () => {
    const consoleMock = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const store = persisted('myKey', 'myVal')

    store.set("myNewVal")

    expect(consoleMock).toHaveBeenCalledWith("Error when writing value from persisted store \"myKey\" to local", new DOMException)
    consoleMock.mockReset();
  })

  it('calls custom error function', () => {
    const mockFunc = vi.fn()

    const store = persisted('myKey2', 'myVal', { onWriteError: mockFunc })
    store.set("myNewVal")

    expect(mockFunc).toHaveBeenCalledOnce()
  })
})
