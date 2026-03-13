export function buildIceServers(env: {
  stunUrl: string;
  turnUrl: string;
  turnUsername: string;
  turnPassword: string;
}): RTCIceServer[] {
  return [
    { urls: env.stunUrl },
    {
      urls: env.turnUrl,
      username: env.turnUsername,
      credential: env.turnPassword
    }
  ];
}
