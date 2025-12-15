"use client";

import { useEffect, useState } from "react";
import { useFocusWs } from "@/hooks/useFocusWs";

export default function TestWsPage() {
  const { connected, error, login, startSession, endSession, sendFrame } = useFocusWs();
  const [log, setLog] = useState<string[]>([]);

  const append = (msg: string) => setLog((l) => [msg, ...l].slice(0, 50));

  useEffect(() => {
    if (connected) append("WS connected");
  }, [connected]);

  useEffect(() => {
    if (error) append(`WS error: ${error}`);
  }, [error]);

  const doLogin = async () => {
    try {
      await login("demo", "demo123");
      append("login_ok");
    } catch (e: any) {
      append("login failed: " + (e?.message || "unknown"));
    }
  };

  const doStart = async () => {
    try {
      await startSession();
      append("session_started");
    } catch (e: any) {
      append("start_session failed: " + (e?.message || "unknown"));
    }
  };

  const doEnd = async () => {
    try {
      const res = await endSession();
      append("session_result: " + JSON.stringify(res));
    } catch (e: any) {
      append("end_session failed: " + (e?.message || "unknown"));
    }
  };

  const sendDummyFrame = async () => {
    // send minimal base64 payload (server may ignore but should not crash)
    const dummy = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/";
    try {
      await sendFrame(dummy);
      append("frame_sent");
    } catch (e: any) {
      append("frame failed: " + (e?.message || "unknown"));
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>WS E2E Test</h1>
      <p>Connected: {connected ? "yes" : "no"}</p>
      <p>Error: {error || "none"}</p>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={doLogin}>Login demo</button>
        <button onClick={doStart}>Start session</button>
        <button onClick={sendDummyFrame}>Send frame</button>
        <button onClick={doEnd}>End session</button>
      </div>
      <div style={{ marginTop: 24 }}>
        <h3>Logs</h3>
        <ul>
          {log.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </div>
      <p style={{ marginTop: 24, opacity: 0.7 }}>
        Endpoint: {process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:9000"}
      </p>
    </div>
  );
}
