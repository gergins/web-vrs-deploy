export type ReconnectOptions = {
  enabled?: boolean;
  maxAttempts?: number;
  delayMs?: number;
};

export type ReconnectState =
  | "idle"
  | "reconnecting"
  | "reconnected"
  | "failed";

export class WsReconnectController {
  private attempts = 0;
  private readonly enabled: boolean;
  private readonly maxAttempts: number;
  private readonly delayMs: number;

  constructor(options: ReconnectOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.maxAttempts = options.maxAttempts ?? 3;
    this.delayMs = options.delayMs ?? 1000;
  }

  reset() {
    this.attempts = 0;
  }

  getAttemptCount() {
    return this.attempts;
  }

  schedule(reconnect: () => void) {
    if (!this.enabled || this.attempts >= this.maxAttempts) {
      return { scheduled: false, attempts: this.attempts };
    }

    this.attempts += 1;
    window.setTimeout(reconnect, this.delayMs * this.attempts);
    return { scheduled: true, attempts: this.attempts };
  }
}
