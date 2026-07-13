import { useCallback, useEffect, useMemo, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
const POLL_INTERVAL_MS = 30000;

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

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Collected", label: "Collected" },
  { value: "Received", label: "Received" },
  { value: "Processing", label: "Processing" },
  { value: "Completed", label: "Completed" },
  { value: "Rejected", label: "Rejected" },
  { value: "Cancelled", label: "Cancelled" },
];

function SummaryCard({ label, value, color }) {
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
      <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700, color }}>
        {value ?? 0}
      </Typography>
    </Paper>
  );
}

export default function PatientRecords() {
  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [availableYears, setAvailableYears] = useState([]);
  const [summary, setSummary] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState([{ field: "created_date", sort: "desc" }]);

  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [facility, setFacility] = useState("");
  const [clinician, setClinician] = useState("");
  const [sampleType, setSampleType] = useState("");
  const [department, setDepartment] = useState("");
  const [priority, setPriority] = useState("");
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("token");

  const buildQuery = useCallback(
    (override = {}) => {
      const params = new URLSearchParams();
      const pageValue = override.page ?? paginationModel.page;
      const pageSizeValue = override.pageSize ?? paginationModel.pageSize;
      const sortField = override.sortBy ?? sortModel[0]?.field ?? "created_date";
      const sortDirection = override.sortOrder ?? sortModel[0]?.sort ?? "desc";

      params.set("page", String(pageValue + 1));
      params.set("page_size", String(pageSizeValue));
      params.set("sort_by", sortField);
      params.set("sort_order", sortDirection);
      params.set("group_by_request", "true");
      params.set("group_by_test_category", "true");

      if (year) params.set("year", String(year));
      if (month) params.set("month", String(month));
      if (statusFilter) params.set("status", statusFilter);
      if (facility.trim()) params.set("facility", facility.trim());
      if (clinician.trim()) params.set("clinician", clinician.trim());
      if (sampleType.trim()) params.set("sample_type", sampleType.trim());
      if (department.trim()) params.set("department", department.trim());
      if (priority.trim()) params.set("priority", priority.trim());
      if (search.trim()) params.set("search", search.trim());
      return params.toString();
    },
    [paginationModel.page, paginationModel.pageSize, sortModel, year, month, statusFilter, facility, clinician, sampleType, department, priority, search]
  );

  const loadRows = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const query = buildQuery();
      const { data } = await axios.get(`${API_URL}/sample-management?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const normalizedRows = (Array.isArray(data.rows) ? data.rows : []).map((row) => {
        const fundingValue = String(row.funding_type || row.medical_aid || "");
        const lowerFunding = fundingValue.toLowerCase();
        const cashPaid = lowerFunding.includes("cash") ? fundingValue : "-";
        const bankEco =
          lowerFunding.includes("bank") ||
          lowerFunding.includes("eco") ||
          lowerFunding.includes("ecocash")
            ? fundingValue
            : "-";

        return {
          ...row,
          sample_receipt_date: row.received_date || row.collection_date || "-",
          sample_receipt_time: row.received_time || row.collection_time || "-",
          branch: row.facility || row.laboratory || "-",
          job_ref_number: row.barcode || row.request_number || "-",
          sample_number: row.sample_number || row.sample_id || row.id || "-",
          client_organization: row.patient_name || "-",
          tests: row.test_requested || "-",
          cash_paid: cashPaid,
          bank_eco: bankEco,
          report_date: row.updated_date || row.created_date || "-",
        };
      });

      setRows(normalizedRows);
      setTotalRows(Number(data.total || 0));
      setAvailableYears(Array.isArray(data.available_years) ? data.available_years : []);
      setSummary(data.summary || {});
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not load food sample records. Please verify backend is running.");
      setRows([]);
      setTotalRows(0);
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

  useEffect(() => {
    const interval = setInterval(() => {
      loadRows();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [loadRows]);

  const handleExport = async (format) => {
    try {
      const query = buildQuery({ page: 0, pageSize: 500 });
      const response = await axios.get(`${API_URL}/sample-management/export/${format}?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.href = url;
      link.download = `food-sample-management-${timestamp}.${format === "excel" ? "xlsx" : format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setErrorMessage(`Unable to export ${format.toUpperCase()} report.`);
    }
  };

  const clearFilters = () => {
    setYear("");
    setMonth("");
    setStatusFilter("");
    setFacility("");
    setClinician("");
    setSampleType("");
    setDepartment("");
    setPriority("");
    setSearch("");
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const columns = useMemo(
    () => [
      { field: "sample_receipt_date", headerName: "Sample Receipt Date", minWidth: 150, flex: 0.9 },
      { field: "sample_receipt_time", headerName: "Sample Receipt Time", minWidth: 150, flex: 0.9 },
      { field: "branch", headerName: "Branch", minWidth: 140, flex: 0.9 },
      { field: "job_ref_number", headerName: "Job Ref Number", minWidth: 170, flex: 1 },
      { field: "sample_number", headerName: "Sample Number", minWidth: 140, flex: 0.9 },
      { field: "client_organization", headerName: "Client/Organization", minWidth: 200, flex: 1.2 },
      { field: "tests", headerName: "Tests", minWidth: 240, flex: 1.6 },
      { field: "cash_paid", headerName: "Cash Paid", minWidth: 140, flex: 0.8 },
      { field: "bank_eco", headerName: "Bank/Eco", minWidth: 140, flex: 0.8 },
      { field: "report_date", headerName: "Report Date", minWidth: 170, flex: 1 },
    ],
    []
  );

  return (
    <Box sx={{ width: "100%" }}>
      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: "1px solid #e2e8f0" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Food Sample Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Live food sample tracking and reporting workspace
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

        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid size={{ xs: 6, md: 2 }}>
            <SummaryCard label="Total" value={summary.total_samples} color="#1f2937" />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <SummaryCard label="Pending" value={summary.pending} color="#b45309" />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <SummaryCard label="Processing" value={summary.processing} color="#1d4ed8" />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <SummaryCard label="Completed" value={summary.completed} color="#047857" />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <SummaryCard label="Today" value={summary.todays_samples} color="#6d28d9" />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <SummaryCard label="This Month" value={summary.this_month} color="#be123c" />
          </Grid>
        </Grid>

        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Year</InputLabel>
              <Select label="Year" value={year} onChange={(e) => setYear(e.target.value)}>
                <MenuItem value="">All Years</MenuItem>
                {availableYears.map((optionYear) => (
                  <MenuItem key={optionYear} value={optionYear}>
                    {optionYear}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Month</InputLabel>
              <Select label="Month" value={month} onChange={(e) => setMonth(e.target.value)}>
                {MONTH_OPTIONS.map((item) => (
                  <MenuItem key={item.label} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {STATUS_OPTIONS.map((item) => (
                  <MenuItem key={item.label} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              size="small"
              fullWidth
              label="Facility"
              value={facility}
              onChange={(e) => setFacility(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              size="small"
              fullWidth
              label="Clinician"
              value={clinician}
              onChange={(e) => setClinician(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              size="small"
              fullWidth
              label="Sample Type"
              value={sampleType}
              onChange={(e) => setSampleType(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              size="small"
              fullWidth
              label="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              size="small"
              fullWidth
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              size="small"
              fullWidth
              label="Search"
              placeholder="Sample ID, name, national ID, barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
              <Button
                variant="contained"
                onClick={() => {
                  setPaginationModel((prev) => ({ ...prev, page: 0 }));
                  loadRows();
                }}
              >
                Apply Filters
              </Button>
              <Button variant="text" onClick={clearFilters}>
                Clear
              </Button>
            </Stack>
          </Grid>
        </Grid>

        <Box sx={{ height: "68vh", minHeight: 420, width: "100%", backgroundColor: "#fff", borderRadius: 2 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            rowCount={totalRows}
            loading={isLoading}
            disableRowSelectionOnClick
            pagination
            paginationMode="server"
            sortingMode="server"
            pageSizeOptions={[10, 25, 50, 100]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sortModel={sortModel}
            onSortModelChange={setSortModel}
            slots={{
              loadingOverlay: () => (
                <Stack height="100%" alignItems="center" justifyContent="center">
                  <CircularProgress size={28} />
                </Stack>
              ),
            }}
            sx={{
              border: "1px solid #e2e8f0",
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
              },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}


