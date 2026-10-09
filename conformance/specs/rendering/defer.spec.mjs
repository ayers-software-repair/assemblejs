// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 3.5: a deferred placement is not fetched during the page render. The page ships its
// empty envelope, marked deferred, and the runtime that fills it; what the runtime asks for, by
// the envelope's id, is that assembly's own envelope.
import assert from "node:assert/strict";
import { test } from "node:test";
import { attributesOf, envelopesOf, get } from "../http.mjs";

test("the page ships an empty envelope marked deferred, and the runtime to fill it", async () => {
  const page = await (await get("/later")).text();
  const [plain, deferred] = envelopesOf(page);
  assert.equal(plain?.attributes["data-defer"], undefined);
  assert.equal(deferred?.attributes["data-name"], "react-label");
  assert.equal(deferred?.attributes["data-defer"], "");
  assert.ok(!(deferred?.inner ?? "").includes("data-framework"), "its content is not rendered");
  assert.match(page, /<script type="module" src="[^"]+"/);
});

test("what the runtime asks for, by the placeholder's id, is the assembly stamped with it", async () => {
  const page = await (await get("/later")).text();
  const id = envelopesOf(page)[1]?.attributes["data-id"] ?? "";
  const response = await get("/assembly/react-label/default/", { "assembly-id": id });
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.equal(attributesOf(body)["data-id"], id);
  assert.equal(attributesOf(body)["data-defer"], undefined);
  assert.match(body, /data-framework="react"/);
});
