import type { AssignmentAttemptRecord } from "../db/model-types";
import { getPrismaClient } from "../db/prisma-client";

type CreateAssignmentAttemptInput = {
  id: string;
  callRequestId: string;
  interpreterId: string;
  outcome: string;
};

export class AssignmentAttemptRepository {
  private readonly prisma = getPrismaClient();

  create(input: CreateAssignmentAttemptInput): Promise<AssignmentAttemptRecord> {
    return this.prisma.assignmentAttempt.create({
      data: input
    });
  }

  findById(id: string): Promise<AssignmentAttemptRecord | null> {
    return this.prisma.assignmentAttempt.findUnique({
      where: { id }
    });
  }

  findOutstandingByInterpreterId(
    interpreterId: string
  ): Promise<AssignmentAttemptRecord | null> {
    return this.prisma.assignmentAttempt.findFirst({
      where: {
        interpreterId,
        outcome: "offered"
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  findLatestOfferedForCallRequestAndInterpreter(
    callRequestId: string,
    interpreterId: string
  ): Promise<AssignmentAttemptRecord | null> {
    return this.prisma.assignmentAttempt.findFirst({
      where: {
        callRequestId,
        interpreterId,
        outcome: "offered"
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  findAcceptedByCallRequestId(
    callRequestId: string
  ): Promise<AssignmentAttemptRecord | null> {
    return this.prisma.assignmentAttempt.findFirst({
      where: {
        callRequestId,
        outcome: "accepted"
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  findOutstandingByCallRequestId(
    callRequestId: string
  ): Promise<AssignmentAttemptRecord | null> {
    return this.prisma.assignmentAttempt.findFirst({
      where: {
        callRequestId,
        outcome: "offered"
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  async findInterpreterIdsByCallRequestId(callRequestId: string): Promise<string[]> {
    const attempts = await this.prisma.assignmentAttempt.findMany({
      where: { callRequestId },
      select: {
        interpreterId: true
      }
    });

    return [...new Set(attempts.map((attempt) => attempt.interpreterId))];
  }

  updateOutcome(id: string, outcome: string): Promise<AssignmentAttemptRecord> {
    return this.prisma.assignmentAttempt.update({
      where: { id },
      data: { outcome }
    });
  }

  async markAcceptedIfOffered(id: string, interpreterId: string) {
    const result = await this.prisma.assignmentAttempt.updateMany({
      where: {
        id,
        interpreterId,
        outcome: "offered"
      },
      data: {
        outcome: "accepted"
      }
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  async markDeclinedIfOffered(id: string, interpreterId: string) {
    const result = await this.prisma.assignmentAttempt.updateMany({
      where: {
        id,
        interpreterId,
        outcome: "offered"
      },
      data: {
        outcome: "declined"
      }
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }
}
