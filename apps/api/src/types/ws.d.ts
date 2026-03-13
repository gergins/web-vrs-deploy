declare module "ws" {
  import type { Server } from "http";

  export class WebSocket {
    static readonly OPEN: number;
    readyState: number;
    send(data: string): void;
    close(code?: number, reason?: string): void;
    on(event: "message", listener: (data: unknown) => void): this;
    on(event: "close", listener: () => void): this;
  }

  export class WebSocketServer {
    constructor(options: { server: Server; path?: string });
    on(event: "connection", listener: (socket: WebSocket) => void): this;
  }
}
