import { Router, type Express } from "express";
import { QueueService } from "../services/queue-service";

export function registerQueueRoutes(app: Express) {
  const router = Router();
  const queueService = new QueueService();

  router.get("/", (_request, response) => {
    response.json({
      ok: true,
      scope: "queue",
      message: "Queue route scaffold is mounted"
    });
  });

  router.get("/:callRequestId", async (request, response) => {
    const queueStatus = await queueService.getQueueStatus(request.params.callRequestId);
    if (!queueStatus) {
      response.status(404).json({
        ok: false,
        error: "Call request not found"
      });
      return;
    }

    response.json({
      ok: true,
      queue: queueStatus
    });
  });

  router.delete("/:callRequestId", async (request, response) => {
    const cancelledCall = await queueService.cancel(request.params.callRequestId);
    response.json({
      ok: true,
      callRequest: cancelledCall
    });
  });

  app.use("/queue", router);
}
