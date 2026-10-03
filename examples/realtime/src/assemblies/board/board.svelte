<script lang="ts">
  import { onMount } from "svelte";

  let { events } = $props();
  let price = $state("waiting");
  let ready = $state(false);
  onMount(() => {
    ready = true;
    // The stream may have sent the current price before this assembly mounted.
    const last = events.last("price");
    if (last !== undefined) price = JSON.stringify(last.payload);
    return events.on("price", (message) => (price = JSON.stringify(message.payload)));
  });
</script>

<p id="svelte-price" data-ready={ready ? "" : undefined}>{price}</p>
