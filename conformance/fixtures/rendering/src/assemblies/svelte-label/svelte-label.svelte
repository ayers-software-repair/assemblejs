<script lang="ts">
  import type { AssemblyProps } from "@assemblejs/renderer-svelte";

  let { data }: AssemblyProps<{ label: string }> = $props();
</script>

<p class="label" data-framework="svelte">{data.label}</p>
