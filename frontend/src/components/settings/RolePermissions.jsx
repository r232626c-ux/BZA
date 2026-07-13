import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Paper,
  Typography,
  Grid,
  Checkbox,
  FormControlLabel,
  Divider,
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";

// All possible permissions
const allPermissions = [
  "Manage users and roles",
  "Configure system settings",
  "Access audit logs",
  "Add lab tests",
  "Delete lab tests",
  "Access food test results",
  "Manage lab requests",
  "Enter results accurately",
  "Mark requests as completed",
  "Register new food clients",
  "Initiate food test requests",
  "Access food test history",
  "Analyze test results",
  "Generate reports",
  "View lab inventory",
];

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const EXCLUDED_ROLES = new Set(["doctor"]);

const adminPermissions = [
  "Manage users and roles",
  "Configure system settings",
  "Access audit logs",
  "Add lab tests",
  "Delete lab tests",
  "Access food test results",
  "Manage lab requests",
  "Enter results accurately",
  "Mark requests as completed",
  "Register new food clients",
  "Initiate food test requests",
  "Access food test history",
  "Analyze test results",
  "Generate reports",
  "View lab inventory",
];

const legacyPermissionMap = {
  "Access patient lab results": "Access food test results",
  "Register new patients": "Register new food clients",
  "Initiate lab requests": "Initiate food test requests",
  "Access patient history": "Access food test history",
};

const normalizePermissionLabel = (permission = "") =>
  legacyPermissionMap[permission] || permission;

const normalizePermissionList = (permissions = []) =>
  Array.from(new Set((permissions || []).map((perm) => normalizePermissionLabel(perm))));

// Default permissions for each role
const defaultRolePermissions = {
  Admin: adminPermissions,
  Reception: [
    "Register new food clients",
    "Initiate food test requests",
    "Access food test history",
  ],
  "Lab Technician": [
    "Add lab tests",
    "Delete lab tests",
    "Access food test results",
    "Manage lab requests",
    "Enter results accurately",
    "Mark requests as completed",
    "Register new food clients",
    "Initiate food test requests",
    "Access food test history",
    "Analyze test results",
    "Generate reports",
    "View lab inventory",
  ],
  Scientist: [
    "Access food test results",
    "Manage lab requests",
    "Enter results accurately",
    "Access food test history",
    "Analyze test results",
    "Generate reports",
    "Configure system settings",
    "Access audit logs",
  ],
  "Technical Manager": [
    "Access food test results",
    "Manage lab requests",
    "Analyze test results",
    "Generate reports",
    "Configure system settings",
    "Access audit logs",
  ],
  "Lab Manager": [
    ...adminPermissions,
  ],
  "Scientific Director": [
    ...adminPermissions,
  ],
  Finance: [
    "Access food test history",
    "View lab inventory",
  ],
  User: [],
};

