// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * What a handler may return: a `JsonValue` whose objects may leave a member out.
 *
 * TypeScript gives each shape of a handler that answers one of two shapes the other's members as
 * `undefined`. JSON drops such a member, so it is allowed here and is never sent. A `Date`, a
 * function and a `bigint` are still refused, because JSON cannot carry them.
 */
export type ReturnedValue =
  string | number | boolean | null | ReturnedValue[] | { [key: string]: ReturnedValue | undefined };
