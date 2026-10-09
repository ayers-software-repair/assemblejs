<script lang="ts">
  let { events } = $props();
  const heard = events.last("counted") === undefined ? "nothing yet" : "heard";
</script>

<p>{heard}</p>
