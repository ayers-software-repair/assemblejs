// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@assemblejs/core";

export default definePage({
  place: {
    // The footer is the same for every visitor, so one render serves five minutes of pages.
    "site-footer": { cache: { ttl: 300_000 } },
  },
});
