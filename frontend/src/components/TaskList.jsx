// Compare with displayTasks() in frontend/app.js:
// no createElement / replaceChildren — just describe the list for the current data.
export default function TaskList({ tasks, onDelete }) {
  if (tasks.length === 0) {
    return <p className="empty">No tasks yet.</p>;
  }

  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>
          <span>{task.title}</span>
          <button onClick={() => onDelete(task.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
