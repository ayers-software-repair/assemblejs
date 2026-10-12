// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { unreadDeclarations } from "@assemblejs/build";

const service = [{ kind: "service", what: "assembly's service" }];
const named = (files: readonly string[], kinds = service) =>
  unreadDeclarations("src/assemblies/cart", files, "cart", "directory-is-an-assembly", kinds).map(
    (problem) => problem.path.split("/").at(-1),
  );

describe("a file that is nearly a declaration the project reads, and is not the one", () => {
  it("is the kind with no name, and its plural, each with the name that would be read", () => {
    expect(
      unreadDeclarations(
        "src/assemblies/cart",
        ["cart.html", "cart.services.ts", "service.ts"],
        "cart",
        "directory-is-an-assembly",
        service,
      ),
    ).toEqual([
      {
        path: "src/assemblies/cart/cart.services.ts",
        rule: "directory-is-an-assembly",
        message: '"cart.services.ts" is not read: this assembly\'s service is "cart.service.ts"',
        fix: 'rename it to "cart.service.ts", or remove it',
      },
      {
        path: "src/assemblies/cart/service.ts",
        rule: "directory-is-an-assembly",
        message: '"service.ts" is not read: this assembly\'s service is "cart.service.ts"',
        fix: 'rename it to "cart.service.ts", or remove it',
      },
    ]);
  });

  it("is another's name on the kind, where the directory has none of its own", () => {
    expect(named(["cart.html", "basket.service.ts"])).toEqual(["basket.service.ts"]);
    // Beside the one that is read, it is a module of the author's own.
    expect(named(["cart.html", "cart.service.ts", "basket.service.ts"])).toEqual([]);
  });

  it("is not another's name on a kind any one of which is read", () => {
    const client = [{ kind: "client", what: "assembly's browser half", shared: true }];
    expect(named(["cart.html", "widget.client.ts"], client)).toEqual([]);
    expect(named(["cart.html", "client.ts", "cart.clients.ts"], client)).toEqual([
      "client.ts",
      "cart.clients.ts",
    ]);
  });

  it("is nothing for the declaration itself, and for a file of another kind", () => {
    expect(named(["cart.service.ts", "cart.html", "format.ts", "microservice.ts"])).toEqual([]);
  });
});
