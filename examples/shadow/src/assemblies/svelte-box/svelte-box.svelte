<script module>
  export const shadow = true;
</script>

<script lang="ts">
  let count = $state(0);
</script>

<button type="button" class="bump" id="svelte-bump" onclick={() => (count += 1)}>svelte {count}</button>
