import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    labName: "",
    turnaroundTime: "",
    enableNotifications: false,
    maintenanceMode: false,
    defaultReportFormat: "PDF",
    dataRetentionDays: 365,
    lastPaymentDate: null,
    paymentStatus: "active",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentCode, setPaymentCode] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [systemLocked, setSystemLocked] = useState(false);
  const [daysUntilPayment, setDaysUntilPayment] = useState(0);
  const [statusSeverity, setStatusSeverity] = useState("success");
  const [activeCodePeriods, setActiveCodePeriods] = useState([]);

  const getErrorMessage = (error, fallback) => {
    const detail = error?.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    return fallback;
  };

  // Check if system needs payment
  const checkPaymentStatus = (lastPayment, backendStatus) => {
    const normalizedStatus = String(backendStatus || "").toLowerCase();

    // Explicit backend inactive/locked status should always lock the system.
    if (normalizedStatus === "inactive" || normalizedStatus === "locked") {
      setSystemLocked(true);
      setPaymentDialogOpen(true);
      setDaysUntilPayment(0);
      setStatusSeverity("error");
      return;
    }

    if (!lastPayment) {
      setSystemLocked(true);
      setPaymentDialogOpen(true);
      setDaysUntilPayment(0);
      setStatusSeverity("error");
      return;
    }

    const lastPaymentDate = new Date(lastPayment);
    if (Number.isNaN(lastPaymentDate.getTime())) {
      setSystemLocked(true);
      setPaymentDialogOpen(true);
      setDaysUntilPayment(0);
      setStatusSeverity("error");
      return;
    }

    const today = new Date();
    const daysElapsed = Math.floor(
      (today - lastPaymentDate) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = 60 - daysElapsed; // 2 months = 60 days

    if (daysRemaining <= 0) {
      setSystemLocked(true);
      setPaymentDialogOpen(true);
      setDaysUntilPayment(0);
      setStatusSeverity("error");
    } else if (daysRemaining <= 7) {
      // Warning if less than 7 days left
      setSystemLocked(false);
      setDaysUntilPayment(daysRemaining);
      setStatusSeverity("warning");
    } else {
      setDaysUntilPayment(daysRemaining);
      setSystemLocked(false);
      setStatusSeverity("success");
    }
  };

  // Fetch system settings from backend on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
        const [settingsResponse, statusResponse] = await Promise.all([
          axios.get(`${API_URL}/system-settings/`, { headers }),
          axios.get(`${API_URL}/system-settings/payment-status`, { headers }),
        ]);

        const response = settingsResponse;
        const paymentStatus = statusResponse.data || {};

        setSettings((prev) => ({ ...prev, ...response.data }));
        setActiveCodePeriods(paymentStatus.activeCodePeriods || []);

        if (typeof paymentStatus.daysRemaining === "number") {
          setDaysUntilPayment(paymentStatus.daysRemaining);
        }
        if (typeof paymentStatus.locked === "boolean") {
          setSystemLocked(paymentStatus.locked);
          setStatusSeverity(paymentStatus.locked ? "error" : paymentStatus.daysRemaining <= 7 ? "warning" : "success");
          if (paymentStatus.locked) {
            setPaymentDialogOpen(true);
          }
        } else {
          checkPaymentStatus(response.data.lastPaymentDate, response.data.paymentStatus);
        }
      } catch (error) {
        console.error("Failed to load system settings:", error);
        setMessage(getErrorMessage(error, "Failed to load settings. Try refreshing."));
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle input changes dynamically
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Verify payment code and unlock system
  const handlePaymentVerification = async () => {
    if (!paymentCode.trim()) {
      setMessage("Please enter the payment verification code");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/system-settings/verify-payment/`,
        { code: paymentCode },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (response.data.success) {
        setMessage(response.data?.message || "Payment verified! System unlocked successfully.");
        const serverLastPaymentDate = response.data?.lastPaymentDate || new Date().toISOString();
        setSettings((prev) => ({
          ...prev,
          lastPaymentDate: serverLastPaymentDate,
          paymentStatus: "active",
        }));
        setPaymentCode("");
        setPaymentDialogOpen(false);
        setSystemLocked(false);
        checkPaymentStatus(serverLastPaymentDate, "active");

        try {
          const statusRes = await axios.get(`${API_URL}/system-settings/payment-status`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
          setActiveCodePeriods(statusRes.data?.activeCodePeriods || []);
        } catch {
          // Non-blocking status refresh
        }
      } else {
        setMessage(response.data?.message || "Invalid payment code. Please try again.");
      }
    } catch (error) {
      console.error("Payment verification failed:", error);
      setMessage(getErrorMessage(error, "Payment verification failed. Please try again."));
    }
  };

  // Save updated settings to backend
  const handleSave = async () => {
    if (systemLocked) {
      setMessage("System is locked. Please verify payment before saving.");
      return;
    }

    setSaving(true);
    try {
      await axios.put(
        `${API_URL}/system-settings/`,
        settings,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      const refreshed = await axios.get(`${API_URL}/system-settings/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSettings((prev) => ({ ...prev, ...refreshed.data }));
      checkPaymentStatus(refreshed.data.lastPaymentDate, refreshed.data.paymentStatus);
      setMessage("Settings updated successfully!");
    } catch (error) {
      console.error("Failed to update settings:", error);
      setMessage(getErrorMessage(error, "Failed to save settings. Try again."));
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        System Settings
      </Typography>

      {/* System Status & Payment Section */}
      <Card sx={{ mb: 3, backgroundColor: systemLocked ? "#ffebee" : "#e8f5e9" }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="h6">
              System Status & Payment
            </Typography>
            <Chip
              label={systemLocked ? "LOCKED" : statusSeverity === "warning" ? "ACTIVE - PAYMENT DUE" : "ACTIVE"}
              color={systemLocked ? "error" : statusSeverity === "warning" ? "warning" : "success"}
              size="small"
            />
          </Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Status:</strong> {systemLocked ? "🔒 LOCKED" : "🔓 ACTIVE"}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Last Payment Date:</strong>{" "}
            {settings.lastPaymentDate
              ? new Date(settings.lastPaymentDate).toLocaleDateString()
              : "Never"}
          </Typography>
          {daysUntilPayment > 0 && !systemLocked && (
            <Typography variant="body2" color={daysUntilPayment <= 7 ? "warning.main" : "text.secondary"} sx={{ mb: 2 }}>
              ⚠️ Payment due in {daysUntilPayment} days
            </Typography>
          )}
          {activeCodePeriods.length > 0 && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Current valid payment periods:</strong> {activeCodePeriods.join(", ")}
            </Typography>
          )}
          {systemLocked && (
            <Alert severity="error" sx={{ mb: 2 }}>
              System is locked. Please verify payment to continue.
            </Alert>
          )}
          {systemLocked && (
            <Button
              variant="contained"
              color="error"
              onClick={() => setPaymentDialogOpen(true)}
            >
              Verify Payment
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Lab Configuration */}
      <TextField
        label="Lab Name"
        name="labName"
        value={settings.labName}
        onChange={handleChange}
        fullWidth
        sx={{ mb: 2 }}
        disabled={systemLocked}
      />

      <TextField
        label="Default Turnaround Time (hrs)"
        name="turnaroundTime"
        type="number"
        value={settings.turnaroundTime}
        onChange={handleChange}
        fullWidth
        sx={{ mb: 2 }}
        disabled={systemLocked}
      />

      <FormControlLabel
        control={
          <Checkbox
            name="enableNotifications"
            checked={settings.enableNotifications}
            onChange={handleChange}
            disabled={systemLocked}
          />
        }
        label="Enable Notifications"
        sx={{ mb: 2 }}
      />

      <Divider sx={{ my: 3 }} />

      {/* Additional System Settings */}
      <TextField
        label="Data Retention (days)"
        name="dataRetentionDays"
        type="number"
        value={settings.dataRetentionDays}
        onChange={handleChange}
        fullWidth
        sx={{ mb: 2 }}
        disabled={systemLocked}
      />

      <TextField
        label="Default Report Format"
        name="defaultReportFormat"
        value={settings.defaultReportFormat}
        onChange={handleChange}
        fullWidth
        sx={{ mb: 2 }}
        disabled={systemLocked}
      />

      <FormControlLabel
        control={
          <Checkbox
            name="maintenanceMode"
            checked={settings.maintenanceMode}
            onChange={handleChange}
            disabled={systemLocked}
          />
        }
        label="Enable Maintenance Mode"
        sx={{ mb: 2 }}
      />

      {message && (
        <Typography
          variant="body2"
          color={
            message.toLowerCase().includes("failed") ||
            message.toLowerCase().includes("invalid") ||
            message.toLowerCase().includes("error")
              ? "error"
              : "success"
          }
          sx={{ mb: 2 }}
        >
          {message}
        </Typography>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleSave}
        disabled={saving || systemLocked}
      >
        {saving ? "Saving..." : systemLocked ? "System Locked" : "Save Settings"}
      </Button>

      {/* Payment Verification Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => {
          if (!systemLocked) setPaymentDialogOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Verify Payment</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Your subscription requires payment. Please enter the payment verification code
            to unlock the system.
          </Alert>
          <TextField
            label="Payment Verification Code"
            type="password"
            value={paymentCode}
            onChange={(e) => setPaymentCode(e.target.value)}
            fullWidth
            placeholder="Enter the code provided by the system administrator"
            onKeyDown={(e) => {
              if (e.key === "Enter") handlePaymentVerification();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPaymentDialogOpen(false)}
            disabled={false}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePaymentVerification}
            variant="contained"
            color="primary"
          >
            Verify
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemSettings;
