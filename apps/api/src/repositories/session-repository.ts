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
}
