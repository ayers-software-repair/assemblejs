// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@assemblejs/core";

// The child the deferred view places arrives after the page, and its stylesheet has to be
// there before it.
export default definePage({ place: { "pug-tint": { defer: true } } });
