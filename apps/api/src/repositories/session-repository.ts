import type { SessionRecordModel } from "../db/model-types";
import { getPrismaClient } from "../db/prisma-client";

type CreateSessionRecordInput = {
  id: string;
  callRequestId: string;
  requesterId: string;
  interpreterId: string;
  state: string;
};

export class SessionRepository {
  private readonly prisma = getPrismaClient();

  create(input: CreateSessionRecordInput): Promise<SessionRecordModel> {
    return this.prisma.sessionRecord.create({
      data: input
    });
  }

  findById(id: string): Promise<SessionRecordModel | null> {
    return this.prisma.sessionRecord.findUnique({
      where: { id }
    });
  }

  findLatestActiveByInterpreterId(
    interpreterId: string
  ): Promise<SessionRecordModel | null> {
    return this.prisma.sessionRecord.findFirst({
      where: {
        interpreterId,
        endedAt: null,
        state: {
          notIn: ["completed", "cancelled", "failed"]
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  async markCompleted(id: string): Promise<SessionRecordModel | null> {
    const result = await this.prisma.sessionRecord.updateMany({
      where: {
        id,
        endedAt: null
      },
      data: {
        state: "completed",
        endedAt: new Date()
      }
    });

    if (result.count === 0) {
      return this.findById(id);
    }

    return this.findById(id);
  }
}
