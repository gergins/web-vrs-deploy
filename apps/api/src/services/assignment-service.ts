import type {
  AssignmentAttemptRecord,
  CallRequestRecord
} from "../db/model-types";
import type { InboundSignalMessage } from "../signaling/dto/inbound-signal-message";
import type { OutboundSignalMessage } from "../signaling/dto/outbound-signal-message";
import { getPrismaClient } from "../db/prisma-client";
import { AssignmentAttemptRepository } from "../repositories/assignment-attempt-repository";
import { CallRequestRepository } from "../repositories/call-request-repository";
import { PresenceService } from "./presence-service";
import { createId } from "../utils/ids";
import { nowIsoString } from "../utils/time";
import { InterpreterService } from "./interpreter-service";
import { SessionService } from "./session-service";
import { logger } from "../config/logger";
import { env } from "../config/env";
import type { RoutingMode } from "../../../../packages/contracts/src/shared/routing";

type OfferedAssignment = {
  callRequest: CallRequestRecord;
  assignmentAttempts: AssignmentAttemptRecord[];
  interpreterUserIds: string[];
};

type AssignmentResponseResult = {
  directMessages: OutboundSignalMessage[];
  userMessages: Array<{
    userId: string;
    message: OutboundSignalMessage;
  }>;
};

export type ActiveInterpreterOffer = {
  assignmentAttemptId: string;
  callRequestId: string;
  interpreterId: string;
};

type CancelledAssignmentAttempt = {
  id: string;
  interpreterId: string;
};

