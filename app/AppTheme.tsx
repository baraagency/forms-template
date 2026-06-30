"use client";

import { CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";

const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        background: {
          default: "#f7f9fa",
          paper: "#ffffff",
        },
        primary: {
          main: "#3f4548",
          contrastText: "#ffffff",
        },
        secondary: {
          main: "#14b8cf",
          contrastText: "#ffffff",
        },
        text: {
          primary: "#3f4548",
          secondary: "#535d62",
        },
        warning: {
          main: "#9a5b00",
        },
        success: {
          main: "#1f6f43",
        },
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "var(--font-family), Arial, sans-serif",
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 42,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export function AppTheme({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
