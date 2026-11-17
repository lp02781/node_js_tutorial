
// Get the HTML elements we need from the page
const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const errorText = document.getElementById("error");
const connection = document.getElementById("connection");

// Connect to the WebSocket container
// Use "wss" for secure pages (https) and "ws" for normal pages (http)
const protocol = location.protocol === "https:" ? "wss:" : "ws:";
const socket = new WebSocket(
  `${protocol}//${location.hostname}:3001`
);

// Connection established
// Show "Connected" and clear any old error
socket.onopen = () => {
  console.log("WebSocket connected");
  connection.textContent = "Connected";
  errorText.textContent = "";
};

// Receive real-time messages
// Check the message type and decide what to do
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);

  // A new task list arrived, so show it
  if (message.type === "tasks") {
    displayTasks(message.data);
  }

  // The server sent an error, so show it
  if (message.type === "error") {
    errorText.textContent = message.message;
  }

  // The server confirmed it got our message
  if (message.type === "received") {
    showMessage("Acknowledged", message.data);
  }

  // A message was sent to all browsers
  if (message.type === "broadcast") {
    showMessage(
      "Broadcast",
      `${message.data} (${message.timestamp})`
    );
  }
};

// Display the task list
// Clear the old list, then add one item for each task
function displayTasks(tasks) {
  list.replaceChildren();

  for (const task of tasks) {
    const li = document.createElement("li");

    // Show the task title
    // textContent is safe because it does not run HTML
    const title = document.createElement("span");
    title.textContent = task.title;

    // Add a delete button for this task
    const button = document.createElement("button");
    button.textContent = "Delete";
    button.onclick = () => deleteTask(task.id);

    li.append(title, button);
    list.appendChild(li);
  }
}

// Send a WebSocket message
// Return true if sent, or false if the connection is not open
function sendMessage(message) {
  if (socket.readyState !== WebSocket.OPEN) {
    errorText.textContent = "WebSocket not connected";
    return false;
  }

  socket.send(JSON.stringify(message));
  return true;
}

// Add task
// Run this when the task form is submitted
form.addEventListener("submit", (event) => {
  // Stop the page from reloading
  event.preventDefault();

  // Ignore empty titles
  const title = input.value.trim();
  if (!title) return;

  // Send the new task and clear the input if it was sent
  if (sendMessage({ type: "add_task", title })) {
    input.value = "";
    errorText.textContent = "";
  }
});

// Delete task
// Ask the server to delete the task with this ID
function deleteTask(id) {
  sendMessage({
    type: "delete_task",
    id: id
  });
}

// Disconnected
// Tell the user the connection was lost
socket.onclose = () => {
  connection.textContent = "Disconnected";
  errorText.textContent = "Connection lost. Refresh to reconnect.";
};

// Show an error if the connection fails
socket.onerror = () => {
  errorText.textContent = "WebSocket connection error";
};

// Messaging elements
// Get the HTML elements for the messaging section
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const messages = document.getElementById("messages");

// Send data to WebSocket server
// Run this when the message form is submitted
messageForm.addEventListener("submit", (event) => {
  // Stop the page from reloading
  event.preventDefault();

  // Ignore empty messages
  const data = messageInput.value.trim();
  if (!data) return;

  const sent = sendMessage({
    type: "send_data",
    data: data
  });

  // Clear the input only if the message was sent
  if (sent) {
    messageInput.value = "";
  }
});

// Display received data
// Add the newest message to the top of the list
function showMessage(type, data) {
  const li = document.createElement("li");
  li.textContent = `${type}: ${data}`;
  messages.prepend(li);
}
