import { useEffect, useState, useRef } from "react";

export function useWebSocket(onMessageCallback) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/live";
    let socket;

    function connect() {
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setIsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastMessage(data);
            if (onMessageCallback) {
              onMessageCallback(data);
            }
          } catch (e) {
            console.error("Failed to parse WebSocket message:", event.data);
          }
        };

        socket.onclose = () => {
          setIsConnected(false);
          // Try reconnecting after 3 seconds
          setTimeout(connect, 3000);
        };

        socket.onerror = () => {
          setIsConnected(false);
        };
      } catch (err) {
        setIsConnected(false);
      }
    }

    connect();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  return { isConnected, lastMessage };
}
