<script lang="ts">
  // The two props every assembly receives, plus the events object the browser half is handed.
  let { data, events } = $props();
  let count = $state(0);
</script>

<button type="button" id="bump" onclick={() => { count += 1; events?.send("counted", { count }); }}>
  {data.label} {count}
</button>
