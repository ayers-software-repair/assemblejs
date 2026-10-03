<script lang="ts">
export const shadow = true;
</script>

<script setup lang="ts">
import { ref } from "vue";

const count = ref(0);
</script>

<template>
  <button type="button" class="bump" id="vue-bump" @click="count += 1">vue {{ count }}</button>
</template>
