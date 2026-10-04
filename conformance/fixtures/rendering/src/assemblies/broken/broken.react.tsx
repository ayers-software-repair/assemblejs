// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// A view whose render throws, so every page that places it shows how one failure is contained.
export default function Broken(): never {
  throw new Error("this view always fails to render");
}
