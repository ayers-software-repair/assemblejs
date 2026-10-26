// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@asmjs/core";
import { band, productsIn } from "../../catalogue/products.js";

const BANDS = [
  { value: "low", label: "Under $25" },
  { value: "mid", label: "$25 to $100" },
  { value: "high", label: "Over $100" },
];
const ROASTS = ["light", "medium", "dark"];

// The choices a shelf can be narrowed by, each with how many it would leave: counted here, on
// the server, from the same shelf the grid beside it is given.
export default defineService({
  name: "facets",
  run: ({ params, query }) => {
    const shelf = productsIn(params["category"], query.get("q"));
    return {
      roasts: ROASTS.map((roast) => ({
        value: roast,
        label: roast.charAt(0).toUpperCase() + roast.slice(1),
        count: shelf.filter((product) => product.roast === roast).length,
      })).filter((choice) => choice.count > 0),
      bands: BANDS.map((one) => ({
        ...one,
        count: shelf.filter((product) => band(product.cents) === one.value).length,
      })).filter((choice) => choice.count > 0),
    };
  },
});
