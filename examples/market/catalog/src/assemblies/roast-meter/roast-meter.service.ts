// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";
import { productBySku } from "../../catalogue/products.js";

const STEPS = ["light", "medium", "dark"];

// How far the roast of the page's product was taken, as a step on a scale. Nothing for a
// product that is not beans.
export default defineService({
  name: "roast",
  run: ({ params }) => {
    const roast = productBySku(params["sku"])?.roast;
    return { steps: STEPS, at: roast === undefined ? -1 : STEPS.indexOf(roast) };
  },
});
