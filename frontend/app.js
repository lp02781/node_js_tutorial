
const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const errorText = document.getElementById("error");
const connection = document.getElementById("connection");

// Connect to the WebSocket container
const protocol = location.protocol === "https:" ? "wss:" : "ws:";
const socket = new WebSocket(
  `${protocol}//${location.hostname}:3001`
);

// Connection established
socket.onopen = () => {
  console.log("WebSocket connected");
  connection.textContent = "Connected";
  errorText.textContent = "";
};

// Receive real-time messages
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === "tasks") {
    displayTasks(message.data);
  }

  if (message.type === "error") {
    errorText.textContent = message.message;
  }
  if (message.type === "received") {
    showMessage("Acknowledged", message.data);
  }

  if (message.type === "broadcast") {
    showMessage(
      "Broadcast",
      `${message.data} (${message.timestamp})`
    );
  }
};

// Display the task list
function displayTasks(tasks) {
  list.replaceChildren();

  for (const task of tasks) {
    const li = document.createElement("li");

    const title = document.createElement("span");
    title.textContent = task.title;

    const button = document.createElement("button");
    button.textContent = "Delete";
    button.onclick = () => deleteTask(task.id);

    li.append(title, button);
    list.appendChild(li);
  }
}

// Send a WebSocket message
function sendMessage(message) {
  if (socket.readyState !== WebSocket.OPEN) {
    errorText.textContent = "WebSocket not connected";
    return false;
  }

  socket.send(JSON.stringify(message));
  return true;
}

// Add task
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = input.value.trim();
  if (!title) return;

  if (sendMessage({ type: "add_task", title })) {
    input.value = "";
    errorText.textContent = "";
  }
});

// Delete task
function deleteTask(id) {
  sendMessage({
    type: "delete_task",
    id: id
  });
}

// Disconnected
socket.onclose = () => {
  connection.textContent = "Disconnected";
  errorText.textContent = "Connection lost. Refresh to reconnect.";
};

socket.onerror = () => {
  errorText.textContent = "WebSocket connection error";
};

// Messaging elements
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const messages = document.getElementById("messages");

// Send data to WebSocket server
messageForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = messageInput.value.trim();
  if (!data) return;

  const sent = sendMessage({
    type: "send_data",
    data: data
  });

  if (sent) {
    messageInput.value = "";
  }
});

// Display received data
function showMessage(type, data) {
  const li = document.createElement("li");
  li.textContent = `${type}: ${data}`;
  messages.prepend(li);
}