export class AssignmentService {
  private readonly prisma = getPrismaClient();

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
    return this.offerCallByMode(env.routingMode, callRequest, excludedInterpreterIds);
  }

  private offerCallByMode(
    routingMode: RoutingMode,
    callRequest: CallRequestRecord,
    excludedInterpreterIds: string[]
  ): Promise<OfferedAssignment | null> {
    switch (routingMode) {
      case "sequential":
        return this.offerCallSequential(callRequest, excludedInterpreterIds);
      case "simultaneous":
        return this.offerCallSimultaneous(callRequest, excludedInterpreterIds);
      default:
        throw new Error(`Unsupported routing mode: ${routingMode}`);
    }
  }

  private async offerCallSequential(
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
      assignmentAttempts: [assignmentAttempt],
      interpreterUserIds: [interpreter.userId]
    };
  }

  private async offerCallSimultaneous(
    callRequest: CallRequestRecord,
    excludedInterpreterIds: string[] = []
  ): Promise<OfferedAssignment | null> {
    const interpreters = await this.interpreterService.findAvailableInterpreters(
      env.simultaneousOfferFanout,
      excludedInterpreterIds
    );
    if (interpreters.length === 0) {
      await this.callRequestRepository.updateState(callRequest.id, "queued", null);
      return null;
    }

    const assignmentAttempts = await Promise.all(
      interpreters.map((interpreter) =>
        this.assignmentAttemptRepository.create({
          id: createId(),
          callRequestId: callRequest.id,
          interpreterId: interpreter.id,
          outcome: "offered"
        })
      )
    );

    const updatedCallRequest = await this.callRequestRepository.updateState(
      callRequest.id,
      "offered",
      null
    );

    interpreters.forEach((interpreter, index) => {
      const assignmentAttempt = assignmentAttempts[index];
      logger.info("[queue] assignment.created", {
        callRequestId: callRequest.id,
        assignmentAttemptId: assignmentAttempt.id,
        interpreterId: interpreter.id,
        interpreterUserId: interpreter.userId,
        routingMode: "simultaneous"
      });

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
        deliveredCount,
        routingMode: "simultaneous"
      });
    });

    return {
      callRequest: updatedCallRequest,
      assignmentAttempts,
      interpreterUserIds: interpreters.map((interpreter) => interpreter.userId)
    };
  }

  async getActiveOfferForInterpreterUser(
    userId: string
  ): Promise<ActiveInterpreterOffer | null> {
    const interpreter = await this.interpreterService.findInterpreterByUserId(userId);
    if (!interpreter) {
      return null;
    }

    const assignmentAttempt = await this.assignmentAttemptRepository.findOutstandingByInterpreterId(
      interpreter.id
    );
    if (!assignmentAttempt) {
      return null;
    }

    const callRequest = await this.callRequestRepository.findById(assignmentAttempt.callRequestId);
    if (!callRequest || callRequest.state !== "offered") {
      return null;
    }

    const requesterIsPresent = await this.presenceService.isUserPresent(callRequest.requesterId);
    if (!requesterIsPresent) {
      return null;
    }

    const offerAgeMs = Date.now() - assignmentAttempt.createdAt.getTime();
    if (offerAgeMs > env.queueOfferTimeoutMs) {
      logger.info("[queue] assignment.active_offer_expired", {
        assignmentAttemptId: assignmentAttempt.id,
        callRequestId: assignmentAttempt.callRequestId,
        interpreterId: interpreter.id,
        offerAgeMs,
        queueOfferTimeoutMs: env.queueOfferTimeoutMs
      });
      return null;
    }

    return {
      assignmentAttemptId: assignmentAttempt.id,
      callRequestId: callRequest.id,
      interpreterId: interpreter.id
    };
  }

  async getAcceptedInterpreterIdForCall(
    callRequestId: string
  ): Promise<string | null> {
    const acceptedAssignmentAttempt =
      await this.assignmentAttemptRepository.findAcceptedByCallRequestId(callRequestId);
    return acceptedAssignmentAttempt?.interpreterId ?? null;
  }

  private async claimAssignmentAcceptance(input: {
    assignmentAttemptId: string;
    interpreterId: string;
    callRequestId: string;
  }): Promise<{
    acceptedCallRequest: CallRequestRecord;
    cancelledAssignmentAttempts: CancelledAssignmentAttempt[];
  }> {
    return this.prisma.$transaction(async (tx) => {
      const claimedCallRequest = await tx.callRequest.updateMany({
        where: {
          id: input.callRequestId,
          state: "offered",
          ...(env.routingMode === "sequential"
            ? { assignedInterpreterId: input.interpreterId }
            : {})
        },
        data: {
          state: "accepted",
          assignedInterpreterId: input.interpreterId
        }
      });
      if (claimedCallRequest.count === 0) {
        throw new Error("Call is no longer claimable for acceptance");
      }

      const claimedAssignmentAttempt = await tx.assignmentAttempt.updateMany({
        where: {
          id: input.assignmentAttemptId,
          interpreterId: input.interpreterId,
          outcome: "offered"
        },
        data: {
          outcome: "accepted"
        }
      });
      if (claimedAssignmentAttempt.count === 0) {
        throw new Error("Assignment offer is no longer claimable for acceptance");
      }

      const cancelledAssignmentAttempts = await tx.assignmentAttempt.findMany({
        where: {
          callRequestId: input.callRequestId,
          outcome: "offered",
          id: {
            not: input.assignmentAttemptId
          }
        },
        select: {
          id: true,
          interpreterId: true
        }
      });

      await tx.assignmentAttempt.updateMany({
        where: {
          callRequestId: input.callRequestId,
          outcome: "offered",
          id: {
            not: input.assignmentAttemptId
          }
        },
        data: {
          outcome: "cancelled"
        }
      });

      const acceptedCallRequest = await tx.callRequest.findUnique({
        where: { id: input.callRequestId }
      });
      if (!acceptedCallRequest) {
        throw new Error("Accepted call request not found after claim");
      }

      return {
        acceptedCallRequest: acceptedCallRequest as CallRequestRecord,
        cancelledAssignmentAttempts
      };
    });
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
      const { acceptedCallRequest, cancelledAssignmentAttempts } =
        await this.claimAssignmentAcceptance({
        assignmentAttemptId: assignmentAttempt.id,
        interpreterId: interpreter.id,
        callRequestId: callRequest.id
      });

      await this.emitCancelledAssignmentAttempts({
        callRequestId: callRequest.id,
        correlationId: input.message.correlationId,
        cancelledAssignmentAttempts
      });

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

    return this.handleDeclinedAssignmentResponse({
      assignmentAttempt,
      callRequest,
      actorId: input.actorId,
      correlationId: input.message.correlationId
    });
  }

  private async handleDeclinedAssignmentResponse(input: {
    assignmentAttempt: AssignmentAttemptRecord;
    callRequest: CallRequestRecord;
    actorId: string;
    correlationId: string;
  }): Promise<AssignmentResponseResult> {
    const declinedAssignmentAttempt =
      await this.assignmentAttemptRepository.markDeclinedIfOffered(
        input.assignmentAttempt.id,
        input.assignmentAttempt.interpreterId
      );
    if (!declinedAssignmentAttempt) {
      throw new Error("Assignment offer is no longer claimable for decline");
    }

    const declinedMessage = this.createMessage({
      type: "assignment.declined",
      actorId: input.actorId,
      sessionId: null,
      correlationId: input.correlationId,
      payload: {
        assignmentAttemptId: input.assignmentAttempt.id,
        callRequestId: input.callRequest.id
      }
    });

    const currentCallRequest = await this.callRequestRepository.findById(input.callRequest.id);
    if (!currentCallRequest || currentCallRequest.state !== "offered") {
      return {
        directMessages: [declinedMessage],
        userMessages: []
      };
    }

    if (env.routingMode === "simultaneous") {
      const outstandingOffer = await this.assignmentAttemptRepository.findOutstandingByCallRequestId(
        currentCallRequest.id
      );
      if (outstandingOffer) {
        return {
          directMessages: [declinedMessage],
          userMessages: []
        };
      }

      const queuedCallRequest = await this.callRequestRepository.updateState(
        currentCallRequest.id,
        "queued",
        null
      );
      const excludedInterpreterIds =
        await this.assignmentAttemptRepository.findInterpreterIdsByCallRequestId(currentCallRequest.id);
      const nextOffer = await this.offerCall(queuedCallRequest, excludedInterpreterIds);

      const userMessages: AssignmentResponseResult["userMessages"] = [];
      if (!nextOffer) {
        userMessages.push({
          userId: queuedCallRequest.requesterId,
          message: this.createMessage({
            type: "queue.updated",
            actorId: queuedCallRequest.requesterId,
            sessionId: null,
            correlationId: input.correlationId,
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

    const queuedCallRequest = await this.callRequestRepository.updateState(
      input.callRequest.id,
      "queued",
      null
    );
    const nextOffer = await this.offerCall(queuedCallRequest, [input.assignmentAttempt.interpreterId]);

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
          correlationId: input.correlationId,
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

  private async emitCancelledAssignmentAttempts(input: {
    callRequestId: string;
    correlationId: string;
    cancelledAssignmentAttempts: CancelledAssignmentAttempt[];
  }): Promise<void> {
    if (input.cancelledAssignmentAttempts.length === 0) {
      return;
    }

    const cancelledInterpreters = await Promise.all(
      input.cancelledAssignmentAttempts.map(async (assignmentAttempt) => ({
        assignmentAttemptId: assignmentAttempt.id,
        interpreter: await this.interpreterService.findInterpreterById(
          assignmentAttempt.interpreterId
        )
      }))
    );

    cancelledInterpreters.forEach(({ assignmentAttemptId, interpreter }) => {
      if (!interpreter) {
        return;
      }

      const cancelledMessage = this.createMessage({
        type: "assignment.cancelled",
        actorId: interpreter.userId,
        sessionId: null,
        correlationId: input.correlationId,
        payload: {
          assignmentAttemptId,
          callRequestId: input.callRequestId,
          interpreterId: interpreter.id
        }
      });

      const deliveredCount = this.presenceService.emitToUser(
        interpreter.userId,
        cancelledMessage
      );

      logger.info("[queue] assignment.cancelled", {
        callRequestId: input.callRequestId,
        assignmentAttemptId,
        interpreterId: interpreter.id,
        interpreterUserId: interpreter.userId,
        deliveredCount
      });
    });
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


