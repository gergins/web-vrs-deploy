import { logger } from "../config/logger";
import { CallRequestRepository } from "../repositories/call-request-repository";
import { QueueRepository } from "../repositories/queue-repository";
import { createId } from "../utils/ids";

export class QueueService {
  constructor(
    private readonly callRequestRepository = new CallRequestRepository(),
    private readonly queueRepository = new QueueRepository()
  ) {}

  async createQueuedCall(requesterId: string) {
    const callRequest = await this.callRequestRepository.create({
      id: createId(),
      requesterId,
      state: "requesting"
    });
    logger.info("[queue] call_request.persisted", {
      callRequestId: callRequest.id,
      requesterId,
      state: callRequest.state
    });

    const queuedCall = await this.queueRepository.enqueue(callRequest.id);
    logger.info("[queue] state.transition", {
      callRequestId: queuedCall.id,
      fromState: callRequest.state,
      toState: queuedCall.state
    });

    return queuedCall;
  }

  getQueueStatus(callRequestId: string) {
    return this.queueRepository.getStatus(callRequestId);
  }

  cancel(callRequestId: string) {
    return this.queueRepository.cancel(callRequestId);
  }
}
