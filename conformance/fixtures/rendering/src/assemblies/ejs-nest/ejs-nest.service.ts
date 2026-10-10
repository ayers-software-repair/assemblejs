// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

// What a service returns reaches the directive its view writes, which is read once the view has
// rendered. An assembly in a project has one view, so `default` is the only one to write.
export default defineService({
  name: "ejs-nest",
  schema: { properties: { view: { type: "string" } }, required: ["view"] },
  run: () => ({ view: "default" }),
});