const RolePermissions = () => {
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roles, setRoles] = useState([]);
  const [usersByRole, setUsersByRole] = useState({});

  // Load permissions from backend on component mount
  useEffect(() => {
    loadRolePermissionData();
  }, []);

  const buildRoleOrder = (roleList) => {
    const rolePriority = {
      Admin: 0,
      Reception: 1,
      "Lab Technician": 2,
      Scientist: 3,
      "Technical Manager": 4,
      "Lab Manager": 5,
      "Scientific Director": 6,
      Finance: 7,
      User: 8,
    };

    return [...roleList].sort((a, b) => {
      const aPriority = rolePriority[a] ?? 100;
      const bPriority = rolePriority[b] ?? 100;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.localeCompare(b);
    });
  };

  const loadRolePermissionData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [adminRes, permsRes, usersRes] = await Promise.allSettled([
        axios.get(`${API_URL}/admin/check-admin/`, { headers }),
        axios.get(`${API_URL}/admin/permissions/`, { headers }),
        axios.get(`${API_URL}/admin/users`, { headers }),
      ]);

      const canEdit = adminRes.status === "fulfilled" && Boolean(adminRes.value?.data?.is_admin);
      setIsAdmin(canEdit);

      const backendPermissions =
        permsRes.status === "fulfilled" ? permsRes.value?.data?.permissions || {} : {};

      const users = usersRes.status === "fulfilled" ? usersRes.value?.data || [] : [];
      const nextUsersByRole = users.reduce((acc, user) => {
        const role = user?.role || "Unassigned";
        if (!acc[role]) acc[role] = [];
        acc[role].push(user?.username || "Unknown user");
        return acc;
      }, {});

      const roleSet = new Set([
        ...Object.keys(backendPermissions),
        ...Object.keys(nextUsersByRole),
      ]);

      let orderedRoles = buildRoleOrder(
        Array.from(roleSet).filter((role) => !EXCLUDED_ROLES.has(String(role || "").trim().toLowerCase()))
      );

      // If backend has no role data yet, fall back to known defaults.
      if (orderedRoles.length === 0) {
        orderedRoles = buildRoleOrder(Object.keys(defaultRolePermissions));
      }

      const mergedPermissions = {};

      orderedRoles.forEach((role) => {
        if (Array.isArray(backendPermissions[role])) {
          mergedPermissions[role] = normalizePermissionList(backendPermissions[role]);
        } else {
          mergedPermissions[role] = normalizePermissionList(defaultRolePermissions[role] || []);
        }
      });

      setRoles(orderedRoles);
      setUsersByRole(nextUsersByRole);
      setSelectedPermissions(mergedPermissions);
    } catch (error) {
      console.error("Failed to load role-permission data:", error);
      const fallbackRoles = buildRoleOrder(Object.keys(defaultRolePermissions));
      const fallbackPerms = {};
      fallbackRoles.forEach((role) => {
        fallbackPerms[role] = defaultRolePermissions[role] || [];
      });
      setRoles(fallbackRoles);
      setUsersByRole({});
      setSelectedPermissions(fallbackPerms);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (role, permission) => {
    if (!isAdmin) return;
    setSelectedPermissions((prev) => {
      const rolePerms = prev[role] || [];
      if (rolePerms.includes(permission)) {
        return { ...prev, [role]: rolePerms.filter((p) => p !== permission) };
      } else {
        return { ...prev, [role]: [...rolePerms, permission] };
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      
      await axios.put(
        `${API_URL}/admin/permissions/`,
        { permissions: selectedPermissions },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await loadRolePermissionData();
      
      setMessage("Permissions saved successfully!");
      setMessageType("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Failed to save permissions:", error);
      setMessage(
        error.response?.data?.detail || 
        "Failed to save permissions. Please try again."
      );
      setMessageType("error");
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 2, maxHeight: "80vh", overflowY: "auto" }}>
      <Typography variant="h5" gutterBottom textAlign="center">
        Role Selection & Permissions
      </Typography>
      {!isAdmin && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You are viewing permissions in read-only mode. Admin or Colly access is required to edit.
        </Alert>
      )}
      <Divider sx={{ mb: 3 }} />

      {roles.map((role) => (
        <Box key={role} sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1 }}>
            <Typography variant="h6" sx={{ color: "primary.main" }}>
              {role}
            </Typography>
            <Chip
              size="small"
              color="default"
              label={`Users: ${(usersByRole[role] || []).length}`}
            />
          </Box>
          {(usersByRole[role] || []).length > 0 && (
            <Typography variant="body2" sx={{ mb: 1.25, color: "text.secondary" }}>
              {`Assigned users: ${usersByRole[role].join(", ")}`}
            </Typography>
          )}
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={1}>
            {allPermissions.map((perm) => (
              <Grid item xs={12} sm={6} md={4} key={perm}>
                {isAdmin ? (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={
                          selectedPermissions[role]
                            ? selectedPermissions[role].includes(perm)
                            : false
                        }
                        onChange={() => handleToggle(role, perm)}
                        disabled={saving}
                      />
                    }
                    label={perm}
                  />
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", p: 1 }}>
                    <Checkbox
                      checked={
                        selectedPermissions[role]
                          ? selectedPermissions[role].includes(perm)
                          : false
                      }
                      disabled
                      readOnly
                    />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {perm}
                    </Typography>
                  </Box>
                )}
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}

      {isAdmin && (
        <Box textAlign="center" mt={3}>
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={saving}
            sx={{ minWidth: 150 }}
          >
            {saving ? "Saving..." : "Save Permissions"}
          </Button>
        </Box>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={messageType}>
          {message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default RolePermissions;
