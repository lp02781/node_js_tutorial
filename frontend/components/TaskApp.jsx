"use client";
// "use client" = this component runs in the browser too, so it can use
// state, effects, event handlers and WebSockets. (It was App.jsx in the Vite version.)

import { useTaskSocket } from "@/hooks/useTaskSocket";
import TextForm from "./TextForm";
import TaskList from "./TaskList";
import MessageList from "./MessageList";

export default function TaskApp({ initialTasks }) {
  const { status, tasks, messages, error, addTask, deleteTask, sendData } =
    useTaskSocket(initialTasks);

  return (
    <>
      <h1>My Task Manager</h1>
      <p>Next.js + Node.js + WebSocket + PostgreSQL</p>

      <div className="status">
        WebSocket: <span className="connection">{status}</span>
      </div>

      <TextForm
        placeholder="Enter a new task"
        buttonLabel="Add Task"
        maxLength={200}
        onSubmit={addTask}
      />

      <h2>Tasks ({tasks.length})</h2>
      <TaskList tasks={tasks} onDelete={deleteTask} />

      {error && <p className="error" role="alert">{error}</p>}

      <h2>WebSocket Messaging</h2>
      <TextForm
        placeholder="Enter message"
        buttonLabel="Send"
        maxLength={1000}
        onSubmit={sendData}
      />

      <h3>Received Messages</h3>
      <MessageList messages={messages} />
    </>
  );
}
