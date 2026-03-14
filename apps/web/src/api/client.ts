import { getPublicEnv } from "../utils/env";

async function readErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown };
    return typeof body.error === "string" ? body.error : `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}

type CreateCallRequestInput = {
  requesterId: string;
};

type LocalAuthInput = {
  userId: string;
};

export type TurnIceServer = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

export type TurnCredentialsResponse = {
  ok: true;
  turn: {
    iceServers: TurnIceServer[];
    ttlSeconds: number;
    expiresAt: string;
  };
};

export type InterpreterActiveOffer = {
  assignmentAttemptId: string;
  callRequestId: string;
  interpreterId: string;
};

export type InterpreterActiveOfferResponse = {
  ok: true;
  activeOffer: InterpreterActiveOffer | null;
};

export type InterpreterActiveSession = {
  sessionId: string;
};

export type InterpreterActiveSessionResponse = {
  ok: true;
  activeSession: InterpreterActiveSession | null;
};

export async function authenticateLocalUser(input: LocalAuthInput) {
  const { apiBaseUrl } = getPublicEnv();
  const response = await fetch(`${apiBaseUrl}/auth/local`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

export async function createCallRequest(input: CreateCallRequestInput) {
  const { apiBaseUrl } = getPublicEnv();
  const response = await fetch(`${apiBaseUrl}/calls`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": input.requesterId
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

export async function getQueueStatus(callRequestId: string) {
  const { apiBaseUrl } = getPublicEnv();
  const response = await fetch(`${apiBaseUrl}/queue/${callRequestId}`);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

export async function getSession(sessionId: string) {
  const { apiBaseUrl } = getPublicEnv();
  const response = await fetch(`${apiBaseUrl}/sessions/${sessionId}`);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

export async function getTurnCredentials(): Promise<TurnCredentialsResponse> {
  const { apiBaseUrl } = getPublicEnv();
  const response = await fetch(`${apiBaseUrl}/turn/credentials`);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

export async function getInterpreterActiveOffer(
  userId: string
): Promise<InterpreterActiveOfferResponse> {
  const { apiBaseUrl } = getPublicEnv();
  const response = await fetch(`${apiBaseUrl}/interpreters/active-offer`, {
    headers: {
      "x-user-id": userId
    }
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

export async function getInterpreterActiveSession(
  userId: string
): Promise<InterpreterActiveSessionResponse> {
  const { apiBaseUrl } = getPublicEnv();
  const response = await fetch(`${apiBaseUrl}/interpreters/active-session`, {
    headers: {
      "x-user-id": userId
    }
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}


