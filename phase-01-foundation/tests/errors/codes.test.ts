import { describe, expect, it } from "vitest";
import {
  ERROR_CODES,
  RESERVED_ERROR_CODE_NAMESPACES,
} from "../../src/errors/codes.js";

describe("error code registry", () => {
  it("contains exactly the normative codes from SPECIFICATION §6.3", () => {
    expect(ERROR_CODES).toEqual([
      "issue.internal",
      "issue.usage",
      "issue.config.notfound",
      "issue.config.parse",
      "issue.config.invalid",
      "issue.env.missing",
      "issue.path.escape",
      "issue.cli.unknownflag",
    ]);
  });

  it("uses only the reserved issue.* namespace", () => {
    for (const code of ERROR_CODES) {
      expect(code.startsWith("issue.")).toBe(true);
    }
  });

  it("does not allocate any reserved future namespace", () => {
    for (const code of ERROR_CODES) {
      const allocated = RESERVED_ERROR_CODE_NAMESPACES.some((namespace) => {
        const prefix: string = namespace;
        return code === prefix || code.startsWith(`${prefix}.`);
      });
      expect(allocated).toBe(false);
    }
  });

  it("lists the reserved future-phase namespaces", () => {
    expect(RESERVED_ERROR_CODE_NAMESPACES).toEqual([
      "issue.tool",
      "issue.agent",
      "issue.model",
      "issue.memory",
      "issue.network",
    ]);
  });
});
