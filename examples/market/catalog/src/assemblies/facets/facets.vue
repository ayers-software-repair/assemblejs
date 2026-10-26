<script setup lang="ts">
import { useEvents } from "@asmjs/renderer-vue/client";
import { onMounted, onUnmounted, ref, watch } from "vue";

type Choice = { value: string; label: string; count: number };
defineProps<{ data: { roasts: Choice[]; bands: Choice[] } }>();

// What a visitor has ticked. Every change is said on the bus, and the grid, a React assembly
// from this same server, narrows itself: nothing is fetched and no page is loaded.
const events = useEvents();
const roasts = ref<string[]>([]);
const bands = ref<string[]>([]);
const shown = ref("");
watch([roasts, bands], () =>
  events.send("facets:changed", { roasts: roasts.value, bands: bands.value }),
);

let stop = (): void => undefined;
onMounted(() => {
  stop = events.on<{ count: number; of: number }>("shelf:shown", (said) => {
    shown.value = said.payload.count === said.payload.of ? "" : `${said.payload.count} match`;
  });
});
onUnmounted(() => stop());

const clear = (): void => {
  roasts.value = [];
  bands.value = [];
};
</script>

<template>
  <form class="facets" aria-label="Narrow the shelf" @submit.prevent>
    <fieldset v-if="data.roasts.length > 0" class="facet">
      <legend>Roast</legend>
      <label v-for="choice in data.roasts" :key="choice.value" class="facet-choice">
        <input v-model="roasts" type="checkbox" :value="choice.value" />
        <span>{{ choice.label }}</span>
        <span class="facet-count">{{ choice.count }}</span>
      </label>
    </fieldset>
    <fieldset class="facet">
      <legend>Price</legend>
      <label v-for="choice in data.bands" :key="choice.value" class="facet-choice">
        <input v-model="bands" type="checkbox" :value="choice.value" />
        <span>{{ choice.label }}</span>
        <span class="facet-count">{{ choice.count }}</span>
      </label>
    </fieldset>
    <p class="facet-shown" role="status">{{ shown }}</p>
    <button
      type="button"
      class="button"
      :disabled="roasts.length + bands.length === 0"
      @click="clear"
    >
      Clear filters
    </button>
  </form>
</template>
