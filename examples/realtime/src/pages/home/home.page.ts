// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@assemblejs/core";

// The page's runtime opens this stream once and puts what it sends on the page's bus.
export default definePage({ stream: "/api/prices" });
