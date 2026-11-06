import { useTaskSocket } from "./hooks/useTaskSocket.js";
import TextForm from "./components/TextForm.jsx";
import TaskList from "./components/TaskList.jsx";
import MessageList from "./components/MessageList.jsx";

export default function App() {
  const { status, tasks, messages, error, addTask, deleteTask, sendData } =
    useTaskSocket();

  return (
    <main>
      <h1>My Task Manager</h1>
      <p>React + Node.js + WebSocket + PostgreSQL</p>

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
    </main>
  );
}
