"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AutoGraphOutlined,
  DarkModeOutlined,
  LightModeOutlined,
  LockOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { appRoutes } from "../../lib/routes";
import { supabase } from "../../lib/supabase";
import { useColorMode } from "../theme/app-theme-provider";

type Mode = "login" | "signup" | "recovery";

export function LoginClient() {
  const router = useRouter();
  const colorMode = useColorMode();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(appRoutes.dashboard);
    });
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      if (mode === "recovery") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) throw error;
        setMessage({
          tone: "success",
          text: "Enviamos um link de recuperação para o seu e-mail.",
        });
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: name.trim() },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push(appRoutes.dashboard);
        } else {
          setMessage({
            tone: "success",
            text: "Conta criada. Confirme seu e-mail para continuar.",
          });
        }
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push(appRoutes.dashboard);
    } catch (error) {
      setMessage({ tone: "error", text: friendlyAuthError(error) });
    } finally {
      setSubmitting(false);
    }
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setMessage(null);
    setPassword("");
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1.08fr .92fr" },
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          display: { xs: "none", lg: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          p: 7,
          position: "relative",
          overflow: "hidden",
          bgcolor: "#0a0d0c",
          color: "white",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 28% 42%, rgba(89,211,139,.18), transparent 34%), radial-gradient(circle at 88% 88%, rgba(89,211,139,.08), transparent 27%)",
          }}
        />
        <Box sx={{ position: "relative" }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Nexo
          </Typography>
          <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,.52)" }}>
            Seu dinheiro, com clareza.
          </Typography>
        </Box>
        <Box sx={{ position: "relative", maxWidth: 620 }}>
          <Box
            sx={{
              width: 54,
              height: 54,
              display: "grid",
              placeItems: "center",
              borderRadius: 3,
              bgcolor: "rgba(118,230,162,.13)",
              color: "#76e6a2",
              mb: 4,
            }}
          >
            <AutoGraphOutlined />
          </Box>
          <Typography
            component="h1"
            sx={{
              fontSize: { lg: 52, xl: 64 },
              lineHeight: 1.03,
              fontWeight: 730,
              letterSpacing: "-0.055em",
            }}
          >
            Todas as suas finanças em um só lugar.
          </Typography>
          <Typography
            sx={{
              mt: 3,
              maxWidth: 500,
              fontSize: 17,
              lineHeight: 1.7,
              color: "rgba(255,255,255,.56)",
            }}
          >
            Conecte suas contas, acompanhe seus gastos e receba análises que
            ajudam você a tomar decisões melhores.
          </Typography>
        </Box>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            position: "relative",
            color: "rgba(255,255,255,.45)",
            alignItems: "center",
          }}
        >
          <LockOutlined fontSize="small" />
          <Typography sx={{ fontSize: 12 }}>
            Acesso protegido e dados isolados por conta.
          </Typography>
        </Stack>
      </Box>

      <Box
        sx={{
          display: "grid",
          placeItems: "center",
          p: { xs: 2, sm: 5 },
          position: "relative",
        }}
      >
        <IconButton
          onClick={colorMode.toggle}
          aria-label="Alternar tema"
          sx={{ position: "absolute", top: 20, right: 20 }}
        >
          {colorMode.mode === "dark" ? (
            <LightModeOutlined />
          ) : (
            <DarkModeOutlined />
          )}
        </IconButton>
        <Paper sx={{ width: "100%", maxWidth: 460, p: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: { xs: "block", lg: "none" }, mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Nexo
            </Typography>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              Seu dinheiro, com clareza.
            </Typography>
          </Box>
          {mode !== "recovery" ? (
            <Tabs
              value={mode}
              onChange={(_, value: "login" | "signup") => changeMode(value)}
              variant="fullWidth"
              sx={{ mb: 3 }}
            >
              <Tab value="login" label="Entrar" />
              <Tab value="signup" label="Criar conta" />
            </Tabs>
          ) : null}

          <Typography variant="h4" sx={{ fontSize: 30 }}>
            {mode === "login"
              ? "Bem-vindo de volta"
              : mode === "signup"
                ? "Crie sua conta"
                : "Recupere seu acesso"}
          </Typography>
          <Typography
            sx={{ color: "text.secondary", fontSize: 14, mt: 1, mb: 3 }}
          >
            {mode === "login"
              ? "Entre para acessar sua visão financeira."
              : mode === "signup"
                ? "Comece a organizar sua vida financeira."
                : "Informe seu e-mail para receber o link de recuperação."}
          </Typography>

          <Box component="form" onSubmit={submit}>
            <Stack spacing={2}>
              {mode === "signup" ? (
                <TextField
                  label="Nome"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  autoComplete="name"
                />
              ) : null}
              <TextField
                label="E-mail"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                autoComplete="email"
              />
              {mode !== "recovery" ? (
                <TextField
                  label="Senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  helperText={
                    mode === "signup"
                      ? "Use pelo menos 8 caracteres."
                      : undefined
                  }
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((value) => !value)}
                            edge="end"
                            aria-label={
                              showPassword ? "Ocultar senha" : "Mostrar senha"
                            }
                          >
                            {showPassword ? (
                              <VisibilityOffOutlined />
                            ) : (
                              <VisibilityOutlined />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              ) : null}
              {message ? (
                <Alert severity={message.tone}>{message.text}</Alert>
              ) : null}
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={
                  submitting || (mode === "signup" && password.length < 8)
                }
              >
                {submitting
                  ? "Aguarde…"
                  : mode === "login"
                    ? "Entrar"
                    : mode === "signup"
                      ? "Criar minha conta"
                      : "Enviar link"}
              </Button>
              {mode === "login" ? (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => changeMode("recovery")}
                >
                  Esqueci minha senha
                </Button>
              ) : null}
              {mode === "recovery" ? (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => changeMode("login")}
                >
                  Voltar para o login
                </Button>
              ) : null}
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

function friendlyAuthError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "Não foi possível concluir o acesso.";
  if (/invalid login credentials/i.test(message))
    return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(message))
    return "Confirme seu e-mail antes de entrar.";
  if (/user already registered/i.test(message))
    return "Já existe uma conta com este e-mail.";
  if (/password should be/i.test(message))
    return "A senha precisa ter pelo menos 8 caracteres.";
  if (/failed to fetch|networkerror|load failed/i.test(message))
    return "Não foi possível conectar ao serviço de autenticação. Verifique sua conexão e tente novamente.";
  return message;
}
