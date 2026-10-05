// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@assemblejs/core";

// A route with a parameter, and a deferred placement the browser fills with that parameter.
export default definePage({ route: "/item/:sku", place: { tag: { defer: true } } });
