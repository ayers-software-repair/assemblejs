// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Basic credentials, when the control is on. There is no default and no shipped password. */
export interface AuthConfig {
  readonly user: string;
  readonly password: string;
}
