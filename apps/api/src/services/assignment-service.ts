import type {
  AssignmentAttemptRecord,
  CallRequestRecord
} from "../db/model-types";
import type { InboundSignalMessage } from "../signaling/dto/inbound-signal-message";
import type { OutboundSignalMessage } from "../signaling/dto/outbound-signal-message";
import { AssignmentAttemptRepository } from "../repositories/assignment-attempt-repository";
import { CallRequestRepository } from "../repositories/call-request-repository";
import { PresenceService } from "./presence-service";
import { createId } from "../utils/ids";
import { nowIsoString } from "../utils/time";
import { InterpreterService } from "./interpreter-service";
import { SessionService } from "./session-service";
import { logger } from "../config/logger";

type OfferedAssignment = {
  callRequest: CallRequestRecord;
  assignmentAttempt: AssignmentAttemptRecord;
  interpreterUserId: string;
};

type AssignmentResponseResult = {
  directMessages: OutboundSignalMessage[];
  userMessages: Array<{
    userId: string;
    message: OutboundSignalMessage;
  }>;
};

export class AssignmentService {
  constructor(
    private readonly assignmentAttemptRepository = new AssignmentAttemptRepository(),
    private readonly callRequestRepository = new CallRequestRepository(),
    private readonly interpreterService = new InterpreterService(),
    private readonly sessionService = new SessionService(),
    private readonly presenceService = new PresenceService()
  ) {}

  async offerCall(
    callRequest: CallRequestRecord,
    excludedInterpreterIds: string[] = []
  ): Promise<OfferedAssignment | null> {
    const interpreter = await this.interpreterService.findAvailableInterpreter(
      excludedInterpreterIds
    );
    if (!interpreter) {
      await this.callRequestRepository.updateState(callRequest.id, "queued", null);
      return null;
    }

    const assignmentAttempt = await this.assignmentAttemptRepository.create({
      id: createId(),
      callRequestId: callRequest.id,
      interpreterId: interpreter.id,
      outcome: "offered"
    });

    logger.info("[queue] assignment.created", {
      callRequestId: callRequest.id,
      assignmentAttemptId: assignmentAttempt.id,
      interpreterId: interpreter.id,
      interpreterUserId: interpreter.userId
    });

    const updatedCallRequest = await this.callRequestRepository.updateState(
      callRequest.id,
      "offered",
      interpreter.id
    );

    const offeredMessage = this.createMessage({
      type: "assignment.offered",
      actorId: interpreter.userId,
      sessionId: null,
      correlationId: assignmentAttempt.id,
      payload: {
        assignmentAttemptId: assignmentAttempt.id,
        callRequestId: callRequest.id,
        interpreterId: interpreter.id
      }
    });

    const deliveredCount = this.presenceService.emitToUser(
      interpreter.userId,
      offeredMessage
    );
    logger.info("[queue] assignment.offered", {
      callRequestId: callRequest.id,
      assignmentAttemptId: assignmentAttempt.id,
      interpreterId: interpreter.id,
      interpreterUserId: interpreter.userId,
      deliveredCount
    });

    return {
      callRequest: updatedCallRequest,
      assignmentAttempt,
      interpreterUserId: interpreter.userId
    };
  }

  async handleAssignmentResponse(input: {
    message: InboundSignalMessage;
    actorId: string;
    actorRole: "signer" | "interpreter" | "admin";
  }): Promise<AssignmentResponseResult> {
    if (input.actorRole !== "interpreter") {
      throw new Error("Only interpreter connections can respond to assignments");
    }

    const assignmentAttemptId = input.message.payload.assignmentAttemptId;
    const decision = input.message.payload.decision;

    if (typeof assignmentAttemptId !== "string" || assignmentAttemptId.length === 0) {
      throw new Error("client.assignment-response requires assignmentAttemptId");
    }

    if (decision !== "accept" && decision !== "decline") {
      throw new Error("client.assignment-response requires decision accept or decline");
    }

    const assignmentAttempt = await this.assignmentAttemptRepository.findById(
      assignmentAttemptId
    );
    if (!assignmentAttempt) {
      throw new Error("Assignment attempt not found");
    }

    const interpreter = await this.interpreterService.findInterpreterByUserId(
      input.actorId
    );
    if (!interpreter) {
      throw new Error("Interpreter profile not found");
    }

    if (assignmentAttempt.interpreterId !== interpreter.id) {
      throw new Error("Interpreter cannot respond to another interpreter's assignment");
    }

    const callRequest = await this.callRequestRepository.findById(
      assignmentAttempt.callRequestId
    );
    if (!callRequest) {
      throw new Error("Call request not found");
    }

    if (decision === "accept") {
      await this.assignmentAttemptRepository.updateOutcome(
        assignmentAttempt.id,
        "accepted"
      );
      const acceptedCallRequest = await this.callRequestRepository.updateState(
        callRequest.id,
        "accepted",
        interpreter.id
      );
      const session = await this.sessionService.createSessionRecord({
        callRequestId: acceptedCallRequest.id,
        requesterId: acceptedCallRequest.requesterId,
        interpreterId: interpreter.id
      });

      const acceptedMessage = this.createMessage({
        type: "assignment.accepted",
        actorId: input.actorId,
        sessionId: session.id,
        correlationId: input.message.correlationId,
        payload: {
          assignmentAttemptId: assignmentAttempt.id,
          callRequestId: callRequest.id
        }
      });

      const sessionCreatedMessage = this.createMessage({
        type: "session.created",
        actorId: input.actorId,
        sessionId: session.id,
        correlationId: input.message.correlationId,
        payload: {
          callRequestId: callRequest.id,
          sessionId: session.id
        }
      });

      return {
        directMessages: [acceptedMessage, sessionCreatedMessage],
        userMessages: [
          {
            userId: acceptedCallRequest.requesterId,
            message: acceptedMessage
          },
          {
            userId: acceptedCallRequest.requesterId,
            message: sessionCreatedMessage
          }
        ]
      };
    }

    await this.assignmentAttemptRepository.updateOutcome(assignmentAttempt.id, "declined");
    const queuedCallRequest = await this.callRequestRepository.updateState(
      callRequest.id,
      "queued",
      null
    );

    const declinedMessage = this.createMessage({
      type: "assignment.declined",
      actorId: input.actorId,
      sessionId: null,
      correlationId: input.message.correlationId,
      payload: {
        assignmentAttemptId: assignmentAttempt.id,
        callRequestId: callRequest.id
      }
    });

    const nextOffer = await this.offerCall(queuedCallRequest, [assignmentAttempt.interpreterId]);

    const userMessages: AssignmentResponseResult["userMessages"] = [
      {
        userId: queuedCallRequest.requesterId,
        message: declinedMessage
      }
    ];

    if (!nextOffer) {
      userMessages.push({
        userId: queuedCallRequest.requesterId,
        message: this.createMessage({
          type: "queue.updated",
          actorId: queuedCallRequest.requesterId,
          sessionId: null,
          correlationId: input.message.correlationId,
          payload: {
            callRequestId: queuedCallRequest.id,
            state: "queued"
          }
        })
      });
    }

    return {
      directMessages: [declinedMessage],
      userMessages
    };
  }

  private createMessage(input: {
    type: OutboundSignalMessage["type"];
    correlationId: string;
    actorId: string;
    sessionId: string | null;
    payload: Record<string, unknown>;
  }): OutboundSignalMessage {
    return {
      messageId: createId(),
      correlationId: input.correlationId,
      type: input.type,
      timestamp: nowIsoString(),
      sessionId: input.sessionId,
      actorId: input.actorId,
      payload: input.payload
    };
  }
}


