"use client";

// Minimal WebSocket client with request/response by event name
// Server events: login_ok, register_ok, session_started, session_result, leaderboard, profile, focus_warn, error

export type WsEventHandler = (data: any) => void;

class WsClient {
  private url: string;
  private ws: WebSocket | null = null;
  private readyPromise: Promise<void> | null = null;
  private listeners: Map<string, Set<WsEventHandler>> = new Map();

  constructor(url: string) {
    this.url = url;
  }

  async connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log("[WS] Already connected");
      return;
    }
    if (this.readyPromise) {
      console.log("[WS] Connection already in progress");
      return this.readyPromise;
    }

    console.log("[WS] Connecting to", this.url);
    this.readyPromise = new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(this.url);
      this.ws = ws;

      ws.onopen = () => {
        console.log("[WS] Connected successfully");
        resolve();
      };

      ws.onmessage = (evt) => {
        console.log("[WS] Message received:", evt.data.substring(0, 100));
        this.handleMessage(evt.data);
      };

      ws.onerror = (err) => {
        console.error("[WS] Error event:", err);
        // Browsers often provide no details; hint likely causes
        console.error("[WS] Hint: ensure server on ws://127.0.0.1:9000 and not blocked by firewall/IPv6.");
        reject(err instanceof Error ? err : new Error("WebSocket error"));
      };

      ws.onclose = (evt) => {
        const code = (evt as CloseEvent).code;
        const reason = (evt as CloseEvent).reason || "";
        console.log("[WS] Connection closed", { code, reason });
        // If closed before open, reject the connect promise
        if (ws.readyState !== WebSocket.OPEN) {
          reject(new Error(`WebSocket closed during connect (code=${code} reason=${reason})`));
        }
        this.ws = null;
        this.readyPromise = null;
      };
    });

    return this.readyPromise;
  }

  private ensureOpen() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }
  }

  private handleMessage(raw: any) {
    try {
      const msg = JSON.parse(raw);
      if (!msg || !msg.event) return;
      const set = this.listeners.get(msg.event);
      if (set) {
        [...set].forEach((fn) => fn(msg.data));
      }
    } catch (e) {
      console.error("WS parse error", e);
    }
  }

  on(event: string, handler: WsEventHandler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: WsEventHandler) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(handler);
    }
  }

  private waitFor(event: string, timeoutMs = 5000, errorWhere?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let done = false;
      const offEvent = this.on(event, (data) => {
        if (done) return;
        done = true;
        cleanup();
        resolve(data);
      });
      const offError = this.on("error", (err: any) => {
        if (done) return;
        if (!errorWhere || err?.where === errorWhere) {
          done = true;
          cleanup();
          reject(new Error(err?.message || "Server error"));
        }
      });
      const timer = setTimeout(() => {
        if (done) return;
        done = true;
        cleanup();
        reject(new Error(`Timeout waiting for ${event}`));
      }, timeoutMs);
      const cleanup = () => {
        clearTimeout(timer);
        offEvent();
        offError();
      };
    });
  }

  private async send(payload: any) {
    await this.connect();
    this.ensureOpen();
    this.ws!.send(JSON.stringify(payload));
  }

  // High-level APIs
  async login(username: string, password: string) {
    await this.send({ type: "login", username, password });
    await this.waitFor("login_ok", 5000, "login");
  }

  async register(username: string, password: string) {
    // Send as username (backend interprets it as email)
    await this.send({ type: "register", username, password });
    await this.waitFor("register_ok", 5000, "register");
  }

  async startSession() {
    await this.send({ type: "start_session" });
    await this.waitFor("session_started");
  }

  async endSession() {
    await this.send({ type: "end_session" });
    return this.waitFor("session_result");
  }

  async getProfile() {
    await this.send({ type: "get_profile" });
    return this.waitFor("profile");
  }

  async getLeaderboard() {
    await this.send({ type: "get_leaderboard" });
    return this.waitFor("leaderboard");
  }

  async sendFrame(base64Data: string) {
    await this.send({ type: "stream_frame", data: base64Data });
  }
}

// Prefer IPv4 loopback explicitly to avoid IPv6 (::1) issues on Windows
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:9000";
export const focusWs = new WsClient(WS_URL);
