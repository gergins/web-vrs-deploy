import { Router, type Express } from "express";
import { SessionRepository } from "../repositories/session-repository";

export function registerSessionRoutes(app: Express) {
  const router = Router();
  const sessionRepository = new SessionRepository();

  router.get("/", (_request, response) => {
    response.json({
      ok: true,
      scope: "sessions",
      message: "Session route scaffold is mounted"
    });
  });

  router.get("/:sessionId", async (request, response) => {
    const session = await sessionRepository.findById(request.params.sessionId);
    if (!session) {
      response.status(404).json({
        ok: false,
        error: "Session not found"
      });
      return;
    }

    response.json({
      ok: true,
      session
    });
  });

  app.use("/sessions", router);
}
