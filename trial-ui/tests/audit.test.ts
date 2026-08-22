import { describe, it, expect } from "vitest";
import { ArrayLogger } from "../src/internal/audit.js";
import type { LogLevel } from "@issue/foundation";

describe("ArrayLogger — full Logger contract", () => {
  it("records info/warn/error/fatal events with context", () => {
    const l = new ArrayLogger("info");
    l.info("i", { a: 1 });
    l.warn("w", { b: 2 });
    l.error("e");
    l.fatal("f");
    expect(l.events.map((e) => e.level)).toEqual([
      "info",
      "warn",
      "error",
      "fatal",
    ]);
    expect(l.events[0]?.ctx).toEqual({ a: 1 });
  });

  it("debug recorded only at debug level; trace never recorded", () => {
    const quiet = new ArrayLogger("info");
    quiet.debug("nope");
    expect(quiet.events.length).toBe(0);

    const loud = new ArrayLogger("debug");
    loud.debug("yes");
    loud.trace("ignored");
    expect(loud.events.length).toBe(1);
    expect(loud.events[0]?.level).toBe("debug");
  });

  it("caps the event buffer at max", () => {
    const l = new ArrayLogger("info", 3);
    for (let i = 0; i < 10; i++) l.info(`e${i}`);
    expect(l.events.length).toBe(3);
    expect(l.events[0]?.msg).toBe("e0");
  });

  it("child returns the same capturing logger", () => {
    const l = new ArrayLogger("info");
    const c = l.child({});
    c.info("from-child");
    expect(l.events.length).toBe(1);
  });

  it("accepts every LogLevel value as constructor input", () => {
    for (const lv of [
      "trace",
      "debug",
      "info",
      "warn",
      "error",
      "fatal",
    ] as LogLevel[]) {
      expect(new ArrayLogger(lv)).toBeDefined();
    }
  });
});
