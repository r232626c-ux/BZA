import React, { useEffect, useState } from "react";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Box,
} from "@mui/material";
import axios from "axios";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Setup axios interceptor to log all user actions
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      async (config) => {
        // Don't log audit log fetches to avoid infinite loops
        if (!config.url.includes("/api/audit-logs")) {
          try {
            const token = localStorage.getItem("token");
            const method = config.method.toUpperCase();
            const action = `${method} ${config.url}`;
            const details = config.data ? JSON.stringify(config.data) : null;

            // Log to backend
            await axios.post(
              "http://127.0.0.1:8000/api/audit-logs/log-action",
              {
                action: action,
                details: details,
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
          } catch (err) {
            console.error("Failed to log action:", err);
            // Don't prevent the request even if logging fails
          }
        }
        return config;
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  // Fetch logs from backend
  const fetchAuditLogs = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/audit-logs");
      setLogs(response.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs(); // initial fetch

    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetchAuditLogs();
    }, 5000);

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>
        Access & Audit Logs
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : logs.length === 0 ? (
        <Typography>No audit logs found.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell><strong>{log.username || `ID:${log.user_id}` || '-'}</strong></TableCell>
                  <TableCell>{log.role}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                  <TableCell>{log.ip_address || "-"}</TableCell>
                  <TableCell>{log.details || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AuditLogs;
