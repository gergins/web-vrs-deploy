import type { InterpreterRecord } from "../db/model-types";
import { getPrismaClient } from "../db/prisma-client";

export class InterpreterRepository {
  private readonly prisma = getPrismaClient();

  findAvailable(excludedInterpreterIds: string[] = []): Promise<InterpreterRecord | null> {
    return this.prisma.interpreter.findFirst({
      where: {
        status: "available",
        id: {
          notIn: excludedInterpreterIds
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });
  }

  findById(id: string): Promise<InterpreterRecord | null> {
    return this.prisma.interpreter.findUnique({
      where: { id }
    });
  }

  findByUserId(userId: string): Promise<InterpreterRecord | null> {
    return this.prisma.interpreter.findUnique({
      where: { userId }
    });
  }
}
