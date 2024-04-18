import { persisted } from '../index'
import { expect, vi, beforeEach, describe, it } from 'vitest'

beforeEach(() => localStorage.clear())

describe('persisted()', () => {

  it('logs error encountered when reading from local storage', () => {
    const consoleMock = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    localStorage.setItem("myKey", "INVALID JSON")
    persisted('myKey', '')

    expect(consoleMock).toHaveBeenCalledWith('Error when parsing "INVALID JSON" from persisted store "myKey"', expect.any(SyntaxError))
    consoleMock.mockReset();
  })

  it('calls custom error function upon init', () => {
    const mockFunc = vi.fn()

    localStorage.setItem("myKey2", "INVALID JSON")
    persisted('myKey2', '', { onParseError: mockFunc })

    expect(mockFunc).toHaveBeenCalledOnce()
  })

  it('calls custom error function upon external write', () => {
    const mockFunc = vi.fn()

    const store = persisted('myKey3', '', { onParseError: mockFunc })
    const unsub = store.subscribe(() => undefined)

    const event = new StorageEvent('storage', { key: 'myKey3', newValue: 'INVALID JSON' })
    window.dispatchEvent(event)

    expect(mockFunc).toHaveBeenCalledOnce()

    unsub()
  })
})
