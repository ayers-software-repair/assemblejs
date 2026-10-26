import { definePage } from "@asmjs/core";

const producer = process.env.PRODUCER_ORIGIN ?? "";
const from = (origin: string, name: string): string => `${origin}/assembly/${name}/`;

// The producer is declared trusted, so this page's query reaches the echo it places.
export default definePage({ route: "/trusted", place: { echo: { url: from(producer, "echo") } } });
