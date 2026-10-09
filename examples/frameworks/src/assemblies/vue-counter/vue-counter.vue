<script setup lang="ts">
import { useEvents } from "@assemblejs/renderer-vue/client";
import { onMounted, onUnmounted, ref } from "vue";

const events = useEvents();
const count = ref(0);
const heard = ref("nothing");
let stop = (): void => undefined;
onMounted(() => {
  stop = events.on("counted", (message) => (heard.value = message.from.name));
});
onUnmounted(() => stop());

const bump = (): void => {
  count.value += 1;
  events.send("counted", { count: count.value });
};
</script>

<template>
  <section>
    <button type="button" id="vue-bump" class="bump" @click="bump">vue {{ count }}</button>
    <span id="vue-heard">{{ heard }}</span>
  </section>
</template>

<style scoped>
.bump {
  color: rgb(0, 120, 60);
}
</style>
