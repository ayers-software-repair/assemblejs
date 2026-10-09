// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** What a devtools route answers: a body and the media type it is read as. */
export interface DevtoolsAnswer {
  readonly type: string;
  readonly body: string;
}
