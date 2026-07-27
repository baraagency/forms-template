import { CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";

/** Colors aligned with forms-template palette (black accent + navy + sky) */
const BARA_NAVY = "#003a55";
const BARA_ACCENT = "#1E1E1E";
const BARA_SKY = "#0099cc";
const BARA_CHARCOAL = "#404040";
const BARA_BG = "#f0f7fa";

const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        background: {
          default: BARA_BG,
          paper: "#ffffff",
        },
        primary: {
          main: BARA_NAVY,
          contrastText: "#ffffff",
        },
        secondary: {
          main: BARA_ACCENT,
          contrastText: "#ffffff",
        },
        info: {
          main: BARA_SKY,
        },
        text: {
          primary: BARA_NAVY,
          secondary: "#4a6b7c",
          disabled: "#5a7585",
        },
        warning: {
          main: BARA_CHARCOAL,
        },
        success: {
          main: BARA_SKY,
        },
        error: {
          main: BARA_CHARCOAL,
        },
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "var(--font-family), Arial, sans-serif",
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 700,
    fontWeightBold: 900,
    h1: {
      fontFamily: "var(--font-display), serif",
      fontWeight: 500,
      letterSpacing: "-0.025em",
    },
    h2: {
      fontFamily: "var(--font-display), serif",
      fontWeight: 400,
      letterSpacing: "-0.025em",
    },
    h3: {
      fontFamily: "var(--font-display), serif",
      fontWeight: 400,
      letterSpacing: "-0.02em",
    },
    h4: {
      fontFamily: "var(--font-display), serif",
      fontWeight: 400,
      letterSpacing: "-0.02em",
    },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 700 },
    subtitle2: { fontWeight: 700 },
    body1: { fontWeight: 400, lineHeight: 1.625 },
    body2: { fontWeight: 400, lineHeight: 1.625 },
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
          minHeight: 44,
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
