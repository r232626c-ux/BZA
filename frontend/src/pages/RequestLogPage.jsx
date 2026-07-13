import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { DataGrid } from "@mui/x-data-grid";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export default function RequestLogPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });

  const token = localStorage.getItem("token");

  const loadRequests = useCallback(async () => {
    if (!token) {
      setErrorMessage("Session expired. Please login again.");
      setRows([]);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await axios.get(`${API_URL}/lab-requests/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const normalized = (Array.isArray(response.data) ? response.data : []).map((request) => {
        const status = (request.status || "Pending").trim();
        return {
          id: request.id,
          request_id: request.id,
          client_name: `${request.patient?.first_name || ""} ${request.patient?.last_name || ""}`.trim() || "-",
          status,
          completed: status === "Completed" ? "Completed" : "Not Completed",
          created_at: request.created_at || null,
        };
      });

      setRows(normalized);
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not load request log. Please verify backend is running.");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) => {
      return (
        String(row.request_id).includes(q) ||
        (row.client_name || "").toLowerCase().includes(q) ||
        (row.status || "").toLowerCase().includes(q) ||
        (row.completed || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const columns = useMemo(
    () => [
      { field: "request_id", headerName: "Request ID", minWidth: 130, flex: 0.7 },
      { field: "client_name", headerName: "Client", minWidth: 220, flex: 1.3 },
      {
        field: "status",
        headerName: "Status",
        minWidth: 160,
        flex: 0.8,
        renderCell: (params) => {
          const value = params.value || "Pending";
          const chipColor = value === "Completed" ? "success" : value === "Partially Completed" ? "warning" : "default";
          return <Chip size="small" label={value} color={chipColor} />;
        },
      },
      {
        field: "completed",
        headerName: "Completed",
        minWidth: 160,
        flex: 0.8,
        renderCell: (params) => (
          <Chip size="small" label={params.value} color={params.value === "Completed" ? "success" : "warning"} />
        ),
      },
      {
        field: "created_at",
        headerName: "Created At",
        minWidth: 200,
        flex: 1,
        valueFormatter: (value) => formatDate(value),
      },
      {
        field: "view",
        headerName: "View",
        minWidth: 110,
        flex: 0.6,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Button
            size="small"
            variant="outlined"
            onClick={() =>
              navigate("/dashboard/new-request", {
                state: { requestId: params.row.request_id, targetTab: "request" },
              })
            }
          >
            View
          </Button>
        ),
      },
    ],
    [navigate]
  );

  return (
    <Box sx={{ width: "100%" }}>
      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: "1px solid #e2e8f0" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Request Log
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All requests with Request ID and completion status
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadRequests}>
              Refresh
            </Button>
          </Stack>
        </Stack>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <TextField
          fullWidth
          size="small"
          label="Search by request ID, client, or status"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ mb: 2 }}
        />

        <Box sx={{ height: "70vh", minHeight: 420, width: "100%", backgroundColor: "#fff", borderRadius: 2 }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={isLoading}
            disableRowSelectionOnClick
            pagination
            pageSizeOptions={[10, 25, 50, 100]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sx={{ border: "1px solid #e2e8f0" }}
          />
        </Box>
      </Paper>
    </Box>
  );
}
