"use client";

import { useEffect, useState } from "react";
import { focusWs } from "@/lib/ws-client";

export function useFocusWs() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    focusWs
      .connect()
      .then(() => {
        if (!cancelled) setConnected(true);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setError(e?.message || "Không thể kết nối WS");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    connected,
    error,
    login: focusWs.login.bind(focusWs),
    register: focusWs.register.bind(focusWs),
    startSession: focusWs.startSession.bind(focusWs),
    endSession: focusWs.endSession.bind(focusWs),
    getProfile: focusWs.getProfile.bind(focusWs),
    getLeaderboard: focusWs.getLeaderboard.bind(focusWs),
    sendFrame: focusWs.sendFrame.bind(focusWs),
    client: focusWs,
  };
}
