import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { CacheProvider } from "@emotion/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { AppTheme } from "./AppTheme";
import { createEmotionCache } from "./emotionCache";
import type { Route } from "./+types/root";
import { SkipToMain } from "./forms/_core/SkipToMain";
import "@baraagency/components/styles.css";
import "./globals.css";
import "./component-transitions.css";
import "./forms/_core/fieldStates.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Lato:wght@300;400;700;900&display=swap",
  },
];

function Document({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://eia.followupboss.com https://exquisitesa.retool.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; frame-src 'self' https://exquisitesa.retool.com; connect-src 'self' https: data: blob:;"
        />
        <Meta />
        <Links />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "var(--font-family)" }}>
        <SkipToMain />
        {children}
        <script src="https://eia.followupboss.com/embeddedApps-v1.0.1.js" />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return <Document>{children}</Document>;
}

function EmotionProviders({ children }: { children: ReactNode }) {
  const [cache] = useState(() => createEmotionCache());
  return (
    <CacheProvider value={cache}>
      <AppTheme>{children}</AppTheme>
    </CacheProvider>
  );
}

export default function App() {
  return (
    <EmotionProviders>
      <Outlet />
    </EmotionProviders>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "var(--font-family)" }}>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack ? (
        <pre style={{ overflow: "auto" }}>
          <code>{stack}</code>
        </pre>
      ) : null}
    </main>
  );
}
