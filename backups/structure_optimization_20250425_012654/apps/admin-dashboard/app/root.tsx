import { LinksFunction } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  LiveReload
} from "@remix-run/react";
import styles from "./tailwind.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles }
];

export default function App() {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-64 bg-gray-800 text-white p-4">
            <div className="text-xl font-bold mb-8">MCP Admin</div>
            <nav>
              <ul className="space-y-2">
                <li>
                  <a href="/" className="block p-2 rounded hover:bg-gray-700">Dashboard</a>
                </li>
                <li>
                  <a href="/migrations" className="block p-2 rounded hover:bg-gray-700">Migrations</a>
                </li>
                <li>
                  <a href="/metrics" className="block p-2 rounded hover:bg-gray-700">Métriques</a>
                </li>
                <li>
                  <a href="/agents" className="block p-2 rounded hover:bg-gray-700">Agents</a>
                </li>
                <li>
                  <a href="/settings" className="block p-2 rounded hover:bg-gray-700">Paramètres</a>
                </li>
              </ul>
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-auto">
            <header className="bg-white shadow">
              <div className="max-w-7xl px-4 py-4">
                <h1 className="text-xl font-bold text-gray-900">Pipeline MCP Admin</h1>
              </div>
            </header>
            <main className="max-w-7xl px-4 py-6">
              <Outlet />
            </main>
          </div>
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}