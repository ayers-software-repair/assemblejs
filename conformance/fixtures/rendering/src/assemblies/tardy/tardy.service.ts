import { defineService } from "@asmjs/core";

// Takes its time before its view places a child, so an asker may have left by then.
export default defineService({
  name: "tardy",
  schema: { properties: { waited: { type: "number" } }, required: ["waited"] },
  run: () => new Promise((resolve) => setTimeout(() => resolve({ waited: 300 }), 300)),
});
