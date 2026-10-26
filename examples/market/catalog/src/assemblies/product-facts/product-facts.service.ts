// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@asmjs/core";
import { productBySku } from "../../catalogue/products.js";

// The facts of the product the page's route names, as rows for a table.
export default defineService({
  name: "facts",
  run: ({ params }) => {
    const product = productBySku(params["sku"]);
    return {
      sku: product?.sku ?? "",
      rows: Object.entries(product?.facts ?? {}).map(([label, value]) => ({ label, value })),
    };
  },
});
