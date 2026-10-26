<script lang="ts">
  import type { AssemblyProps } from "@asmjs/renderer-svelte";

  let { data }: AssemblyProps<{ note: string }> = $props();
</script>

<section data-parent="raw-svelte"><p class="quoted">{data.note}</p><div class="raw">{@html data.note}</div></section>
