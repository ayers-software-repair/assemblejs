// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// The staff door: asks this server whether a key is the staff key and, on a yes, keeps it in
// a cookie for this site and goes to the board. The framework ships no session, so the product
// brings its own; the shop's access check (assemblejs.config.ts) reads the cookie on every
// request for a guarded address.
export default {
  mount(element: Element | ShadowRoot) {
    const form = element.querySelector("form");
    const said = element.querySelector(".door-said");
    const enter = async (event: Event): Promise<void> => {
      event.preventDefault();
      const key = String(new FormData(form ?? undefined).get("key") ?? "");
      try {
        const answer = await fetch("/api/staff/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ key }),
        });
        if (((await answer.json()) as { ok: boolean }).ok) {
          document.cookie = `staff=${encodeURIComponent(key)}; path=/; samesite=strict`;
          location.assign("/staff/stock");
          return;
        }
        if (said !== null) said.textContent = "That is not the staff key.";
      } catch {
        if (said !== null) said.textContent = "The shop did not answer. Try again.";
      }
    };
    form?.addEventListener("submit", enter);
    return { unmount: () => form?.removeEventListener("submit", enter) };
  },
};
