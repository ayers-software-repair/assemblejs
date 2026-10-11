// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// A browser half, so the assembly has a script and a stylesheet among its assets and the page
// carries the runtime that opens its stream.
export default {
  mount: () => ({ unmount: () => undefined }),
};
