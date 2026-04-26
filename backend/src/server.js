import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

app.listen(env.port, () => {
  console.log(`Hire GCians backend listening on https://hire-g-cians.vercel.app/`);
});
