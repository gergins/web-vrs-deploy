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

  updateOutcome(id: string, outcome: string): Promise<AssignmentAttemptRecord> {
    return this.prisma.assignmentAttempt.update({
      where: { id },
      data: { outcome }
    });
  }
}
