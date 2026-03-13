import { Router, type Express } from "express";
import { InterpreterService } from "../services/interpreter-service";

export function registerInterpreterRoutes(app: Express) {
  const router = Router();
  const interpreterService = new InterpreterService();

  router.get("/", async (_request, response) => {
    const interpreter = await interpreterService.findAvailableInterpreter();
    response.json({
      ok: true,
      scope: "interpreters",
      availableInterpreter: interpreter
    });
  });

  app.use("/interpreters", router);
}
