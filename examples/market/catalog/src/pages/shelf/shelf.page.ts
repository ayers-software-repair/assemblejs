// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@assemblejs/core";

// The same address the shop gives a shelf, so a link in the grid leads somewhere here too.
export default definePage({ route: "/c/:category" });
