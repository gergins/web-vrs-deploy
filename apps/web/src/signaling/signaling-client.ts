import {
  WsReconnectController,
  type ReconnectOptions,
  type ReconnectState
} from "./ws-reconnect";

type MessageHandler = (message: unknown) => void;
type ReconnectHandler = (input: { state: ReconnectState; attempt: number }) => void;

export class SignalingClient {
  private ws: WebSocket | null = null;
  private url: string | null = null;
  private shouldReconnect = true;
  private hasConnectedOnce = false;
  private lastOpenWasReconnect = false;
  private readonly reconnectController: WsReconnectController;
  private messageHandlers = new Set<MessageHandler>();
  private typedHandlers = new Map<string, Set<MessageHandler>>();
  private openHandlers = new Set<() => void>();
  private closeHandlers = new Set<() => void>();
  private reconnectHandlers = new Set<ReconnectHandler>();

  constructor(reconnectOptions?: ReconnectOptions) {
    this.reconnectController = new WsReconnectController(reconnectOptions);
  }

  connect(url: string) {
    this.url = url;
    this.ws = new WebSocket(url);
    this.ws.onopen = () => {
      const wasReconnect = this.hasConnectedOnce;
      this.lastOpenWasReconnect = wasReconnect;
      this.reconnectController.reset();
      this.emitReconnectState(wasReconnect ? "reconnected" : "idle", 0);
      this.hasConnectedOnce = true;
      for (const handler of this.openHandlers) {
        handler();
      }
    };
    this.ws.onmessage = (event) => {
      console.log("[signaling] inbound raw", event.data);
      const parsed = JSON.parse(event.data) as unknown;
      for (const handler of this.messageHandlers) {
        handler(parsed);
      }

      const eventType =
        parsed && typeof parsed === "object" && "type" in parsed ? parsed.type : null;
      console.log("[signaling] inbound type", eventType);
      if (typeof eventType === "string") {
        const handlers = this.typedHandlers.get(eventType) ?? new Set<MessageHandler>();
        for (const handler of handlers) {
          handler(parsed);
        }
      }
    };
    this.ws.onclose = () => {
      for (const handler of this.closeHandlers) {
        handler();
      }

      if (this.shouldReconnect && this.url) {
        const result = this.reconnectController.schedule(() => {
          if (this.url) {
            this.connect(this.url);
          }
        });
        if (result.scheduled) {
          this.emitReconnectState("reconnecting", result.attempts);
        } else {
          this.emitReconnectState("failed", result.attempts);
        }
      }
    };
  }

  send(message: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  onMessage(handler: (message: unknown) => void) {
    this.messageHandlers.add(handler);
  }

  on(eventType: string, handler: MessageHandler) {
    const handlers = this.typedHandlers.get(eventType) ?? new Set<MessageHandler>();
    handlers.add(handler);
    this.typedHandlers.set(eventType, handlers);
  }

  onOpen(handler: () => void) {
    this.openHandlers.add(handler);
  }

  onClose(handler: () => void) {
    this.closeHandlers.add(handler);
  }

  onReconnectStateChange(handler: ReconnectHandler) {
    this.reconnectHandlers.add(handler);
  }

  get readyState() {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  get wasReconnected() {
    return this.lastOpenWasReconnect;
  }

  close() {
    this.shouldReconnect = false;
    this.ws?.close();
  }

  private emitReconnectState(state: ReconnectState, attempt: number) {
    for (const handler of this.reconnectHandlers) {
      handler({ state, attempt });
    }
  }
}
