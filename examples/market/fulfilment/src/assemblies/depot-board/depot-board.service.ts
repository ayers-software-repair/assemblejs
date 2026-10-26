// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@asmjs/core";
import { STEPS, depot } from "../../depot/shipments.js";

// Every shipment the depot holds, newest first, each with the step it has reached.
export default defineService({
  name: "depot",
  run: () => ({
    shipments: depot.all().map((shipment) => ({
      order: shipment.order,
      short: shipment.order.slice(0, 8),
      city: shipment.city,
      step: STEPS[depot.step(shipment)] ?? "",
    })),
  }),
});
