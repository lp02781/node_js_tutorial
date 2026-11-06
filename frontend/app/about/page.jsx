// File-based routing: this file is the /about page. No router setup needed.
// No "use client" and no fetching -> rendered once at build time as static HTML.

export const metadata = {
  title: "About - Next.js Task Manager"
};

export default function AboutPage() {
  return (
    <>
      <h1>About</h1>
      <p>This tutorial app is split into services:</p>
      <ul className="plain">
        <li><strong>Next.js</strong>: pages, server rendering, proxies /api</li>
        <li><strong>Node.js API</strong>: REST endpoints + PostgreSQL</li>
        <li><strong>WebSocket server</strong>: real-time task updates</li>
        <li><strong>PostgreSQL</strong>: stores the tasks</li>
      </ul>
    </>
  );
}
