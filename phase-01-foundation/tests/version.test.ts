import { describe, expect, it } from "vitest";
import { VERSION } from "../src/index.js";

describe("VERSION", () => {
  it("exposes the phase version", () => {
    expect(VERSION).toBe("0.1.0");
  });
});
