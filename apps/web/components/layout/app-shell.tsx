"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AccountBalanceWalletOutlined,
  AutoAwesomeOutlined,
  CategoryOutlined,
  DashboardOutlined,
  DarkModeOutlined,
  LightModeOutlined,
  LogoutOutlined,
  ReceiptLongOutlined,
  SettingsOutlined,
} from "@mui/icons-material";
import {
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import { useColorMode } from "../theme/app-theme-provider";
import { appRoutes } from "../../lib/routes";

const navigation = [
  {
    label: "Visão geral",
    href: appRoutes.dashboard,
    icon: DashboardOutlined,
  },
  {
    label: "Transações",
    href: appRoutes.transactions,
    icon: ReceiptLongOutlined,
  },
  {
    label: "Contas",
    href: appRoutes.accounts,
    icon: AccountBalanceWalletOutlined,
  },
  {
    label: "Categorias",
    href: appRoutes.categories,
    icon: CategoryOutlined,
  },
  {
    label: "Insights",
    href: appRoutes.insights,
    icon: AutoAwesomeOutlined,
  },
];

type AppShellProps = {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
};

export function AppShell({
  children,
  userName = "Sua conta",
  userEmail = "",
  onLogout,
}: AppShellProps) {
  const pathname = usePathname();
  const colorMode = useColorMode();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "232px minmax(0,1fr)" },
      }}
    >
      <Box
        component="aside"
        sx={{
          display: { xs: "none", md: "flex" },
          position: "sticky",
          top: 0,
          height: "100vh",
          flexDirection: "column",
          borderRight: 1,
          borderColor: "divider",
          px: 2,
          py: 3,
        }}
      >
        <Box sx={{ px: 1.5, mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Nexo
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Seu dinheiro, com clareza.
          </Typography>
        </Box>

        <List sx={{ display: "grid", gap: 0.5 }}>
          {navigation.map(({ label, href, icon: Icon }) => {
            const selected = pathname === href;
            return (
              <ListItemButton
                key={label}
                component={Link}
                href={href}
                selected={selected}
                aria-current={selected ? "page" : undefined}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 38 }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  slotProps={{
                    primary: { sx: { fontSize: 14, fontWeight: 600 } },
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        <Box sx={{ mt: "auto" }}>
          <ListItemButton
            component={Link}
            href={appRoutes.settings}
            selected={pathname === appRoutes.settings}
            aria-current={pathname === appRoutes.settings ? "page" : undefined}
            sx={{ borderRadius: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 38 }}>
              <SettingsOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Configurações" />
          </ListItemButton>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2, p: 1 }}
          >
            <Avatar sx={{ width: 34, height: 34, fontSize: 13 }}>
              {initials(userName)}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography noWrap sx={{ fontSize: 13, fontWeight: 650 }}>
                {userName}
              </Typography>
              <Typography noWrap sx={{ fontSize: 11, color: "text.secondary" }}>
                {userEmail}
              </Typography>
            </Box>
            <Tooltip
              title={
                colorMode.mode === "dark"
                  ? "Usar modo claro"
                  : "Usar modo escuro"
              }
            >
              <IconButton
                size="small"
                onClick={colorMode.toggle}
                aria-label="Alternar tema"
              >
                {colorMode.mode === "dark" ? (
                  <LightModeOutlined fontSize="small" />
                ) : (
                  <DarkModeOutlined fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            {onLogout ? (
              <Tooltip title="Sair">
                <IconButton size="small" onClick={onLogout} aria-label="Sair">
                  <LogoutOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Box>
        </Box>
      </Box>

      <Box
        component="main"
        sx={{ minWidth: 0, p: { xs: 2, sm: 3, lg: 4 }, pb: { xs: 11, md: 4 } }}
      >
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Nexo
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Seu dinheiro, com clareza.
            </Typography>
          </Box>
          <Box>
            <IconButton
              component={Link}
              href={appRoutes.settings}
              aria-label="Configurações"
            >
              <SettingsOutlined />
            </IconButton>
            <IconButton onClick={colorMode.toggle} aria-label="Alternar tema">
              {colorMode.mode === "dark" ? (
                <LightModeOutlined />
              ) : (
                <DarkModeOutlined />
              )}
            </IconButton>
            {onLogout ? (
              <IconButton onClick={onLogout} aria-label="Sair">
                <LogoutOutlined />
              </IconButton>
            ) : null}
          </Box>
        </Box>
        {children}
      </Box>

      <BottomNavigation
        value={pathname}
        showLabels
        sx={{
          display: { xs: "flex", md: "none" },
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 20,
          borderTop: 1,
          borderColor: "divider",
          height: 68,
        }}
      >
        <BottomNavigationAction
          component={Link}
          href={appRoutes.dashboard}
          value={appRoutes.dashboard}
          label="Início"
          icon={<DashboardOutlined />}
        />
        <BottomNavigationAction
          component={Link}
          href={appRoutes.transactions}
          value={appRoutes.transactions}
          label="Transações"
          icon={<ReceiptLongOutlined />}
        />
        <BottomNavigationAction
          component={Link}
          href={appRoutes.accounts}
          value={appRoutes.accounts}
          label="Contas"
          icon={<AccountBalanceWalletOutlined />}
        />
        <BottomNavigationAction
          component={Link}
          href={appRoutes.categories}
          value={appRoutes.categories}
          label="Categorias"
          icon={<CategoryOutlined />}
        />
        <BottomNavigationAction
          component={Link}
          href={appRoutes.insights}
          value={appRoutes.insights}
          label="Insights"
          icon={<AutoAwesomeOutlined />}
        />
      </BottomNavigation>
    </Box>
  );
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "NX"
  );
}
