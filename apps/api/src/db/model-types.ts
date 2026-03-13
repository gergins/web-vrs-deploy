export type UserRecord = {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
};

export type InterpreterRecord = {
  id: string;
  userId: string;
  status: string;
  createdAt: Date;
};

export type CallRequestRecord = {
  id: string;
  requesterId: string;
  state: string;
  assignedInterpreterId: string | null;
  createdAt: Date;
};

export type SessionRecordModel = {
  id: string;
  callRequestId: string;
  requesterId: string;
  interpreterId: string;
  state: string;
  createdAt: Date;
  endedAt: Date | null;
};

export type AssignmentAttemptRecord = {
  id: string;
  callRequestId: string;
  interpreterId: string;
  outcome: string;
  createdAt: Date;
};

type FindUniqueArgs<TRecord> = {
  where: Record<string, unknown>;
  select?: Record<string, boolean>;
};

type CreateArgs = {
  data: Record<string, unknown>;
};

type UpdateArgs = {
  where: Record<string, unknown>;
  data: Record<string, unknown>;
};

type FindFirstArgs = {
  where?: Record<string, unknown>;
  orderBy?: Record<string, unknown>;
};

type PrismaDelegate<TRecord> = {
  create(args: CreateArgs): Promise<TRecord>;
  findUnique(args: FindUniqueArgs<TRecord>): Promise<TRecord | null>;
  update(args: UpdateArgs): Promise<TRecord>;
  findFirst(args: FindFirstArgs): Promise<TRecord | null>;
  upsert(args: Record<string, unknown>): Promise<TRecord>;
};

export type ApiPrismaClient = {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  user: PrismaDelegate<UserRecord>;
  interpreter: PrismaDelegate<InterpreterRecord>;
  callRequest: PrismaDelegate<CallRequestRecord>;
  sessionRecord: PrismaDelegate<SessionRecordModel>;
  assignmentAttempt: PrismaDelegate<AssignmentAttemptRecord>;
};
