// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@asmjs/core";

// An open page that keeps its one placement for a minute. The shelf is open and its view places
// the ledger, which is not: what the cache holds for a member is not a guest's.
export default definePage({
  route: "/public/kept",
  place: { shelf: { cache: { ttl: 60_000 } } },
});
