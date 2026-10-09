// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { Late } from "./late.js";

/** An assembly with a lazily loaded part. */
export const LateIsland = () => (
  <p>
    before <Late />
  </p>
);
