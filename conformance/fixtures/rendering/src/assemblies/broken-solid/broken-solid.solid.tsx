// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
export default function Broken(): never {
  throw new Error("this view always fails to render");
}
