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
          default: "#f8faf7",
          paper: "#ffffff",
        },
        primary: {
          main: "#003c18",
          contrastText: "#ffffff",
        },
        secondary: {
          main: "#67ad4b",
          contrastText: "#ffffff",
        },
        text: {
          primary: "#003c18",
          secondary: "#3d5c4a",
        },
        warning: {
          main: "#003c18",
        },
        success: {
          main: "#67ad4b",
        },
        error: {
          main: "#410000",
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
