import { useEffect, useState, useRef } from "react";

export const useWebSocket = () => {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const wsUrl = (import.meta.env.VITE_API_URL || "http://localhost:8000")
      .replace("http://", "ws://")
      .replace("https://", "wss://") + "/ws/live";

    let ws = null;
    let pingInterval = null;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send("ping");
            }
          }, 20000);
        };

        ws.onmessage = (event) => {
          if (event.data === "pong") return;
          try {
            const data = JSON.parse(event.data);
            setMessages((prev) => [data, ...prev.slice(0, 19)]);
          } catch (err) {
            console.error("WebSocket message parse error:", err);
          }
        };

        ws.onclose = () => {
          setConnected(false);
          if (pingInterval) clearInterval(pingInterval);
          setTimeout(connect, 5000);
        };

        ws.onerror = (err) => {
          console.error("WebSocket error:", err);
          ws.close();
        };
      } catch (e) {
        console.error("WebSocket connection failure:", e);
      }
    };

    connect();

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      if (ws) ws.close();
    };
  }, []);

  return { connected, messages };
};
