// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { ConfigError, readConfig } from "@assemblejs/core";

describe("reading configuration from the environment", () => {
  it("takes safe defaults when nothing is set", () => {
    const config = readConfig({});
    expect(config.mode).toBe("production");
    // Loopback, not every interface: a dev server that binds the world is how a laptop ends up
    // serving a network it did not mean to.
    expect(config.host).toBe("127.0.0.1");
    expect(config.port).toBe(3000);
    expect(config.auth).toBeUndefined();
  });

  it("reads the environment it is given and nothing else", () => {
    const config = readConfig({
      ASSEMBLEJS_MODE: "development",
      ASSEMBLEJS_HOST: "0.0.0.0",
      ASSEMBLEJS_PORT: "8080",
    });
    expect(config).toEqual({
      mode: "development",
      host: "0.0.0.0",
      port: 8080,
      auth: undefined,
    });
  });

  describe("the mode", () => {
    it("is production unless development was asked for explicitly", () => {
      expect(readConfig({}).mode).toBe("production");
      expect(readConfig({ ASSEMBLEJS_MODE: "" }).mode).toBe("production");
      expect(readConfig({ ASSEMBLEJS_MODE: "production" }).mode).toBe("production");
      expect(readConfig({ ASSEMBLEJS_MODE: "development" }).mode).toBe("development");
    });

    // A typo must not run as production in silence: that silence is the defect this whole
    // module exists to remove.
    it("refuses a value it does not recognise rather than defaulting", () => {
      expect(() => readConfig({ ASSEMBLEJS_MODE: "Development" })).toThrow(ConfigError);
      expect(() => readConfig({ ASSEMBLEJS_MODE: "dev" })).toThrow(/ASSEMBLEJS_MODE/);
    });
  });

  describe("the port", () => {
    it("refuses a value that is not a whole number", () => {
      expect(() => readConfig({ ASSEMBLEJS_PORT: "8080abc" })).toThrow(/not a whole number/);
      expect(() => readConfig({ ASSEMBLEJS_PORT: "-1" })).toThrow(/not a whole number/);
      expect(() => readConfig({ ASSEMBLEJS_PORT: " 80 " })).toThrow(/not a whole number/);
    });

    it("refuses a number outside the range a port can be", () => {
      expect(() => readConfig({ ASSEMBLEJS_PORT: "0" })).toThrow(/outside 1 to 65535/);
      expect(() => readConfig({ ASSEMBLEJS_PORT: "70000" })).toThrow(/outside 1 to 65535/);
    });
  });

  describe("the security control", () => {
    it("is off unless it was turned on", () => {
      expect(readConfig({}).auth).toBeUndefined();
      expect(readConfig({ ASSEMBLEJS_AUTH: "off" }).auth).toBeUndefined();
      // Credentials present but the control not switched on is still off.
      expect(
        readConfig({ ASSEMBLEJS_AUTH_USER: "ops", ASSEMBLEJS_AUTH_PASSWORD: "s" }).auth,
      ).toBeUndefined();
    });

    it("turns on with both halves of the credential", () => {
      const config = readConfig({
        ASSEMBLEJS_AUTH: "basic",
        ASSEMBLEJS_AUTH_USER: "ops",
        ASSEMBLEJS_AUTH_PASSWORD: "not-a-default",
      });
      expect(config.auth).toEqual({ user: "ops", password: "not-a-default" });
    });

    // The named case: a control switched on without its credential must not start, and must
    // never be given one. A framework that defaults a password ships one password to everybody.
    it("refuses to start when it is on and the credential is missing", () => {
      expect(() => readConfig({ ASSEMBLEJS_AUTH: "basic" })).toThrow(ConfigError);
      expect(() => readConfig({ ASSEMBLEJS_AUTH: "basic" })).toThrow(/ASSEMBLEJS_AUTH_USER/);
      expect(() => readConfig({ ASSEMBLEJS_AUTH: "basic" })).toThrow(/ASSEMBLEJS_AUTH_PASSWORD/);
      expect(() => readConfig({ ASSEMBLEJS_AUTH: "basic", ASSEMBLEJS_AUTH_USER: "ops" })).toThrow(
        /ASSEMBLEJS_AUTH_PASSWORD/,
      );
    });

    it("treats an empty credential as missing, not as a credential", () => {
      expect(() =>
        readConfig({
          ASSEMBLEJS_AUTH: "basic",
          ASSEMBLEJS_AUTH_USER: "",
          ASSEMBLEJS_AUTH_PASSWORD: "",
        }),
      ).toThrow(ConfigError);
    });

    it("refuses a control setting it does not recognise", () => {
      expect(() => readConfig({ ASSEMBLEJS_AUTH: "none" })).toThrow(/not "basic" or "off"/);
    });
  });

  it("reports every problem at once, not the first", () => {
    try {
      readConfig({ ASSEMBLEJS_MODE: "dev", ASSEMBLEJS_PORT: "x", ASSEMBLEJS_AUTH: "basic" });
      expect.unreachable("it should have refused");
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError);
      // mode, port, auth user, auth password.
      expect((error as ConfigError).problems).toHaveLength(4);
    }
  });

  it("never reads anything but the environment it was handed", () => {
    const before = process.env["ASSEMBLEJS_PORT"];
    process.env["ASSEMBLEJS_PORT"] = "9999";
    try {
      // The ambient process environment is not a source. Only the argument is.
      expect(readConfig({}).port).toBe(3000);
    } finally {
      if (before === undefined) delete process.env["ASSEMBLEJS_PORT"];
      else process.env["ASSEMBLEJS_PORT"] = before;
    }
  });
});
