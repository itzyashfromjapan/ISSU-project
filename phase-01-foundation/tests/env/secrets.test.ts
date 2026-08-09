import { describe, expect, it } from "vitest";
import {
  getSecret,
  isSecretName,
  redactionList,
} from "../../src/env/secrets.js";

describe("isSecretName", () => {
  it.each([
    "API_KEY",
    "access_token",
    "AUTH_TOKEN",
    "clientSecret",
    "password",
    "PASS",
    "secretKey",
    "credentials",
    "apiKey",
    "DB_PASSWORD",
    "authorization",
  ])("matches %s as a secret name", (name) => {
    expect(isSecretName(name)).toBe(true);
  });

  it.each([
    "keyword",
    "monkey",
    "keyboard",
    "logLevel",
    "username",
    "requestId",
  ])("does not match %s as a secret name", (name) => {
    expect(isSecretName(name)).toBe(false);
  });
});

describe("getSecret", () => {
  it("returns the value of a requested secret from a custom source", () => {
    expect(getSecret("API_KEY", { API_KEY: "abc", PATH: "/x" })).toBe("abc");
  });

  it("returns undefined for a missing secret", () => {
    expect(getSecret("MISSING", {})).toBeUndefined();
  });

  it("reads from process.env by default", () => {
    process.env.ISSU_TEST_SECRET = "synthetic-secret-a";
    try {
      expect(getSecret("ISSU_TEST_SECRET")).toBe("synthetic-secret-a");
    } finally {
      delete process.env.ISSU_TEST_SECRET;
    }
  });
});

describe("redactionList", () => {
  it("returns values of secret-named variables only", () => {
    const source = {
      API_KEY: "secret-value-1",
      DB_PASSWORD: "secret-value-2",
      NORMAL_VAR: "not-a-secret",
      LOOPBACK: "",
    };
    expect(redactionList(source)).toEqual(["secret-value-1", "secret-value-2"]);
  });

  it("deduplicates secret values", () => {
    const source = {
      API_KEY: "same-value",
      AUTH_TOKEN: "same-value",
    };
    expect(redactionList(source)).toEqual(["same-value"]);
  });

  it("excludes empty and undefined values", () => {
    const source = {
      API_KEY: "",
      AUTH_TOKEN: undefined,
    };
    expect(redactionList(source)).toEqual([]);
  });

  it("captures synthetic secret values from process.env for later redaction", () => {
    process.env.ISSU_TEST_API_KEY = "synthetic-secret-b";
    try {
      expect(redactionList()).toContain("synthetic-secret-b");
    } finally {
      delete process.env.ISSU_TEST_API_KEY;
    }
  });
});
