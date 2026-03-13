type PublicEnv = {
  apiBaseUrl: string;
  wsUrl: string;
  stunUrl: string;
  turnUrl: string;
  turnUsername: string;
  turnPassword: string;
};

function getFallbackWsUrl() {
  if (typeof window === "undefined") {
    return "ws://localhost:3001/ws";
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:3001/ws`;
}

export function getPublicEnv(): PublicEnv {
  return {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001",
    wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? getFallbackWsUrl(),
    stunUrl: process.env.NEXT_PUBLIC_STUN_URL ?? "stun:localhost:3478",
    turnUrl: process.env.NEXT_PUBLIC_TURN_URL ?? "turn:localhost:3478",
    turnUsername: process.env.NEXT_PUBLIC_TURN_USERNAME ?? "test",
    turnPassword: process.env.NEXT_PUBLIC_TURN_PASSWORD ?? "test"
  };
}
