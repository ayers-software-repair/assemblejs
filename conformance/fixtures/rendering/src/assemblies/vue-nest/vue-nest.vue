<script setup lang="ts">
import { Slot } from "@asmjs/renderer-vue/client";
</script>

<template>
  <section class="nest" data-parent="vue"><Slot name="svelte-label" /></section>
</template>
