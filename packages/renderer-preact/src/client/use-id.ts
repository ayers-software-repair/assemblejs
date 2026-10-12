// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContext, useId as usePreactId } from "preact/hooks";
import { IdContext } from "./id-context.js";

/**
 * An id no other element on the page has, the same on the server and in the browser: for a
 * label and the input it names, or an element and what describes it.
 *
 * It is Preact's own `useId` with the placement's id before it. Preact numbers the ids its hook
 * makes from the root of each render and takes no prefix, so every island on a page makes the
 * same ones, and a label in one assembly names the input in another. Import this one instead.
 */
export function useId(): string {
  const placement = useContext(IdContext);
  const own = usePreactId();
  return placement === "" ? own : `${placement}-${own}`;
}
