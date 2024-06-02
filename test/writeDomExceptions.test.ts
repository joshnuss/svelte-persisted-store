/**
 * @vitest-environment jsdom
 * @vitest-environment-options { "storageQuota": "0" }
 */

import { persisted } from '../index'
import { expect, vi, beforeEach, describe, it } from 'vitest'

beforeEach(() => localStorage.clear())

describe('persisted()', () => {

  it('logs error encountered when saving to local storage', async () => {
try {
      const consoleMock = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const store = await persisted('myKey', 'myVal')
  
      await store.set("myNewVal")
  
      expect(consoleMock).toHaveBeenCalledWith("Error when writing value from persisted store \"myKey\" to local", new DOMException)
      consoleMock.mockReset();
} catch (error) {
  console.error(error)
}
  })

  it('calls custom error function', async () => {
    const mockFunc = vi.fn()
    try {
      const store = await persisted('myKey2', 'myVal', { onWriteError: mockFunc })
      await store.set("myNewVal")
      expect(mockFunc).toHaveBeenCalledOnce()
    } catch (error) {
      console.error(error)
    }   
  })
})