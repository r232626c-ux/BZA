import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Typography } from "@mui/material";

// Layouts & Components
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ViewResults from "./components/NewRequest/ViewResults";

// Pages
import Login from "./pages/Login";
import DoctorDashboard from "./pages/DoctorDashboard";
import LabDashboard from "./pages/LabDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NewRequestPage from "./pages/NewRequestPage";
import PatientRecords from "./pages/PatientRecords";
import AdminCreateUser from "./pages/AdminCreateUser";
import LabResults from "./pages/LabResults";
import RequestLogPage from "./pages/RequestLogPage";
import Settings from "./pages/Settings";
import BIOZONEEmails from "./pages/BIOZONEEmails";
import MedicalAidClaims from "./pages/MedicalAidClaims";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

// -----------------------------------------
// Wrapper to fetch lab request data before showing ViewResults
// -----------------------------------------
const ViewResultsWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [labResults, setLabResults] = useState([]);
  const token = localStorage.getItem("token");

  const parsedClinicalData = (() => {
    try {
      const rawClinicalData = request?.patient?.clinical_data;
      return rawClinicalData ? JSON.parse(rawClinicalData) : {};
    } catch {
      return {};
    }
  })();

  const submissionForm = parsedClinicalData?.submissionForm || {};
  const samples = (Array.isArray(parsedClinicalData?.samples) ? parsedClinicalData.samples : []).filter(
    (sample) => String(sample?.sampleName || "").trim().length > 0
  );

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API_URL}/lab-requests/${id}`, { headers }),
      axios.get(`${API_URL}/lab-requests/${id}/results/`, { headers }),
    ])
      .then(([requestResponse, resultsResponse]) => {
        setRequest(requestResponse.data || null);
        setLabResults(Array.isArray(resultsResponse.data) ? resultsResponse.data : []);
      })
      .catch((err) => {
        console.error(err);
        setRequest(null);
        setLabResults([]);
      });
  }, [id, token]);

  if (!request) return <Typography sx={{ p: 4 }}>Loading...</Typography>;

  return (
    <ViewResults
      selectedTests={labResults.map((lr) => ({
        id: lr.id,
        name: lr.lab_test?.name || lr.test_name,
        category: lr.lab_test?.category,
        result: lr.results,
        unit: lr.unit ?? "",
refRange: lr.ref_range ?? lr.refrange ?? "",
flag: lr.flag ?? "",
comment: lr.comment ?? "",
      }))}
      patient={{
        firstName: request.patient.first_name,
        lastName: request.patient.last_name,
        dob: request.patient.dob,
        gender: request.patient.gender,
        facility: request.patient.facility,
        funding: request.patient.funding,
        clinicalData: request.patient.clinical_data,
        doctorName: request.patient.doctor_name,
      }}
      submissionForm={submissionForm}
      samples={samples}
      requestId={request.id}
      sampleDate={request.sample_date}
      labScientist="Mr Chonzi"
      onCancel={() => navigate("/dashboard/lab-results")}
    />
  );
};

// -----------------------------------------
// Main App Routes
// -----------------------------------------
function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />

        {/* Admin-only Pages */}
        <Route
          path="/admin/create-user"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminCreateUser />
            </ProtectedRoute>
          }
        />

        {/* Lab Requests */}
        <Route path="/lab-requests/:id/view" element={<ViewResultsWrapper />} />

        {/* Protected Dashboard Layout */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute allowedRoles={["doctor", "labtech", "admin","user" ]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Default redirect */}
          <Route index element={<Navigate to="doctor" replace />} />

          {/* Dashboards */}
          <Route path="doctor" element={<DoctorDashboard />} />
          <Route path="lab" element={<LabDashboard />} />
          <Route path="admin" element={<LabDashboard />} />
           <Route path="user" element={<LabDashboard />} />

          {/* Pages */}
          <Route path="new-request" element={<NewRequestPage />} />
          <Route path="lab-results" element={<LabResults />} />
          <Route path="request-log" element={<RequestLogPage />} />
          <Route path="patients" element={<PatientRecords />} />
          <Route path="emails" element={<BIOZONEEmails />} />
          <Route path="claims" element={<MedicalAidClaims />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
 