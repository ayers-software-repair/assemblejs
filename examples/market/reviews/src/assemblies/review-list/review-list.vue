<script setup lang="ts">
import { computed, ref } from "vue";

type Review = { by: string; stars: number; said: string; on: string };
const props = defineProps<{ data: { reviews: Review[] } }>();

// Rendered whole on this team's server and sent to whichever page places it. In the browser it
// narrows what it was sent, and asks for nothing more: an assembly on another server's page
// cannot call home.
const least = ref(1);
const shown = computed(() => props.data.reviews.filter((review) => review.stars >= least.value));
</script>

<template>
  <section class="reviews" aria-labelledby="reviews-title">
    <header class="reviews-head">
      <h2 id="reviews-title">What people said</h2>
      <label v-if="data.reviews.length > 1" class="reviews-least">
        <span>Show</span>
        <select v-model.number="least">
          <option :value="1">All reviews</option>
          <option :value="4">4 and up</option>
          <option :value="5">5 only</option>
        </select>
      </label>
    </header>
    <p v-if="data.reviews.length === 0">Nobody has reviewed this yet.</p>
    <p v-else-if="shown.length === 0" role="status">None that high.</p>
    <ul v-else class="reviews-list">
      <li v-for="review in shown" :key="review.by + review.on" class="review">
        <p class="review-by">
          <strong>{{ review.by }}</strong>
          <span>{{ review.stars }} of 5</span>
          <time :datetime="review.on">{{ review.on }}</time>
        </p>
        <p class="review-said">{{ review.said }}</p>
      </li>
    </ul>
  </section>
</template>
