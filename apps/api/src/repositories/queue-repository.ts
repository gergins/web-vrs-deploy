import type { CallRequestRecord } from "../db/model-types";
import { getPrismaClient } from "../db/prisma-client";

export class QueueRepository {
  private readonly prisma = getPrismaClient();

  enqueue(callRequestId: string): Promise<CallRequestRecord> {
    return this.prisma.callRequest.update({
      where: { id: callRequestId },
      data: { state: "queued" }
    });
  }

  getStatus(
    callRequestId: string
  ): Promise<Pick<CallRequestRecord, "id" | "state" | "assignedInterpreterId"> | null> {
    return this.prisma.callRequest.findUnique({
      where: { id: callRequestId },
      select: {
        id: true,
        state: true,
        assignedInterpreterId: true
      }
    });
  }

  cancel(callRequestId: string): Promise<CallRequestRecord> {
    return this.prisma.callRequest.update({
      where: { id: callRequestId },
      data: {
        state: "cancelled",
        assignedInterpreterId: null
      }
    });
  }
}
