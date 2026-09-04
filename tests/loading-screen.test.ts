import { describe, expect, it, vi } from "vitest";
import { waitForViewIdle } from "../src/ui/loading-screen.ts";

describe("waitForViewIdle", () => {
  it("resolves on the first idle event and unsubscribes", async () => {
    const handlers = new Set<() => void>();
    const view = {
      on(_event: "idle", handler: () => void) {
        handlers.add(handler);
      },
      off(_event: "idle", handler: () => void) {
        handlers.delete(handler);
      },
    };

    const pending = waitForViewIdle(view, 5_000);
    expect(handlers.size).toBe(1);
    handlers.forEach((handler) => handler());
    await pending;
    expect(handlers.size).toBe(0);
  });

  it("resolves on timeout when idle never fires", async () => {
    vi.useFakeTimers();
    const view = {
      on() {},
      off() {},
    };

    const pending = waitForViewIdle(view, 1_000);
    await vi.advanceTimersByTimeAsync(1_000);
    await pending;
    vi.useRealTimers();
  });
});
