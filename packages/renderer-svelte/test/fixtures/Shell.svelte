<script lang="ts">
  import { slot } from "@assemblejs/renderer-svelte/client";
</script>

<section>
  <p>shell</p>
  <div>{@html slot("inner")}</div>
  <aside>before {@html slot("price", "compact")} after</aside>
</section>
