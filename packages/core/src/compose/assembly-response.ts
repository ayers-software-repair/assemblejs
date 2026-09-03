// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FailureReason } from "./failure-reason.js";

/** What reaching an assembly produced. A result, always; never a thrown error. */
export type AssemblyResponse =
  | {
      readonly ok: true;
      readonly html: string;
      readonly source: "local" | "remote" | "cache";
      readonly version?: string;
    }
  | {
      readonly ok: false;
      readonly reason: FailureReason;
      readonly detail: string;
      readonly correlationId: string;
    };
