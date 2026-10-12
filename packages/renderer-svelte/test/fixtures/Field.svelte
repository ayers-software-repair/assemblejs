<script>
  // An id of the component's own, for a label and the input it names.
  const uid = $props.id();
</script>

<label for="{uid}-q">q</label>
<input id="{uid}-q" />
