// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readPreviewResponse } from "./read-preview-response.mjs";

/** Inspect only the owned Market product and non-mutating quote endpoint, without redirects. */
export async function inspectMarketCalculator(origin, values, signal) {
  const pinned = new URL(origin);
  if (
    pinned.origin !== origin ||
    pinned.protocol !== "http:" ||
    pinned.hostname !== "127.0.0.1" ||
    !pinned.port
  )
    throw new Error("Calculator inspection requires the owned loopback preview origin.");
  if (
    !Array.isArray(values) ||
    values.length < 1 ||
    values.length > 6 ||
    new Set(values).size !== values.length ||
    values.some((value) => !Number.isInteger(value) || value < 1 || value > 99)
  )
    throw new Error("Calculator inspection takes one to six unique quantities from 1 to 99.");
  signal.throwIfAborted();
  const url = `${origin}/p/kb-guji-250`;
  const page = await fetch(url, { signal, redirect: "error" });
  const html = await readPreviewResponse(page, 524288);
  if (!page.ok) throw new Error(`Served product failed (${page.status}): ${html}`);
  if (page.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "text/html")
    throw new Error("Served product did not return HTML.");
  const quotes = [];
  for (const quantity of values) {
    signal.throwIfAborted();
    const reply = await fetch(`${origin}/api/quote`, {
      method: "POST",
      signal,
      redirect: "error",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: [{ sku: "kb-guji-250", quantity, note: "" }] }),
    });
    const text = await readPreviewResponse(reply, 16384);
    if (!reply.ok)
      throw new Error(`Quote for quantity ${quantity} failed (${reply.status}): ${text}`);
    if (
      reply.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json"
    )
      throw new Error(`Quote for quantity ${quantity} did not return JSON content.`);
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error(`Quote for quantity ${quantity} returned invalid JSON: ${text}`);
    }
    quotes.push({ quantity, status: reply.status, body });
  }
  return { url, html, quotes };
}
