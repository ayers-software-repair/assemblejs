// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi } from "@assemblejs/core";
import { depot } from "../depot/shipments.js";

// The shop's server tells this one of each order as it is placed. Server to server: no browser
// ever calls this.
export default defineApi({
  path: "/api/shipments",
  method: "POST",
  handle: ({ body }) => {
    const sent = (typeof body === "object" && body !== null ? body : {}) as {
      [key: string]: unknown;
    };
    const { order, city, parcels } = sent;
    if (typeof order !== "string" || order === "" || typeof city !== "string") return { ok: false };
    depot.take(
      order.slice(0, 64),
      city.slice(0, 80),
      typeof parcels === "number" ? Math.max(1, Math.floor(parcels)) : 1,
    );
    return { ok: true };
  },
});
