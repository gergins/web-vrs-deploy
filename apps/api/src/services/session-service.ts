import { SessionRepository } from "../repositories/session-repository";
import type { SessionRecordModel } from "../db/model-types";
import { InterpreterService } from "./interpreter-service";
import { createId } from "../utils/ids";

export class SessionService {
  constructor(
    private readonly sessionRepository = new SessionRepository(),
    private readonly interpreterService = new InterpreterService()
  ) {}

  createSessionRecord(input: {
    callRequestId: string;
    requesterId: string;
    interpreterId: string;
  }) {
    return this.sessionRepository.create({
      id: createId(),
      callRequestId: input.callRequestId,
      requesterId: input.requesterId,
      interpreterId: input.interpreterId,
      state: "session_created"
    });
  }

  async canJoinSession(
    sessionId: string,
    actorId: string,
    role: "signer" | "interpreter" | "admin"
  ) {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      return false;
    }

    if (role === "admin") {
      return true;
    }

    if (role === "signer") {
      return session.requesterId === actorId;
    }

    if (role === "interpreter") {
      const interpreter = await this.interpreterService.findInterpreterByUserId(actorId);
      return interpreter?.id === session.interpreterId;
    }

    return false;
  }

  async getActiveSessionForInterpreterUser(userId: string) {
    const interpreter = await this.interpreterService.findInterpreterByUserId(userId);
    if (!interpreter) {
      return null;
    }

    return this.sessionRepository.findLatestActiveByInterpreterId(interpreter.id);
  }

  markSessionCompleted(sessionId: string) {
    return this.sessionRepository.markCompleted(sessionId);
  }

  async markSessionsCompleted(sessionIds: string[]): Promise<SessionRecordModel[]> {
    const uniqueSessionIds = [...new Set(sessionIds.filter(Boolean))];
    const completedSessions = await Promise.all(
      uniqueSessionIds.map((sessionId) => this.sessionRepository.markCompleted(sessionId))
    );

    return completedSessions.filter((session): session is SessionRecordModel => Boolean(session));
  }
}
