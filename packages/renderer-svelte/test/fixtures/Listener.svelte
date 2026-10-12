<script lang="ts">
  import type { AssemblyProps } from "@assemblejs/renderer-svelte";

  let { events }: AssemblyProps = $props();
  const heard = events.last("counted") === undefined ? "nothing yet" : "heard";
</script>

<p>{heard}</p>
