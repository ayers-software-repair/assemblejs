// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { MarkupInput } from "@assemblejs/core";
import { serverEvents } from "@assemblejs/core/client";
import { createSSRApp } from "vue";
import type { Component } from "vue";
import { renderToString } from "vue/server-renderer";
import { EVENTS_KEY } from "../client/events-key.js";

/**
 * Renders a Vue component to the markup the server sends.
 *
 * It does not catch: a failed render rejects, the composer catches it, and the placement falls
 * back. Vue on its own reports an error in a component (in setup, render, a child, an async
 * setup, a server prefetch or a watcher) to the app's error handler and goes on rendering what it
 * has, so the page would arrive whole-looking with a hole in it. The handler here keeps the first
 * error, and once Vue has finished, the render rejects with it.
 *
 * The component renders with the same injected events it hydrates with, the server's, so a
 * component that calls `useEvents()` renders on the server as in the browser.
 */
export async function renderToMarkup(component: Component, input: MarkupInput): Promise<string> {
  const app = createSSRApp(component, { data: input.data });
  app.provide(EVENTS_KEY, serverEvents());
  let failed: { readonly error: unknown } | undefined;
  app.config.errorHandler = (error) => {
    failed ??= { error };
  };
  const html = await renderToString(app);
  if (failed !== undefined) throw failed.error;
  return html;
}
