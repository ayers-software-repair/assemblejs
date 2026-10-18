// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "@assemblejs/core";
import { CATALOG, FULFILMENT, REVIEWS } from "./src/shop/origins.js";
import { cookie, forStaff, isStaffKey } from "./src/shop/staff.js";

export default defineConfig({
  // The three other teams' servers this one places assemblies from, and nothing else.
  remotes: [
    // The catalogue reads what a visitor searched for, so it is trusted with the page's query.
    // Its browser runtime also joins the page's bus, so the shop's assemblies and the
    // catalogue's can hear one another.
    { origin: CATALOG, trusted: true, events: true },
    { origin: REVIEWS },
    { origin: FULFILMENT },
  ],
  // Everything is open but what staff use. The check is the product's own: one place decides,
  // for the page, for the assembly wherever it is shown, and for the api behind it.
  authenticate: ({ path, headers }) =>
    !forStaff(path) || isStaffKey(cookie(headers["cookie"], "staff")),
  // What each page may send before anything mounts, gzipped. `assemblejs perf` weighs every
  // page it can ask as a stranger and holds it to these.
  budgets: { document: 14000, styles: 12000, scripts: 90000 },
  // Every page shows its outline: the switch at the corner draws a box around each assembly
  // that says what it is, where it came from and when.
  outline: true,
});
