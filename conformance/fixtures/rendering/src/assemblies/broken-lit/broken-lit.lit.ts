// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { TemplateResult } from "lit";

export default (): TemplateResult => {
  throw new Error("this view always fails to render");
};
