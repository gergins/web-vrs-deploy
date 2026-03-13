import { Prisma } from "@prisma/client";
import { Router, type Express } from "express";
import { logger } from "../config/logger";
import { AssignmentService } from "../services/assignment-service";
import { PresenceService } from "../services/presence-service";
import { QueueService } from "../services/queue-service";
import { getCorrelationId } from "../utils/correlation";
import { createId } from "../utils/ids";
import { nowIsoString } from "../utils/time";

export function registerCallRoutes(app: Express) {
  const router = Router();
  const queueService = new QueueService();
  const assignmentService = new AssignmentService();
  const presenceService = new PresenceService();

  router.get("/", (_request, response) => {
    response.json({
      ok: true,
      scope: "calls",
      message: "Call route scaffold is mounted"
    });
  });

  router.post("/", async (request, response) => {
    const correlationId = getCorrelationId(request.header("x-correlation-id"));
    logger.info("[queue] request.received", {
      correlationId,
      requesterIdHeader: request.header("x-user-id") ?? null,
      requesterIdBody:
        typeof request.body?.requesterId === "string" ? request.body.requesterId : null
    });

    try {
      const requesterId =
        request.header("x-user-id") ??
        (typeof request.body?.requesterId === "string" ? request.body.requesterId : null);

      if (!requesterId) {
        response.status(400).json({
          ok: false,
          code: "invalid_request",
          error: "requesterId is required via x-user-id header or request body"
        });
        return;
      }

      const queuedCall = await queueService.createQueuedCall(requesterId);
      logger.info("[queue] call_request.created", {
        callRequestId: queuedCall.id,
        requesterId,
        correlationId,
        state: queuedCall.state
      });

      presenceService.emitToUser(requesterId, {
        messageId: createId(),
        correlationId,
        type: "queue.updated",
        timestamp: nowIsoString(),
        sessionId: null,
        actorId: requesterId,
        payload: {
          callRequestId: queuedCall.id,
          state: queuedCall.state
        }
      });

      const offerResult = await assignmentService.offerCall(queuedCall);
      const callRequest = offerResult?.callRequest ?? queuedCall;

      response.status(201).json({
        ok: true,
        callRequest
      });
    } catch (error) {
      const isDatabaseInitializationError =
        error instanceof Prisma.PrismaClientInitializationError;
      const message =
        error instanceof Error ? error.message : "Failed to create call request";

      logger.error("[queue] call_request.failed", {
        correlationId,
        error: message
      });
      response.status(isDatabaseInitializationError ? 503 : 500).json({
        ok: false,
        code: isDatabaseInitializationError ? "database_unavailable" : "call_request_failed",
        error: isDatabaseInitializationError
          ? "Database unavailable while creating call request"
          : message,
        details: message
      });
    }
  });

  app.use("/calls", router);
}
