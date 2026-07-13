import React, { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Divider,
  Button,
} from "@mui/material";

// Import your components for each tab
import UserManagement from "../components/settings/UserManagement";
import RolePermissions from "../components/settings/RolePermissions";
import SystemSettings from "../components/settings/SystemSettings";
import AuditLogs from "../components/settings/AuditLogs";

const Settings = () => {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, m: -8, p: 2 }}>
        <Typography variant="h4">
        
        </Typography>
        <Button variant="outlined" color="error" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        sx={{ mb: 2 }}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab label="Account Management" />
        <Tab label="Roles & Permissions" />
        <Tab label="System Settings" />
        <Tab label="Access & Audit Logs" />
      </Tabs>

      <Divider sx={{ mb: 2 }} />

      <Paper sx={{ p: 3 }}>
        {tabIndex === 0 && <UserManagement />}
        {tabIndex === 1 && <RolePermissions />}
        {tabIndex === 2 && <SystemSettings />}
        {tabIndex === 3 && <AuditLogs />}
      </Paper>
    </Box>
  );
};

export default Settings;
