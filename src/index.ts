import { init, shutdown } from "pendo-server-sdk";
import { createApp } from "./app.js";

// Pendo Agent Analytics for the Tripwise Assistant. Runs once per process, before the server starts.
init({
  apiKey: "43590f09-ad5b-4e0a-8960-6d3d0727aa00",
  agentId: "SGJHpx06fe3wFuu6_X3nvuI9c9M",
  endpoint: "https://app.pendo-dev.pendo-dev.com",
  autoPatch: true,
});

const port = Number(process.env.PORT) || 3001;
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

const server = createApp(corsOrigin).listen(port, () => {
  console.log(`Tripwise API on port ${port}, allowing ${corsOrigin}`);
});

// Send Pendo's buffered events before the process stops.
server.on("close", () => {
  void shutdown();
});
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    await shutdown();
    process.exit(0);
  });
}
