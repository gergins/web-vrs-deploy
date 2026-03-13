import type { InboundSignalMessage } from "../dto/inbound-signal-message";
import { AssignmentService } from "../../services/assignment-service";
import { QueueService } from "../../services/queue-service";
import { createId } from "../../utils/ids";
import { nowIsoString } from "../../utils/time";
import type { SignalRouteResult } from "../signaling-context";

const queueService = new QueueService();
const assignmentService = new AssignmentService();

export async function handleCallRequest(
  message: InboundSignalMessage,
  actorId: string
): Promise<SignalRouteResult> {
  const queuedCall = await queueService.createQueuedCall(actorId);
  const offerResult = await assignmentService.offerCall(queuedCall);

  return {
    directMessages: [
      {
        messageId: createId(),
        correlationId: message.correlationId,
        type: "queue.updated",
        timestamp: nowIsoString(),
        sessionId: null,
        actorId,
        payload: {
          callRequestId: queuedCall.id,
          state: offerResult ? "offered" : "queued"
        }
      }
    ]
  };
}
