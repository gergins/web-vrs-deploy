import { createHmac } from "crypto";
import { env } from "../config/env";

export type IceServerResponse = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

export type TurnCredentialResponse = {
  iceServers: IceServerResponse[];
  ttlSeconds: number;
  expiresAt: string;
};

export class TurnCredentialService {
  getIceServers(): TurnCredentialResponse {
    const ttlSeconds = env.turnCredentialTtlSeconds;
    const expiresAtUnix = Math.floor(Date.now() / 1000) + ttlSeconds;
    const username = `${expiresAtUnix}:web-vrs`;
    const credential = createHmac("sha1", env.turnSharedSecret)
      .update(username)
      .digest("base64");
    const expiresAt = new Date(expiresAtUnix * 1000).toISOString();

    const turnUrls = [
      `turn:${env.turnHost}:${env.turnPort}?transport=udp`,
      `turn:${env.turnHost}:${env.turnPort}?transport=tcp`
    ];

    if (env.turnTlsPort > 0) {
      turnUrls.push(`turns:${env.turnHost}:${env.turnTlsPort}?transport=tcp`);
    }

    return {
      iceServers: [
        {
          urls: `stun:${env.turnHost}:${env.turnPort}`
        },
        {
          urls: turnUrls,
          username,
          credential
        }
      ],
      ttlSeconds,
      expiresAt
    };
  }
}
