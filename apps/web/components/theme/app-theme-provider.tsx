"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

type ColorMode = "dark" | "light";
const ColorModeContext = createContext({
  mode: "dark" as ColorMode,
  toggle: () => {},
});

export function useColorMode() {
  return useContext(ColorModeContext);
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ColorMode>("dark");

  useEffect(() => {
    const savedMode = window.localStorage.getItem("nexo-color-mode");
    if (savedMode === "dark" || savedMode === "light") {
      setMode(savedMode);
    }
  }, []);
  const value = useMemo(
    () => ({
      mode,
      toggle: () =>
        setMode((current) => {
          const next = current === "dark" ? "light" : "dark";
          window.localStorage.setItem("nexo-color-mode", next);
          return next;
        }),
    }),
    [mode],
  );
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: mode === "dark" ? "#76e6a2" : "#166534" },
          background:
            mode === "dark"
              ? { default: "#0c0f0e", paper: "#141817" }
              : { default: "#f5f6f3", paper: "#ffffff" },
          success: { main: "#42c77a" },
          error: { main: "#ef6b73" },
        },
        shape: { borderRadius: 14 },
        typography: {
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          h4: { fontWeight: 700, letterSpacing: "-0.04em" },
          h6: { fontWeight: 650, letterSpacing: "-0.02em" },
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
                border: `1px solid ${mode === "dark" ? "#242a28" : "#e4e7e2"}`,
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: "none",
                borderRadius: 10,
                fontWeight: 650,
              },
            },
          },
          MuiDialog: {
            defaultProps: {
              disableScrollLock: true,
            },
          },
          MuiPopover: {
            defaultProps: {
              disableScrollLock: true,
            },
          },
        },
      }),
    [mode],
  );
  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
