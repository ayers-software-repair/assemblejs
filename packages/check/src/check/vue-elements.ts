// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { COMPUTED_MARKER } from "@asmjs/build";
import { readElements } from "./read-elements.js";
import type { ViewElement } from "./view-element.js";

const TEMPLATE = /<template\b[^>]*>([\s\S]*)<\/template\s*>/i;
const INTERPOLATION = /\{\{[\s\S]*?\}\}/g;

/**
 * The elements a Vue component's template writes, read from its source as text: its `<template>`
 * part as markup with every `{{ }}` standing as the marker, each tag with its attributes. An
 * attribute bound with `:name` or `v-bind:name` is the attribute `name`, its value the marker,
 * and the element computed; a directive (`v-if`, `v-for`, `@click`, `v-on:`) writes no attribute
 * the browser reads and is left out; `v-bind` of a whole object is an attribute nobody can name,
 * the marker as its name, and makes the element computed, since what it holds is only a render's
 * to know. A component with no template writes no element.
 */
export function vueElements(source: string): readonly ViewElement[] {
  const template = TEMPLATE.exec(source)?.[1];
  if (template === undefined) return [];
  return readElements(template.replace(INTERPOLATION, COMPUTED_MARKER)).map((element) => {
    const attributes = new Map<string, string | true>();
    let computed = element.computed;
    for (const [name, value] of element.attributes) {
      const bound = /^(?::|v-bind:)([a-z][a-z0-9-]*)$/.exec(name)?.[1];
      if (bound !== undefined) {
        attributes.set(bound, COMPUTED_MARKER);
        computed = true;
      } else if (name === "v-bind") {
        attributes.set(COMPUTED_MARKER, true);
        computed = true;
      } else if (!/^(?:v-|@|#)/.test(name)) {
        attributes.set(name, value);
      }
    }
    return { ...element, attributes, computed };
  });
}
