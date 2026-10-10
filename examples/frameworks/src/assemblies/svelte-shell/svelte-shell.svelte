<script lang="ts">
  import { slot } from "@assemblejs/renderer-svelte/client";

  let count = $state(0);
</script>

<!-- A Svelte assembly that places a Preact one, with the directive written in Svelte's raw form. -->
<section>
  <button type="button" id="svelte-shell-bump" onclick={() => (count += 1)}>
    svelte shell {count}
  </button>
  <div>{@html slot("preact-counter")}</div>
</section>
