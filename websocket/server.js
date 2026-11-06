
import { WebSocketServer, WebSocket } from "ws";

const PORT = 3001;
const BACKEND_URL = "http://web:3000";

const wss = new WebSocketServer({
  port: PORT,
  maxPayload: 10000
});

function send(socket, data) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

function broadcast(data) {
  for (const client of wss.clients) {
    send(client, data);
  }
}

async function getTasks() {
  const response = await fetch(`${BACKEND_URL}/api/tasks`);

  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }

  return response.json();
}

async function broadcastTasks() {
  const tasks = await getTasks();

  broadcast({
    type: "tasks",
    data: tasks
  });
}

wss.on("connection", (socket) => {
  console.log("Client connected");

  // Send the initial task list to the new client
  getTasks()
    .then((tasks) => send(socket, { type: "tasks", data: tasks }))
    .catch(() => send(socket, {
      type: "error",
      message: "Could not load tasks"
    }));

  socket.on("message", async (raw) => {
    try {
      const message = JSON.parse(raw.toString());

      if (message.type === "add_task") {
        if (
          typeof message.title !== "string" ||
          !message.title.trim() ||
          message.title.length > 200
        ) {
          throw new Error("Invalid task title");
        }

        const response = await fetch(`${BACKEND_URL}/api/tasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: message.title
          })
        });

        if (!response.ok) {
          throw new Error("Could not add task");
        }

        await broadcastTasks();
        return;
      }

      if (message.type === "delete_task") {
        if (
          !Number.isSafeInteger(message.id) ||
          message.id <= 0
        ) {
          throw new Error("Invalid task ID");
        }

        const response = await fetch(
          `${BACKEND_URL}/api/tasks/${message.id}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          throw new Error("Could not delete task");
        }

        await broadcastTasks();
        return;
      }

      if (message.type === "get_tasks") {
        send(socket, {
          type: "tasks",
          data: await getTasks()
        });
        return;
      }

      throw new Error("Unknown message type");
    } catch (error) {
      send(socket, {
        type: "error",
        message: error instanceof SyntaxError
          ? "Invalid JSON message"
          : error.message
      });
    }
  });

  socket.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log(`WebSocket server listening on port ${PORT}`);
