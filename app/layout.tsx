import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import Script from "next/script";
import type { ReactNode } from "react";
import { AppTheme } from "./AppTheme";
import "@baraagency/components/styles.css";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
        {/* CSP for sandbox compatibility */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://eia.followupboss.com https://exquisitesa.retool.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; frame-src 'self' https://exquisitesa.retool.com; connect-src 'self' https: data: blob:;" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <AppTheme>{children}</AppTheme>
        </AppRouterCacheProvider>
        <Script
          src="https://eia.followupboss.com/embeddedApps-v1.0.1.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
