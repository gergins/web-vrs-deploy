import { Router, type Express } from "express";
import { AssignmentService } from "../services/assignment-service";
import { AuthService } from "../services/auth-service";
import { InterpreterService } from "../services/interpreter-service";
import { SessionService } from "../services/session-service";

export function registerInterpreterRoutes(app: Express) {
  const router = Router();
  const authService = new AuthService();
  const assignmentService = new AssignmentService();
  const interpreterService = new InterpreterService();
  const sessionService = new SessionService();

  router.get("/", async (_request, response) => {
    const interpreter = await interpreterService.findAvailableInterpreter();
    response.json({
      ok: true,
      scope: "interpreters",
      availableInterpreter: interpreter
    });
  });

  router.get("/active-offer", async (request, response) => {
    const userId = typeof request.header("x-user-id") === "string" ? request.header("x-user-id") : null;

    if (!userId) {
      response.status(400).json({
        ok: false,
        code: "invalid_request",
        error: "x-user-id is required"
      });
      return;
    }

    try {
      const identity = await authService.authenticateLocalUser(userId);
      if (identity.role !== "interpreter") {
        response.status(403).json({
          ok: false,
          code: "forbidden",
          error: "Only interpreters can request active offers"
        });
        return;
      }

      const activeOffer = await assignmentService.getActiveOfferForInterpreterUser(identity.userId);
      response.json({
        ok: true,
        activeOffer
      });
    } catch (error) {
      response.status(404).json({
        ok: false,
        code: "user_not_found",
        error: error instanceof Error ? error.message : "Interpreter not found"
      });
    }
  });

  router.get("/active-session", async (request, response) => {
    const userId =
      typeof request.header("x-user-id") === "string" ? request.header("x-user-id") : null;

    if (!userId) {
      response.status(400).json({
        ok: false,
        code: "invalid_request",
        error: "x-user-id is required"
      });
      return;
    }

    try {
      const identity = await authService.authenticateLocalUser(userId);
      if (identity.role !== "interpreter") {
        response.status(403).json({
          ok: false,
          code: "forbidden",
          error: "Only interpreters can request active sessions"
        });
        return;
      }

      const activeSession = await sessionService.getActiveSessionForInterpreterUser(
        identity.userId
      );
      response.json({
        ok: true,
        activeSession: activeSession
          ? {
              sessionId: activeSession.id
            }
          : null
      });
    } catch (error) {
      response.status(404).json({
        ok: false,
        code: "user_not_found",
        error: error instanceof Error ? error.message : "Interpreter not found"
      });
    }
  });

  app.use("/interpreters", router);
}
