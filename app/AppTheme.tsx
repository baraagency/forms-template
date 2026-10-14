import { CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";
import { designTokens } from "./generated/design-tokens";

const cardRadius = Number.parseInt(designTokens.cardRadius, 10);

const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        background: {
          default: designTokens.background,
          paper: designTokens.cardBg,
        },
        primary: {
          main: designTokens.palette2,
          contrastText: designTokens.btnPrimaryColor,
        },
        secondary: {
          main: designTokens.palette1,
          contrastText: designTokens.btnPrimaryColor,
        },
        info: {
          main: designTokens.brandSky,
        },
        text: {
          primary: designTokens.palette2,
          secondary: designTokens.bodyColor,
          disabled: designTokens.placeholderColor,
        },
        warning: {
          main: designTokens.palette3,
        },
        success: {
          main: designTokens.brandSky,
        },
        error: {
          main: designTokens.palette3,
        },
      },
    },
  },
  shape: {
    borderRadius: cardRadius,
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
          borderRadius: cardRadius,
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
