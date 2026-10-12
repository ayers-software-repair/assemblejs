<script lang="ts">
  import type { AssemblyProps } from "@assemblejs/renderer-svelte";

  // What every Svelte assembly receives: its data and its events, on either side.
  let { data, events }: AssemblyProps<{ label: string }> = $props();
  let count = $state(0);
</script>

<button type="button" id="bump" onclick={() => { count += 1; events.send("counted", { count }); }}>
  {data.label} {count}
</button>
