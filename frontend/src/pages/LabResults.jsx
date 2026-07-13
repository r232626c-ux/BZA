import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const MONTH_OPTIONS = [
  { value: "", label: "All Months" },
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

function SummaryCard({ label, value }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid #e5e7eb",
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700 }}>
        {value ?? 0}
      </Typography>
    </Paper>
  );
}

export default function LabResults() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [availableYears, setAvailableYears] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("token");

  const buildQuery = useCallback(
    (override = {}) => {
      const params = new URLSearchParams();
      const pageValue = override.page ?? 0;
      const pageSizeValue = override.pageSize ?? 500;
      const sortField = override.sortBy ?? "report_date";
      const sortDirection = override.sortOrder ?? "desc";

      params.set("page", String(pageValue + 1));
      params.set("page_size", String(pageSizeValue));
      params.set("sort_by", sortField);
      params.set("sort_order", sortDirection);
      params.set("group_by_request", "true");
      params.set("status", "Completed");

      if (year) params.set("year", String(year));
      if (month) params.set("month", String(month));
      if (search.trim()) params.set("search", search.trim());

      return params.toString();
    },
    [year, month, search]
  );

  const loadRows = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const query = buildQuery();
      const { data } = await axios.get(`${API_URL}/sample-management?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const normalizedRows = (Array.isArray(data.rows) ? data.rows : []).map((row) => ({
        id: row.id,
        request_id: Number(row.request_number) || row.request_number,
        record_id: row.sample_id || row.id || "-",
        sample_receipt_date: row.received_date || row.collection_date || "-",
        sample_receipt_time: row.received_time || row.collection_time || "-",
        branch: row.facility || row.laboratory || "-",
        job_ref_number: row.barcode || row.request_number || "-",
        sample_number: row.sample_number || row.sample_id || row.id || "-",
        client_organization: row.patient_name || "-",
        tests: row.test_requested || "-",
        status: row.status || "Pending",
        cash_paid: String(row.funding_type || row.medical_aid || "").toLowerCase().includes("cash")
          ? (row.funding_type || row.medical_aid || "-")
          : "-",
        bank_eco: String(row.funding_type || row.medical_aid || "").toLowerCase().includes("bank") ||
          String(row.funding_type || row.medical_aid || "").toLowerCase().includes("eco")
          ? (row.funding_type || row.medical_aid || "-")
          : "-",
        report_date: row.updated_date || row.created_date || "-",
      })).filter((row) => String(row.status || "").toLowerCase() === "completed");

      setRows(normalizedRows);
      setSummary(data.summary || {});
      setAvailableYears(Array.isArray(data.available_years) ? data.available_years : []);
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not load food results. Please verify the backend is running.");
      setRows([]);
      setSummary({});
    } finally {
      setIsLoading(false);
    }
  }, [buildQuery, token]);

  useEffect(() => {
    if (!token) {
      setErrorMessage("Session expired. Please login again.");
      return;
    }
    loadRows();
  }, [loadRows, token]);

  const handleExport = async (format) => {
    try {
      const query = buildQuery({ page: 0, pageSize: 500 });
      const response = await axios.get(`${API_URL}/sample-management/export/${format}?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `food-results.${format === "excel" ? "xlsx" : format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setErrorMessage(`Unable to export ${format.toUpperCase()} file.`);
    }
  };

  const columns = useMemo(
    () => [
      { field: "record_id", headerName: "ID", minWidth: 110, flex: 0.6 },
      { field: "client_organization", headerName: "Client", minWidth: 200, flex: 1.2 },
      {
        field: "status",
        headerName: "Status",
        minWidth: 130,
        flex: 0.7,
        renderCell: (params) => (
          <Chip
            label={params.value || "Pending"}
            size="small"
            color={params.value === "Completed" ? "success" : params.value === "Processing" ? "info" : "warning"}
            variant="filled"
          />
        ),
      },
      {
        field: "view",
        headerName: "View",
        minWidth: 110,
        flex: 0.5,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate(`/lab-requests/${params.row.request_id}/view`)}
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
              FSH Results Log
            </Typography>
            <Typography variant="body2" color="text.secondary">
              FSH results log for food sample records and reporting
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadRows}>
              Refresh
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport("csv")}>
              CSV
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport("excel")}>
              Excel
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport("pdf")}>
              PDF
            </Button>
          </Stack>
        </Stack>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 6, md: 2 }}><SummaryCard label="Completed" value={summary.completed} /></Grid>
          <Grid size={{ xs: 6, md: 2 }}><SummaryCard label="Showing" value={rows.length} /></Grid>
          <Grid size={{ xs: 6, md: 2 }}><SummaryCard label="This Year" value={summary.this_year} /></Grid>
        </Grid>

        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Year</InputLabel>
              <Select label="Year" value={year} onChange={(e) => setYear(e.target.value)}>
                <MenuItem value="">All Years</MenuItem>
                {availableYears.map((optionYear) => (
                  <MenuItem key={optionYear} value={optionYear}>{optionYear}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Month</InputLabel>
              <Select label="Month" value={month} onChange={(e) => setMonth(e.target.value)}>
                {MONTH_OPTIONS.map((item) => (
                  <MenuItem key={item.label} value={item.value}>{item.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField size="small" fullWidth label="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
              <Button variant="contained" onClick={loadRows}>Apply</Button>
              <Button variant="text" onClick={() => { setYear(""); setMonth(""); setSearch(""); }}>Clear</Button>
            </Stack>
          </Grid>
        </Grid>

        <Box sx={{ height: "68vh", minHeight: 420, width: "100%", backgroundColor: "#fff", borderRadius: 2 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={isLoading}
            disableRowSelectionOnClick
            pagination
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { page: 0, pageSize: 25 } },
              sorting: { sortModel: [{ field: "report_date", sort: "desc" }] },
            }}
            sx={{ border: "1px solid #e2e8f0" }}
          />
        </Box>
      </Paper>

    </Box>
  );
}
