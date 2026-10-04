<script setup lang="ts">
defineProps<{ data: { label: string } }>();
</script>

<template>
  <p class="label" data-framework="vue">{{ data.label }}</p>
</template>
