/**
 * @vitest-environment jsdom
 * @vitest-environment-options { "storageQuota": "0" }
 */

import { localState } from "../index";
import { expect, vi, beforeEach, describe, it } from "vitest";

beforeEach(() => localStorage.clear());

describe("localState()", () => {
  it("logs error encountered when saving to local storage", async () => {
    try {
      const consoleMock = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      const store = localState("myKey", "myVal");

      store.set("myNewVal");

      expect(consoleMock).toHaveBeenCalledWith(
        'Error when writing value from persisted store "myKey" to local',
        new DOMException()
      );
      consoleMock.mockReset();
    } catch (error) {
      console.error(error);
    }
  });

  it("calls custom error function", async () => {
    const mockFunc = vi.fn();
    try {
      const store = localState("myKey2", "myVal", {
        onWriteError: mockFunc,
      });
      store.set("myNewVal");
      expect(mockFunc).toHaveBeenCalledOnce();
    } catch (error) {
      console.error(error);
    }
  });
});
