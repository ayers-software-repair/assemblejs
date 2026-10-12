// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

// The same on every page for as long as the server runs, which is why the pages keep it.
export default defineService({
  name: "footer",
  run: () => ({
    year: new Date().getFullYear(),
    links: [
      { href: "/about", label: "About this shop" },
      { href: "/c/all", label: "All the shelves" },
      { href: "/staff", label: "Staff" },
    ],
  }),
});
