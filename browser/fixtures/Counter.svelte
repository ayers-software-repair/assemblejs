<script lang="ts">
  let { data, events } = $props();
  let count = $state(0);
</script>

<button type="button" id="bump" onclick={() => { count += 1; events?.send("counted", { count }); }}>
  {data.label} {count}
</button>
