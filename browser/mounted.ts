// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { expect } from "@playwright/test";
import type { Locator } from "@playwright/test";

/**
 * Clicks a control once the assembly it stands in has mounted: the runtime marks an envelope
 * `data-mounted` when its renderer has mounted the assembly, and a click before that lands on
 * the server's markup, which has no handler yet. The envelope is found from the control itself,
 * through a shadow root where the assembly has one, so a proof names nothing twice.
 */
export async function clickMounted(control: Locator): Promise<void> {
  const name = await control.evaluate((element) => {
    const root = element.getRootNode();
    const from = root instanceof ShadowRoot ? root.host : element;
    return from.closest("assembly-root")?.getAttribute("data-name") ?? "";
  });
  expect(name, "the control stands in an assembly").not.toBe("");
  await expect(
    control.page().locator(`assembly-root[data-name="${name}"]`).first(),
  ).toHaveAttribute("data-mounted", "");
  await control.click();
}
