import TaskApp from "@/components/TaskApp";

// Server-side URL of the API (container-to-container, not from the browser)
const BACKEND_URL = process.env.BACKEND_URL ?? "http://web:3000";

// Server Component (the default in app/): runs on the server for every request.
// It can fetch data directly, so the first HTML already contains the tasks -
// no "loading..." flash, and search engines can read the content.
async function getTasks() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/tasks`, { cache: "no-store" });
    return res.ok ? await res.json() : [];
  } catch {
    return [];  // backend down: render an empty list, WebSocket will fill it in
  }
}

export default async function HomePage() {
  const tasks = await getTasks();

  // Hand the server-fetched data to the interactive client component
  return <TaskApp initialTasks={tasks} />;
}
