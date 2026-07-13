// src/components/DashboardLayout.jsx
import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Button,
  Stack,
  Toolbar,
  Typography,
  Divider,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import ScienceIcon from "@mui/icons-material/Science";
import DescriptionIcon from "@mui/icons-material/Description";
import GroupIcon from "@mui/icons-material/Group";
import EmailIcon from "@mui/icons-material/Email";
import SettingsIcon from "@mui/icons-material/Settings";
import ListAltIcon from "@mui/icons-material/ListAlt";
import LogoutIcon from "@mui/icons-material/Logout";

const expandedWidth = 240;
const collapsedWidth = 70;

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedRecentUsers = localStorage.getItem("recent_users");

    try {
      setCurrentUser(storedUser ? JSON.parse(storedUser) : null);
    } catch {
      setCurrentUser(null);
    }

    try {
      setRecentUsers(storedRecentUsers ? JSON.parse(storedRecentUsers) : []);
    } catch {
      setRecentUsers([]);
    }
  }, []);

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard/lab" },
    { text: "Onedrive", icon: <LocalHospitalIcon />, path: "/dashboard/doctor" },
    { text: "New Request", icon: <DescriptionIcon />, path: "/dashboard/new-request" },
    { text: "Request Log", icon: <ListAltIcon />, path: "/dashboard/request-log" },
    { text: "FSH Results Log", icon: <ScienceIcon />, path: "/dashboard/lab-results" },
    { text: "FSH Sample Management", icon: <GroupIcon />, path: "/dashboard/patients" },
    { text: "BZA Emails", icon: <EmailIcon />, path: "/dashboard/emails" },
    { text: "Medical Aid Claims", icon: <LocalAtmIcon />, path: "/dashboard/claims" },
    { text: "Settings", icon: <SettingsIcon />, path: "/dashboard/settings" },
  ];

  const logoUrl =
    "https://d24naddg1rhy2p.cloudfront.net/67005/127/0/biotechinst_logo_new_2020-03-05_v4.png";

  const logoPositions = [
    { top: "5%", left: "20%", rotate: "-10deg", size: "200px" },
    { top: "25%", left: "45%", rotate: "10deg", size: "240px" },
    { top: "60%", left: "30%", rotate: "-5deg", size: "260px" },
  ];

  const getInitials = (user) => {
    const source = String(user?.username || user?.role || "U");
    return source
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <Box sx={{ display: "flex", backgroundColor: "white" }}>
      {/* COLLAPSIBLE SIDEBAR */}
      <Drawer
        variant="permanent"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        sx={{
          width: open ? expandedWidth : collapsedWidth,
          flexShrink: 0,
          whiteSpace: "nowrap",
          transition: "0.3s ease",
          [`& .MuiDrawer-paper`]: {
            width: open ? expandedWidth : collapsedWidth,
            transition: "0.3s ease",
            overflowX: "hidden",
            overflowY: "auto",
            background: "linear-gradient(180deg, #dff9ea 0%, #b7ebcb 54%, #a6e2bb 100%)",
            boxSizing: "border-box",
            borderRight: "none",
            boxShadow: "none",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Toolbar
          sx={{
            justifyContent: open ? "flex-start" : "center",
            minHeight: "unset !important",
            alignItems: "flex-start",
            px: open ? 1.5 : 0,
            py: 1.5,
          }}
        >
          {open ? (
            <Stack spacing={1} sx={{ width: "100%" }}>
              <Typography variant="h6" noWrap sx={{ color: "#11351a", fontWeight: 800, letterSpacing: 0.4 }}>
                Biozone Analytics (BZA)
              </Typography>
              {currentUser && (
                <Box
                  sx={{
                    borderRadius: 2,
                    backgroundColor: "rgba(255,255,255,0.58)",
                    border: "1px solid rgba(255,255,255,0.75)",
                    boxShadow: "0 10px 24px rgba(17, 53, 26, 0.10)",
                    px: 1.5,
                    py: 1.25,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Avatar sx={{ width: 40, height: 40, bgcolor: "#227029", fontWeight: 700, boxShadow: "0 6px 16px rgba(34,112,41,0.25)" }}>
                      {getInitials(currentUser)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "#102815" }} noWrap>
                        {currentUser.username}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "rgba(16,40,21,0.76)", textTransform: "uppercase", letterSpacing: 0.6 }} noWrap>
                        {currentUser.role}
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    sx={{
                      mt: 1.25,
                      color: "#102815",
                      borderColor: "rgba(16,40,21,0.22)",
                      backgroundColor: "rgba(255,255,255,0.45)",
                      fontWeight: 700,
                      "&:hover": {
                        borderColor: "#227029",
                        backgroundColor: "rgba(255,255,255,0.72)",
                      },
                    }}
                  >
                    Logout
                  </Button>
                </Box>
              )}
            </Stack>
          ) : (
            <Avatar sx={{ bgcolor: "#227029", fontWeight: 700, width: 40, height: 40, boxShadow: "0 8px 18px rgba(34,112,41,0.22)" }}>
              {getInitials(currentUser)}
            </Avatar>
          )}
        </Toolbar>

        <Divider sx={{ borderColor: "#d5f5e3" }} />

        {open && recentUsers.length > 0 && (
          <Box sx={{ px: 1.5, py: 1.5 }}>
            <Typography variant="overline" sx={{ color: "rgba(16,40,21,0.78)", fontWeight: 800, letterSpacing: 1 }}>
              Logged in users
            </Typography>
            <List dense sx={{ mt: 0.75 }}>
              {recentUsers.map((user) => (
                <ListItem key={user.username} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    sx={{
                      borderRadius: 1,
                      px: 1,
                      py: 0.9,
                      backgroundColor: currentUser?.username === user.username ? "rgba(255,255,255,0.68)" : "rgba(255,255,255,0.38)",
                      border: "1px solid rgba(255,255,255,0.45)",
                      boxShadow: currentUser?.username === user.username ? "0 8px 18px rgba(17, 53, 26, 0.10)" : "none",
                      transition: "0.2s ease",
                      "&:hover": {
                        backgroundColor: "rgba(255,255,255,0.72)",
                      },
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 36 }}>
                      <Avatar sx={{ width: 30, height: 30, bgcolor: "#227029", fontSize: 12, boxShadow: "0 6px 14px rgba(34,112,41,0.2)" }}>
                        {getInitials(user)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.username}
                      secondary={user.role}
                      primaryTypographyProps={{ fontSize: 13, fontWeight: 800, noWrap: true, color: "#102815" }}
                      secondaryTypographyProps={{ fontSize: 11, noWrap: true, color: "rgba(16,40,21,0.68)" }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {open && recentUsers.length === 0 && currentUser && (
          <Box sx={{ px: 1.5, py: 1.5 }}>
            <Typography variant="overline" sx={{ color: "rgba(16,40,21,0.78)", fontWeight: 800, letterSpacing: 1 }}>
              Logged in users
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.75, color: "rgba(16,40,21,0.75)" }}>
              {currentUser.username} is the active session.
            </Typography>
          </Box>
        )}

        <Box sx={{ flex: 1, px: 1, pb: 1 }}>
          <List>
            {menuItems.map((item) => {
              const selected = location.pathname === item.path;

              return (
                <ListItem
                  key={item.text}
                  disablePadding
                  sx={{ mb: 1, borderRadius: 1 }}
                >
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    sx={{
                      borderRadius: 1,
                      backgroundColor: selected ? "#7cd992" : "inherit",
                      "&:hover": { backgroundColor: "#81e6a8" },
                      justifyContent: open ? "flex-start" : "center",
                      px: open ? 2 : 1,
                      transition: "0.2s",
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: "black",
                        minWidth: open ? "40px" : "0px",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>

                    {open && (
                      <ListItemText
                        primary={item.text}
                        sx={{ opacity: open ? 1 : 0, transition: "opacity 0.2s" }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* MAIN CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100vw",
          minHeight: "100vh",
          backgroundColor: "white",
          position: "relative",
          p: 8,
          overflow: "hidden",
          transition: "margin-left 0.3s ease",
          ml: open ? `${expandedWidth}px` : `${collapsedWidth}px`,
        }}
      >
        <Toolbar />

        {/* FAINT BACKGROUND LOGOS */}
        {logoPositions.map((pos, i) => (
          <Box
            key={i}
            component="img"
            src={logoUrl}
            sx={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              width: pos.size,
              opacity: 0.1,
              transform: `rotate(${pos.rotate})`,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
        ))}

        {/* PAGE CONTENT */}
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
