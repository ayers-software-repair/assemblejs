// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@assemblejs/core";

export default definePage({ place: { flaky: { cache: { ttl: 60_000 } } } });
