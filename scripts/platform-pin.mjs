// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// The product's one platform pin: `ayersPlatform` in the root package.json, the tag the deploy
// checks the site kit out at. Everything else this repository takes from platform is a byte-copy
// at that same tag, so each gate that holds a copy to its hash holds the tag recorded beside the
// hash to the pin as well. A pin moved without the copies read again at the new tag is a red,
// and so is a copy taken from a tag the product is not pinned to.
import { readFileSync } from "node:fs";

/** The tag the root package.json pins platform at. */
export function platformPin(manifest = readFileSync("package.json", "utf8")) {
  return JSON.parse(manifest).ayersPlatform;
}

/** One line when a copy's recorded tag is not the pin, and none when it is. */
export function offThePin(what, tag, pin = platformPin()) {
  if (tag === pin) return [];
  return [
    `${what} is recorded at platform ${tag} and the product is pinned to ${String(pin)} (ayersPlatform in package.json): compare the copy with the pin's tag, then record that tag`,
  ];
}
