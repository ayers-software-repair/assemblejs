<script lang="ts">
  let { events } = $props();
  let count = $state(0);
  let heard = $state("nothing");
  $effect(() => events.on("counted", (message) => (heard = message.from.name)));
</script>

<section>
  <button type="button" id="svelte-bump" onclick={() => { count += 1; events.send("counted", { count }); }}>
    svelte {count}
  </button>
  <span id="svelte-heard">{heard}</span>
</section>
