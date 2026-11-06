import Link from "next/link";
import "./globals.css";

// Default <title>/<meta> for every page; pages can override it
export const metadata = {
  title: "Next.js Task Manager",
  description: "Next.js + Node.js + WebSocket + PostgreSQL"
};

// Shared layout: wraps every page in app/. Replaces index.html.
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main>
          <nav>
            {/* <Link> navigates client-side, without a full page reload */}
            <Link href="/">Tasks</Link>
            <Link href="/about">About</Link>
            <a href="/docs">API Docs</a>
          </nav>
          {children}
        </main>
      </body>
    </html>
  );
}
