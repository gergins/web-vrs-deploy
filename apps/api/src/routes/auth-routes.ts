import { Router, type Express } from "express";
import { AuthService } from "../services/auth-service";

export function registerAuthRoutes(app: Express) {
  const router = Router();
  const authService = new AuthService();

  router.get("/", (_request, response) => {
    response.json({
      ok: true,
      scope: "auth",
      message: "Auth route scaffold is mounted"
    });
  });

  router.post("/local", async (request, response) => {
    const userId = typeof request.body?.userId === "string" ? request.body.userId : null;

    if (!userId) {
      response.status(400).json({
        ok: false,
        code: "invalid_request",
        error: "userId is required"
      });
      return;
    }

    try {
      const identity = await authService.authenticateLocalUser(userId);
      response.json({
        ok: true,
        identity
      });
    } catch (error) {
      response.status(404).json({
        ok: false,
        code: "user_not_found",
        error: error instanceof Error ? error.message : "Local user not found"
      });
    }
  });

  app.use("/auth", router);
}
