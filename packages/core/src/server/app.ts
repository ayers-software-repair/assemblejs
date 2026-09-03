// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FastifyInstance } from "fastify";

/** A built server. Everything that can refuse has already refused by the time you hold one. */
export interface App {
  readonly fastify: FastifyInstance;
  listen(): Promise<{ readonly url: string }>;
  close(): Promise<void>;
  readonly inject: FastifyInstance["inject"];
}
