
// Import the WebSocket server library
import { WebSocketServer, WebSocket } from "ws";

// Port where the WebSocket server listens
const PORT = 3001;

// Address of the backend API
// "web" is the backend service name inside Docker Compose
const BACKEND_URL = "http://web:3000";

// Create the WebSocket server
// maxPayload limits the size of each message
const wss = new WebSocketServer({
  port: PORT,
  maxPayload: 10000
});

// Send data to one client, only if its connection is open
function send(socket, data) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

// Send data to every connected client
function broadcast(data) {
  for (const client of wss.clients) {
    send(client, data);
  }
}

// Get the task list from the backend API
async function getTasks() {
  const response = await fetch(`${BACKEND_URL}/api/tasks`);

  // Stop with an error if the backend did not reply with success
  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }

  return response.json();
}

// Get the latest tasks and send them to all clients
async function broadcastTasks() {
  const tasks = await getTasks();

  broadcast({
    type: "tasks",
    data: tasks
  });
}

// Run this code every time a new client connects
wss.on("connection", (socket) => {
  console.log("Client connected");

  // Send the initial task list to the new client
  getTasks()
    .then((tasks) => send(socket, { type: "tasks", data: tasks }))
    .catch(() => send(socket, {
      type: "error",
      message: "Could not load tasks"
    }));

  // Run this code every time the client sends a message
  socket.on("message", async (raw) => {
    try {
      // Turn the raw message into a JSON object
      const message = JSON.parse(raw.toString());

      // Handle a request to add a new task
      if (message.type === "add_task") {
        // Check that the title is a non-empty string of 200 characters or less
        if (
          typeof message.title !== "string" ||
          !message.title.trim() ||
          message.title.length > 200
        ) {
          throw new Error("Invalid task title");
        }

        // Ask the backend to save the new task
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

        // Send the updated task list to everyone
        await broadcastTasks();
        return;
      }

      // Handle a request to delete a task
      if (message.type === "delete_task") {
        // Make sure the ID is a valid positive number
        if (
          !Number.isSafeInteger(message.id) ||
          message.id <= 0
        ) {
          throw new Error("Invalid task ID");
        }

        // Ask the backend to delete the task
        const response = await fetch(
          `${BACKEND_URL}/api/tasks/${message.id}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          throw new Error("Could not delete task");
        }

        // Send the updated task list to everyone
        await broadcastTasks();
        return;
      }

      // Handle a request for the task list
      // Reply only to the client who asked
      if (message.type === "get_tasks") {
        send(socket, {
          type: "tasks",
          data: await getTasks()
        });
        return;
      }

      // Handle a plain text message from the client
      if (message.type === "send_data") {
        // Validate received data
        if (typeof message.data !== "string" ||
            message.data.length > 1000) {
          throw new Error("Invalid data");
        }

        console.log("Received:", message.data);

        // Reply only to the sender
        send(socket, {
          type: "received",
          data: message.data
        });

        // Broadcast to every connected browser
        broadcast({
          type: "broadcast",
          data: message.data,
          timestamp: new Date().toISOString()
        });

        return;
      }

      // The message type is not one we know
      throw new Error("Unknown message type");
    } catch (error) {
      // Send the error back to the client
      // Use a clear message if the JSON could not be read
      send(socket, {
        type: "error",
        message: error instanceof SyntaxError
          ? "Invalid JSON message"
          : error.message
      });
    }
  });

  // Run this code when the client disconnects
  socket.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log(`WebSocket server listening on port ${PORT}`);
