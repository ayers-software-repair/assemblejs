// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@asmjs/core";

// How many times the shelf has been composed. A kept answer says the number it was kept with,
// which is how a spec tells it from one composed for the asker.
let composed = 0;

export default defineService({
  name: "composed",
  run: () => {
    composed += 1;
    return { composed };
  },
});
