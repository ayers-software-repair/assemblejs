// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";
import { STEPS, depot } from "../../depot/shipments.js";

// Where the parcel of the order the page's route names has got to (`/orders/:id`), and how
// long until it moves on, so the page can say when to look again.
export default defineService({
  name: "shipment",
  run: ({ params }) => {
    const shipment = depot.find(params["id"]);
    if (shipment === undefined)
      return { known: false, steps: STEPS, at: -1, city: "", parcels: 0, next: 0 };
    return {
      known: true,
      steps: STEPS,
      at: depot.step(shipment),
      city: shipment.city,
      parcels: shipment.parcels,
      next: depot.next(shipment),
    };
  },
});
