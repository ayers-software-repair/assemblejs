<script setup lang="ts">
import { Slot } from "@assemblejs/renderer-vue/client";
import { ref } from "vue";

// A Vue assembly that places a Solid one.
const count = ref(0);
</script>

<template>
  <section>
    <button type="button" id="vue-shell-bump" @click="count += 1">vue shell {{ count }}</button>
    <Slot name="solid-counter" />
  </section>
</template>
