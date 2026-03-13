import { createServer } from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { attachSignalingGateway } from "./signaling/signaling-gateway";

const port = env.apiPort;
const app = createApp();
const server = createServer(app);

attachSignalingGateway(server);

server.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
