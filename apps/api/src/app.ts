import cors from "cors";
import express from "express";
import { corsOptions } from "./config/cors";
import { registerHealthRoutes } from "./routes/health-routes";
import { registerAuthRoutes } from "./routes/auth-routes";
import { registerCallRoutes } from "./routes/call-routes";
import { registerInterpreterRoutes } from "./routes/interpreter-routes";
import { registerQueueRoutes } from "./routes/queue-routes";
import { registerSessionRoutes } from "./routes/session-routes";
import { registerTurnRoutes } from "./routes/turn-routes";

export function createApp() {
  const app = express();

  app.use(cors(corsOptions));
  app.use(express.json());

  registerHealthRoutes(app);
  registerAuthRoutes(app);
  registerCallRoutes(app);
  registerQueueRoutes(app);
  registerSessionRoutes(app);
  registerInterpreterRoutes(app);
  registerTurnRoutes(app);

  return app;
}
