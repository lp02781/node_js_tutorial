import { useEffect, useRef, useState, useCallback } from "react";

const protocol = location.protocol === "https:" ? "wss:" : "ws:";
const WS_URL = `${protocol}//${location.hostname}:3001`;

// Custom hook: owns the WebSocket connection and exposes its data as React state.
// Any component that calls it re-renders automatically when the state changes.
export function useTaskSocket() {
  const socketRef = useRef(null);  // survives re-renders without causing one
  const [status, setStatus] = useState("Connecting...");
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");

  // Runs once after the component mounts; the returned function runs on unmount.
  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus("Connected");
      setError("");
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "tasks") setTasks(message.data);
      if (message.type === "error") setError(message.message);
      if (message.type === "received") {
        addMessage("Acknowledged", message.data);
      }
      if (message.type === "broadcast") {
        addMessage("Broadcast", `${message.data} (${message.timestamp})`);
      }
    };

    socket.onclose = () => {
      setStatus("Disconnected");
      setError("Connection lost. Refresh to reconnect.");
    };

    socket.onerror = () => setError("WebSocket connection error");

    function addMessage(type, text) {
      // Never mutate state: build a new array (newest first)
      setMessages((prev) => [{ id: crypto.randomUUID(), type, text }, ...prev]);
    }

    return () => {
      // Detach handlers first so closing doesn't flash "Disconnected"
      // (StrictMode mounts twice in dev, which runs this cleanup once)
      socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null;
      socket.close();
    };
  }, []);

  const send = useCallback((message) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setError("WebSocket not connected");
      return false;
    }
    socket.send(JSON.stringify(message));
    return true;
  }, []);

  return {
    status,
    tasks,
    messages,
    error,
    addTask: (title) => send({ type: "add_task", title }),
    deleteTask: (id) => send({ type: "delete_task", id }),
    sendData: (data) => send({ type: "send_data", data })
  };
}
