import type { CallRequestRecord } from "../db/model-types";
import { getPrismaClient } from "../db/prisma-client";

type CreateCallRequestInput = {
  id: string;
  requesterId: string;
  state: string;
  assignedInterpreterId?: string | null;
};

export class CallRequestRepository {
  private readonly prisma = getPrismaClient();

  create(input: CreateCallRequestInput): Promise<CallRequestRecord> {
    return this.prisma.callRequest.create({
      data: {
        id: input.id,
        requesterId: input.requesterId,
        state: input.state,
        assignedInterpreterId: input.assignedInterpreterId ?? null
      }
    });
  }

  findById(id: string): Promise<CallRequestRecord | null> {
    return this.prisma.callRequest.findUnique({
      where: { id }
    });
  }

  findActiveOfferedByInterpreterId(
    interpreterId: string
  ): Promise<CallRequestRecord | null> {
    return this.prisma.callRequest.findFirst({
      where: {
        state: "offered",
        assignedInterpreterId: interpreterId
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  updateState(id: string, state: string, assignedInterpreterId?: string | null) {
    return this.prisma.callRequest.update({
      where: { id },
      data: {
        state,
        ...(assignedInterpreterId === undefined ? {} : { assignedInterpreterId })
      }
    });
  }

  async claimAccepted(id: string, interpreterId: string) {
    const result = await this.prisma.callRequest.updateMany({
      where: {
        id,
        state: "offered",
        assignedInterpreterId: interpreterId
      },
      data: {
        state: "accepted",
        assignedInterpreterId: interpreterId
      }
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }
}
