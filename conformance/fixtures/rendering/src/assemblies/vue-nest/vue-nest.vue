<script setup lang="ts">
import { Slot } from "@assemblejs/renderer-vue/client";
</script>

<template>
  <section class="nest" data-parent="vue"><Slot name="svelte-label" /></section>
</template>
