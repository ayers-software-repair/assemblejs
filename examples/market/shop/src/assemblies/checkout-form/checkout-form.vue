<script setup lang="ts">
import { useEvents } from "@asmjs/renderer-vue/client";
import { onMounted, ref } from "vue";
import { basket } from "../../browser/basket.js";

// The last step: who the parcel is for and where it goes. The order is placed by this server's
// own api, which prices the basket again; on a yes the page moves to the order's own address.
const events = useEvents();
const name = ref("");
const city = ref("");
const count = ref(0);
const problems = ref<string[]>([]);
const sending = ref(false);
onMounted(() => {
  count.value = basket.count(basket.read());
});

const place = async (): Promise<void> => {
  sending.value = true;
  problems.value = [];
  try {
    const answer = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.value, city: city.value, lines: basket.read() }),
    });
    const placed = (await answer.json()) as { ok: boolean; id?: string; problems?: string[] };
    if (placed.ok && placed.id !== undefined) {
      basket.write([]);
      events.send("basket:changed", { count: 0 });
      location.assign(`/orders/${placed.id}`);
      return;
    }
    problems.value = placed.problems ?? ["The order was not placed"];
  } catch {
    problems.value = ["We could not reach the shop just now. Nothing was ordered; try again."];
  }
  sending.value = false;
};
</script>

<template>
  <section class="checkout" aria-labelledby="checkout-title">
    <h1 id="checkout-title">Check out</h1>
    <p class="checkout-count" role="status">
      {{ count }} in your basket. <a href="/basket">Change it</a>
    </p>
    <ul v-if="problems.length > 0" class="checkout-problems" role="alert">
      <li v-for="problem in problems" :key="problem" class="notice notice--strong">
        {{ problem }}
      </li>
    </ul>
    <form @submit.prevent="place">
      <div class="field">
        <label for="checkout-name">Who is it for</label>
        <input
          id="checkout-name"
          v-model="name"
          type="text"
          autocomplete="name"
          required
          maxlength="80"
        />
      </div>
      <div class="field">
        <label for="checkout-city">Town or city</label>
        <input
          id="checkout-city"
          v-model="city"
          type="text"
          autocomplete="address-level2"
          required
          maxlength="80"
        />
      </div>
      <p class="checkout-note">A showcase: no payment is taken and nothing is sent.</p>
      <button type="submit" :disabled="sending || count === 0">
        {{ sending ? "Placing the order" : "Place the order" }}
      </button>
    </form>
  </section>
</template>
