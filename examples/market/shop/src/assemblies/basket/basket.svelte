<script lang="ts">
  import { onMount } from "svelte";
  import { basket, price } from "../../browser/basket.js";
  import type { Held } from "../../browser/basket.js";

  type Priced = {
    sku: string;
    name: string;
    note: string;
    quantity: number;
    cents: number;
    left: number;
  };
  let { events } = $props();

  // The basket is read from the browser once the page is live, and priced by the server every
  // time it changes: the browser says what it holds, the server says what that costs.
  let lines = $state<Priced[]>([]);
  let cents = $state(0);
  let problems = $state<string[]>([]);
  let phase = $state<"reading" | "ready" | "unreachable">("reading");

  const reprice = async (held: readonly Held[]): Promise<void> => {
    events.send("basket:changed", { count: basket.count(held) });
    try {
      const answer = await fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lines: held }),
      });
      const quote = await answer.json();
      lines = quote.lines;
      cents = quote.cents;
      problems = quote.problems;
      phase = "ready";
    } catch {
      phase = "unreachable";
    }
  };
  const change = (changed: Priced, quantity: number): void => {
    const held = basket
      .read()
      .map((line) =>
        line.sku === changed.sku && line.note === changed.note ? { ...line, quantity } : line,
      )
      .filter((line) => line.quantity > 0);
    basket.write(held);
    void reprice(held);
  };
  onMount(() => void reprice(basket.read()));
</script>

<section class="basket" aria-labelledby="basket-title">
  <h1 id="basket-title">Your basket</h1>
  {#if phase === "reading"}
    <p role="status">Reading your basket.</p>
  {:else if phase === "unreachable"}
    <p class="notice notice--strong" role="alert">We could not price your basket just now. It is still here; try again in a moment.</p>
  {:else if lines.length === 0}
    <p class="notice">Nothing in it yet. <a href="/c/all">Walk the shelves</a>.</p>
  {:else}
    {#each problems as problem (problem)}
      <p class="notice notice--strong" role="alert">{problem}</p>
    {/each}
    <table class="table">
      <thead>
        <tr><th scope="col">What</th><th scope="col">How many</th><th scope="col">Each</th><th scope="col">Sum</th><th scope="col"><span class="basket-quiet">Remove</span></th></tr>
      </thead>
      <tbody>
        {#each lines as line (line.sku + line.note)}
          <tr>
            <th scope="row">
              <a href={`/p/${line.sku}`}>{line.name}</a>
              {#if line.note !== ""}<span class="basket-note">{line.note}</span>{/if}
            </th>
            <td>
              <input
                type="number"
                class="control"
                min="1"
                max="99"
                value={line.quantity}
                aria-label={`How many of ${line.name}`}
                onchange={(event) => change(line, Math.max(1, Math.min(99, Number(event.currentTarget.value) || 1)))}
              />
            </td>
            <td>{price(line.cents)}</td>
            <td>{price(line.cents * line.quantity)}</td>
            <td><button type="button" class="basket-remove" onclick={() => change(line, 0)} aria-label={`Remove ${line.name}`}>Remove</button></td>
          </tr>
        {/each}
      </tbody>
      <tfoot>
        <tr><th scope="row" colspan="3">Total</th><td colspan="2"><strong>{price(cents)}</strong></td></tr>
      </tfoot>
    </table>
    <p><a class="button" href="/checkout">Check out</a></p>
  {/if}
</section>
