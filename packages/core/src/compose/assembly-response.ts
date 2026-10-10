// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Diagnostic } from "./diagnostic.js";
import type { FailureReason } from "./failure-reason.js";

/** What reaching an assembly produced. A result, always; never a thrown error. */
export type AssemblyResponse =
  | {
      readonly ok: true;
      readonly html: string;
      readonly source: "local" | "remote" | "cache";
      readonly version?: string;
      /** How each placement the assembly's own view made was answered, when it made any. */
      readonly nested?: readonly Diagnostic[];
    }
  | {
      readonly ok: false;
      readonly reason: FailureReason;
      readonly detail: string;
      readonly correlationId: string;
    };
