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
 * back. Vue would otherwise only warn about an error in a component's render and send what it
 * had, so the app's error handler rethrows it.
 *
 * The component renders with the same injected events it hydrates with, the server's, so a
 * component that calls `useEvents()` renders on the server as in the browser.
 */
export async function renderToMarkup(component: Component, input: MarkupInput): Promise<string> {
  const app = createSSRApp(component, { data: input.data, children: input.children });
  app.provide(EVENTS_KEY, serverEvents());
  app.config.errorHandler = (error) => {
    throw error;
  };
  return renderToString(app);
}
