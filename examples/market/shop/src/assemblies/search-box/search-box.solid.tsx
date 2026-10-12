// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { For, Show, createSignal, onCleanup } from "solid-js";

type Found = { sku: string; name: string };

// A search that works before any script arrives: it is a form that asks the shelves page for
// `?q=`. Once it is live it also suggests as a visitor types, asking this server's own api.
export default function SearchBox() {
  const [found, setFound] = createSignal<Found[]>([]);
  let waiting: ReturnType<typeof setTimeout> | undefined;
  let asking: AbortController | undefined;
  const suggest = (words: string): void => {
    clearTimeout(waiting);
    asking?.abort();
    if (words.trim().length < 2) {
      setFound([]);
      return;
    }
    waiting = setTimeout(async () => {
      asking = new AbortController();
      try {
        const answer = await fetch(`/api/search?q=${encodeURIComponent(words)}`, {
          signal: asking.signal,
        });
        setFound((await answer.json()) as Found[]);
      } catch {
        // A search that was overtaken by the next keystroke, or that the server did not answer.
      }
    }, 150);
  };
  onCleanup(() => {
    clearTimeout(waiting);
    asking?.abort();
  });
  return (
    <form class="search" action="/c/all" method="get" role="search">
      <input
        type="search"
        class="control"
        name="q"
        aria-label="Search the shop"
        placeholder="Search the shop"
        autocomplete="off"
        onInput={(event) => suggest(event.currentTarget.value)}
      />
      <button type="submit">Search</button>
      <Show when={found().length > 0}>
        <ul class="search-found">
          <For each={found()}>
            {(one) => (
              <li>
                <a href={`/p/${one.sku}`}>{one.name}</a>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </form>
  );
}
