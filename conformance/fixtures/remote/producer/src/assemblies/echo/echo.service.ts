import { defineService } from "@assemblejs/core";

// What the page's visitor typed, which reaches this server only from a page that trusts it.
export default defineService({
  name: "echo",
  schema: { properties: { note: { type: "string" } }, required: ["note"] },
  run: ({ query }) => ({ note: query.get("note") ?? "nothing" }),
});
