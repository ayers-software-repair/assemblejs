// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@assemblejs/core";

// A route with a parameter, which reaches the assemblies the page places.
export default definePage({ route: "/items/:sku" });
