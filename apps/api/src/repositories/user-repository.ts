import type { UserRecord } from "../db/model-types";
import { getPrismaClient } from "../db/prisma-client";

export class UserRepository {
  private readonly prisma = getPrismaClient();

  findById(id: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({
      where: { id }
    });
  }
}
