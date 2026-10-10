<script lang="ts">
  let { data } = $props();
</script>

<section data-parent="raw-svelte"><p class="quoted">{data.note}</p><div class="raw">{@html data.note}</div></section>
