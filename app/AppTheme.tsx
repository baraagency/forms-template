import { CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { designTokens } from "./generated/design-tokens";
import type { ResolvedAppTheme } from "./theme/appTheme";

const cardRadius = Number.parseInt(designTokens.cardRadius, 10);

function createAppTheme(palette: ResolvedAppTheme) {
  return createTheme({
    cssVariables: true,
    colorSchemes: {
      light: {
        palette: {
          background: {
            default: palette.background,
            paper: palette.cardBg,
          },
          primary: {
            main: palette.structure,
            contrastText: palette.structureText,
          },
          secondary: {
            main: palette.action,
            contrastText: palette.actionText,
          },
          info: {
            main: palette.accent,
          },
          text: {
            primary: palette.structure,
            secondary: palette.body,
            disabled: palette.placeholder,
          },
          warning: {
            main: palette.error,
          },
          success: {
            main: palette.accent,
          },
          error: {
            main: palette.error,
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
}

export function AppTheme({
  palette,
  children,
}: {
  palette: ResolvedAppTheme;
  children: ReactNode;
}) {
  const theme = useMemo(
    () => createAppTheme(palette),
    [
      palette.structure,
      palette.structureText,
      palette.action,
      palette.actionText,
      palette.accent,
      palette.accentSoft,
      palette.background,
      palette.body,
      palette.placeholder,
      palette.iconMuted,
      palette.successBg,
      palette.successColor,
      palette.warningBg,
      palette.warningColor,
      palette.cardBg,
      palette.error,
    ],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
