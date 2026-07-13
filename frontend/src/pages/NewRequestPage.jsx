import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import Grid from "@mui/material/Grid";
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Divider,
  FormControlLabel,
  Checkbox,
  Select,
  InputLabel,
  FormControl,
  Button,
  Snackbar,
  Alert,
  RadioGroup,
  Radio,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  useMediaQuery,
} from "@mui/material";
import { Verified, AddCircleOutline, DeleteOutline, ContentCopy } from "@mui/icons-material";
import dayjs from "dayjs";
import axios from "axios";

import { lab_reference } from "../data/lab_test_reference_data";
import FoodSafetyTestRequest from "../components/FoodSafetyTestRequest";
import RequestToolbar from "../components/NewRequest/RequestToolbar";
import FoodTestResults from "../components/NewRequest/FoodTestResults";
import ViewResults from "../components/NewRequest/ViewResults";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const initialPatient = {
  lastName: "",
  firstName: "",
  dob: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
  funding: "CASH (ZWL)",
  memberNumber: "",
  memberSuffix: "",
  relationship: "Self",
  principal: true,
  facility: "",
  doctorName: "",
  ahFoz: "",
  clinicalData: "",
};

const initialSubmissionForm = {
  submittingClient: "",
  contactPerson: "",
  telephoneEmail: "",
  submissionDate: dayjs().format("YYYY-MM-DD"),
  sampler: "",
  siteLocation: "",
  samplingPlanReference: "",
  decisionRule: "",
  reportingFormat: "Email",
  tatRequested: "",
  subContractingConsent: "Yes",
  authorizedSignatory: "",
  designation: "",
  signature: "",
  signatureDate: dayjs().format("YYYY-MM-DD"),
  labJobReference: "",
  labSubmissionDate: dayjs().format("YYYY-MM-DD"),
  labReceivedBy: "",
  labSubmittedBy: "",
  labDecisionRule: "",
  labReportingFormat: "",
  labTatRequested: "",
  labSubContractingConsent: "",
};

const createInitialSamples = () =>
  Array.from({ length: 8 }, (_, index) => ({
    id: `sample-${index + 1}`,
    sampleNumber: `S${index + 1}`,
    sampleName: "",
    sampleId: "",
    matrix: "",
    type: "",
    samplingDate: dayjs().format("YYYY-MM-DD"),
    storageCondition: "",
    quantityPackaging: "",
    specialInstructions: "",
  }));

const normalizeSamples = (samplesList) =>
  (Array.isArray(samplesList) ? samplesList : []).map((sample, index) => {
    const safeSample = sample && typeof sample === "object" ? sample : {};
    const sampleNumber = String(safeSample.sampleNumber || `S${index + 1}`).trim() || `S${index + 1}`;
    const sampleId = String(safeSample.sampleId || "").trim();
    return {
      ...safeSample,
      sampleNumber,
      sampleId: sampleId || sampleNumber,
    };
  });

const buildClinicalSummary = (formValues, samplesList) =>
  JSON.stringify({ submissionForm: formValues, samples: samplesList });

const NewRequestPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [patient, setPatient] = useState({ ...initialPatient });
  const [tab, setTab] = useState(0);
  const [selectedTests, setSelectedTests] = useState([]);
  const [requestId, setRequestId] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sampleDate, setSampleDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [labResults, setLabResults] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const [samples, setSamples] = useState(createInitialSamples());
  const isDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const pageBackground = isDarkMode ? "#07111f" : "#f4f8f4";
  const cardSurface = isDarkMode ? "#111827" : "#ffffff";
  const textColor = isDarkMode ? "#f9fafb" : "#0f172a";
  const mutedText = isDarkMode ? "#9ca3af" : "#4b5563";
  const borderColor = isDarkMode ? "rgba(255,255,255,0.12)" : "#dbe8db";
  const accentColor = "#2E7D32";
  const alertColor = "#C62828";
  const { control, register, reset, getValues, formState: { errors } } = useForm({
    defaultValues: initialSubmissionForm,
  });

  // Helper function to find category for a test name
  const getTestCategory = (testName) => {
    for (const [category, tests] of Object.entries(lab_reference)) {
      if (tests[testName]) {
        return category;
      }
    }
    return "Other"; // Default fallback
  };

  // Check backend connectivity on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      console.log("🔌 Testing backend connectivity...");
      axios.get(`${API_URL}/clients/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(() => console.log("✅ Backend is reachable"))
        .catch(err => console.error("❌ Backend connection failed:", err.message));
    }
  }, []);

  const age = useMemo(
    () => (patient.dob ? dayjs().diff(dayjs(patient.dob), "year") : ""),
    [patient.dob]
  );

  const fundingOptions = [
      "Agrimed",
      "Alliance Health Options,Multimed,Select RTGS",
      "Alliance Health Options,Multimed,Select USD",
      "Alliance Health Super Select RTGS",
      "Bonvie Bonvie Art",
      "Bonvie Comarton Fund RTGS",
      "Bonvie Medical Aid Scheme RTGS",
      "Bonvie Nyaradzo Fund RTGS",
      "Bonvie Platinum USD",
      "BUPA",
      "Calm Health Int.",
      "CASH (ZWL)",
      "Cash - USD",
      "CELLMED CONVENTIONAL RTGS",
      "Cellmed CMED RTGS",
      "Cellmed Diaspora Plan USD",
      "Cellmed Premium USD",
      "Cellmed Premium ZWL",
      "Cellmed Zesa Group Medical Fund",
      "Cellmed Zimplats RTGS",
      "Cellmed Zimplats USD",
      "CIGNA",
      "CIMAS Healthguard USD",
      "CIMAS HIT RTGS",
      "CIMAS MAIN RTGS",
      "CIMAS MSU RTGS",
      "CIMAS RIOZIM RTGS",
      "CIMAS TONGAAT HULETT USD",
      "CIMAS Triangle RTGS",
      "CIMAS UZ RTGS",
      "Corporate24",
      "CREDIT",
      "DISCOUNT",
      "EMERALD MEDICAL AID",
      "EMF Medical Aid",
      "Engineering Medical Aid Fund (EMAF) RTGS",
      "FBC USD",
      "Fbc Health Insurance RTGS",
      "FLIMAS (Fidelity Life) RTGS",
      "FLIMAS (Fidelity Life) USD",
      "FML/FMMSF (First Mutual) RTGS",
      "FMH Gold Indexed Insurer RTGS",
      "FMH Gold RTGS",
      "FMH Gold USD",
      "FMH Micromed RTGS",
      "FMH Pearl Executive Gold USD",
      "FMH Pearl Gold USD",
      "FMH Silver RTGS",
      "FREE",
      "GAMAS",
      "Generation Health RTGS",
      "Generation Health USD",
      "Global Health RTGS",
      "Hamilton Insurance",
      "Health International",
      "Healthcare Benefits Consulting RTGS",
      "Healthcare Benefits Consulting USD",
      "Henner",
      "Heritage Health Fund",
      "HMMAS",
      "Liberty",
      "MAISHA HEALTH FUND INDEXED RTGS",
      "MAISHA HEALTH FUND MAIN RTGS",
      "MAISHA HEALTH FUND RTGS",
      "MAISHA HEALTH FUND USD FUNDS",
      "MAISHA HEALTH FUND USD PURE",
      "masca rtgs",
      "MEDICITY",
      "Minerva",
      "National Social Security Authority (NSSA)",
      "Northern, Northern Alliance RTGS",
      "Northern, Northern Alliance USD",
      "Old Mutual",
      "Pro-Health",
      "PSMAS",
      "Railmed",
      "Steward Medical Funds",
      "SureMed",
      "UZ-UCSF",
      "Varimed",
      "ZiG (Zim Gold)",
      "ZimPapers",
    ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const handlePatientChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPatient((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const applyClinicalData = (clinicalData) => {
    if (!clinicalData) {
      reset(initialSubmissionForm);
      setSamples(createInitialSamples());
      return;
    }

    try {
      const parsed = JSON.parse(clinicalData);
      if (parsed?.submissionForm) {
        reset(parsed.submissionForm);
        if (Array.isArray(parsed.samples) && parsed.samples.length) {
          setSamples(parsed.samples);
          return;
        }
      }
    } catch {
      // Ignore invalid stored data and fall back to defaults.
    }

    reset(initialSubmissionForm);
    setSamples(createInitialSamples());
  };

  const loadRequestById = useCallback(
    async (requestIdToLoad, targetTab = "request") => {
      if (!requestIdToLoad) return;

      const token = localStorage.getItem("token");
      if (!token) {
        setSnack({ open: true, message: "Not authenticated. Please login.", severity: "error" });
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [requestResponse, resultsResponse] = await Promise.all([
          axios.get(`${API_URL}/lab-requests/${requestIdToLoad}`, { headers }),
          axios.get(`${API_URL}/lab-requests/${requestIdToLoad}/results/`, { headers }),
        ]);

        const requestData = requestResponse.data;
        const patientData = requestData?.patient || {};
        const results = Array.isArray(resultsResponse.data) ? resultsResponse.data : [];

        setPatient({
          lastName: patientData.last_name ?? "",
          firstName: patientData.first_name ?? "",
          dob: patientData.dob ?? "",
          gender: patientData.gender ?? "",
          phone: patientData.phone ?? "",
          email: patientData.email ?? "",
          address: patientData.address ?? "",
          funding: patientData.funding ?? "CASH (ZWL)",
          memberNumber: patientData.member_number ?? "",
          memberSuffix: patientData.member_suffix ?? "",
          relationship: patientData.relationship ?? "Self",
          principal: patientData.principal ?? true,
          facility: patientData.facility ?? "",
          doctorName: patientData.doctor_name ?? "",
          ahFoz: patientData.ah_foz ?? "",
          clinicalData: patientData.clinical_data ?? "",
        });
        applyClinicalData(patientData.clinical_data);
        setPatientId(patientData.id ?? null);
        setRequestId(requestData.id);
        setSelectedRequest(requestData);
        setRequests([requestData]);
        setSampleDate(requestData.sample_date ?? "");
        setLabResults(results);

        const mappedTests = results.map((result) => ({
          id: result.lab_test_id,
          name: result.test_name,
          category: getTestCategory(result.test_name),
          result: result.results,
          unit: result.unit,
          refRange: result.ref_range,
          flag: result.flag,
          comment: result.comment,
        }));

        setSelectedTests(mappedTests);

        if (targetTab === "results") {
          setTab(results.length > 0 ? 3 : 2);
        } else {
          setTab(0);
        }
      } catch (error) {
        console.error("Failed to load request by ID", error);
        setSnack({ open: true, message: "Failed to load the selected request.", severity: "error" });
      }
    },
    [getTestCategory]
  );

  const handleSampleFieldChange = (index, field, value) => {
    setSamples((prev) =>
      prev.map((sample, sampleIndex) =>
        sampleIndex === index ? { ...sample, [field]: value } : sample
      )
    );
  };

  const handleAddSample = () => {
    setSamples((prev) => [
      ...prev,
      {
        id: `sample-${Date.now()}`,
        sampleNumber: `S${prev.length + 1}`,
        sampleName: "",
        sampleId: "",
        matrix: "",
        type: "",
        samplingDate: dayjs().format("YYYY-MM-DD"),
        storageCondition: "",
        quantityPackaging: "",
        specialInstructions: "",
      },
    ]);
  };

  const handleDeleteSample = (index) => {
    setSamples((prev) => (prev.length > 1 ? prev.filter((_, sampleIndex) => sampleIndex !== index) : prev));
  };

  const handleDuplicateSample = (index) => {
    setSamples((prev) => {
      const source = prev[index];
      if (!source) return prev;
      const duplicate = { ...source, id: `sample-${Date.now()}`, sampleNumber: `S${prev.length + 1}` };
      return [...prev, duplicate];
    });
  };

  const handleNewRequest = () => {
    setPatient({ ...initialPatient });
    reset(initialSubmissionForm);
    setSamples(createInitialSamples());
    setSelectedTests([]);
    setRequestId(null);
    setSelectedRequest(null);
    setLabResults([]);
    setTab(0);
  };

  const handleSave = async () => {
    const submissionFormValues = getValues();
    const normalizedSamples = normalizeSamples(samples);
    const derivedFirstName = submissionFormValues.contactPerson?.trim() || patient.firstName || "";
    const derivedLastName = submissionFormValues.submittingClient?.trim() || patient.lastName || "";

    if (!derivedFirstName || !derivedLastName) {
      return setSnack({ open: true, message: "Please enter the client and contact person", severity: "warning" });
    }
    if (!submissionFormValues.submittingClient || !submissionFormValues.contactPerson || !submissionFormValues.telephoneEmail || !submissionFormValues.submissionDate || !submissionFormValues.sampler || !submissionFormValues.siteLocation) {
      return setSnack({ open: true, message: "Please complete the required client submission fields", severity: "warning" });
    }
    if (selectedTests.length === 0) {
      return setSnack({ open: true, message: "Please select at least one lab test", severity: "warning" });
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const headers = { Authorization: `Bearer ${token}` };

      const testsRes = await axios.get(`${API_URL}/lab-tests`, { headers });
      const backendTests = Array.isArray(testsRes.data) ? testsRes.data : [];
      const backendTestsByName = new Map(
        backendTests
          .filter((test) => typeof test?.name === "string" && Number.isFinite(Number(test?.id)))
          .map((test) => [String(test.name).trim().toLowerCase(), Number(test.id)])
      );

      const resolvedTests = selectedTests
        .map((test) => {
          const directId = Number(test.labTestId || test.id);
          const resolvedId =
            Number.isFinite(directId) && directId > 0
              ? directId
              : backendTestsByName.get(String(test.name || "").trim().toLowerCase()) || null;

          return {
            ...test,
            resolvedLabTestId: resolvedId,
          };
        })
        .filter((test) => Number.isFinite(Number(test.resolvedLabTestId)) && Number(test.resolvedLabTestId) > 0);

      if (resolvedTests.length === 0) {
        setSnack({
          open: true,
          message: "No valid food tests were resolved for saving. Please reselect tests and try again.",
          severity: "error",
        });
        return;
      }

      const resolvedPatient = {
        ...patient,
        firstName: derivedFirstName,
        lastName: derivedLastName,
        facility: submissionFormValues.submittingClient?.trim() || patient.facility || "",
        email: submissionFormValues.telephoneEmail?.trim() || patient.email || "",
        phone: submissionFormValues.telephoneEmail?.trim() || patient.phone || "",
        address: submissionFormValues.siteLocation?.trim() || patient.address || "",
        doctorName: submissionFormValues.authorizedSignatory?.trim() || patient.doctorName || "",
        clinicalData: buildClinicalSummary(submissionFormValues, normalizedSamples),
      };
      setPatient(resolvedPatient);
      setSamples(normalizedSamples);

      let patient_id;

      // 1️⃣ Check if client record exists
      const searchRes = await axios.get(
        `${API_URL}/clients/search/`,
        { params: { query: `${resolvedPatient.firstName} ${resolvedPatient.lastName}` }, headers }
      );

      if (searchRes.data && searchRes.data.length > 0) {
        patient_id = searchRes.data[0].id;

        await axios.put(
          `${API_URL}/clients/${patient_id}`,
          {
            first_name: resolvedPatient.firstName,
            last_name: resolvedPatient.lastName,
            dob: resolvedPatient.dob || null,
            gender: resolvedPatient.gender || null,
            facility: resolvedPatient.facility || null,
            funding: resolvedPatient.funding || null,
            member_number: resolvedPatient.memberNumber || null,
            member_suffix: resolvedPatient.memberSuffix || null,
            doctor_name: resolvedPatient.doctorName || null,
            clinical_data: resolvedPatient.clinicalData || null,
          },
          { headers }
        );
      } else {
        const patientRes = await axios.post(
          `${API_URL}/clients/`,
          {
            first_name: resolvedPatient.firstName,
            last_name: resolvedPatient.lastName,
            dob: resolvedPatient.dob || null,
            gender: resolvedPatient.gender || null,
            facility: resolvedPatient.facility || null,
            funding: resolvedPatient.funding || null,
            member_number: resolvedPatient.memberNumber || null,
            member_suffix: resolvedPatient.memberSuffix || null,
            doctor_name: resolvedPatient.doctorName || null,
            clinical_data: resolvedPatient.clinicalData || null,
          },
          { headers }
        );
        patient_id = patientRes.data.id;
      }

      // 2️⃣ Always create a new lab request so each save appears as a new food sample entry/log.
      const requestRes = await axios.post(
        `${API_URL}/lab-requests/`,
        {
          patient_id,
          lab_test_ids: resolvedTests.map((t) => Number(t.resolvedLabTestId)),
        },
        { headers }
      );
      const lab_request_id = requestRes.data.id;

      setRequestId(lab_request_id);
      setPatientId(patient_id);

      // 3️⃣ Save all lab results
      await Promise.all(
        resolvedTests.map((test) => {
          const lab_test_id = Number(test.resolvedLabTestId) || 0;
          return axios.post(
            `${API_URL}/lab-results/`,
            {
              patient_id,
              lab_request_id,
              lab_test_id,
              test_name: test.name,
              results: String(test.result ?? ""),
              unit: test.unit ?? "",
              ref_range: test.refRange ?? "",
              flag: test.flag ?? "",
              comment: test.comment ?? "",
            },
            { headers }
          );
        })
      );

      // 4️⃣ Refresh requests
      const res = await axios.get(`${API_URL}/lab-requests/`, {
        headers,
      });
      setRequests(res.data || []);

      setSnack({ open: true, message: `Food sample request #${lab_request_id} and results saved successfully ✅`, severity: "success" });
    } catch (err) {
      console.error("SAVE ERROR:", err.response?.data || err.message);
      setSnack({ open: true, message: `Save failed ❌: ${err.response?.data?.detail || err.message}`, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = async () => {
    const safeQuery = searchQuery.trim();
    if (!safeQuery) {
      setSnack({ open: true, message: "Enter client or contact name to search", severity: "warning" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setSnack({ open: true, message: "Not authenticated. Please login.", severity: "error" });
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      console.log("🔍 Searching for:", safeQuery);
      
      // 1️⃣ Search client record
      const patientRes = await axios.get(`${API_URL}/clients/search/`, { params: { query: safeQuery }, headers });

      console.log("✅ Search response:", patientRes.data);

      if (!Array.isArray(patientRes.data) || patientRes.data.length === 0) {
        setSnack({ open: true, message: "Client not found - you can create a new request", severity: "info" });
        return;
      }

      const patientItem = patientRes.data[0];

      // 2️⃣ Set client info FIRST
      setPatient({
        lastName: patientItem.last_name ?? "",
        firstName: patientItem.first_name ?? "",
        dob: patientItem.dob ?? "",
        gender: patientItem.gender ?? "",
        phone: patientItem.phone ?? "",
        email: patientItem.email ?? "",
        address: patientItem.address ?? "",
        funding: patientItem.funding ?? "CASH (ZWL)",
        memberNumber: patientItem.member_number ?? "",
        memberSuffix: patientItem.member_suffix ?? "",
        relationship: patientItem.relationship ?? "Self",
        principal: patientItem.principal ?? true,
        facility: patientItem.facility ?? "",
        doctorName: patientItem.doctor_name ?? "",
        ahFoz: patientItem.ah_foz ?? "",
        clinicalData: patientItem.clinical_data ?? "",
      });
      applyClinicalData(patientItem.clinical_data);
      setPatientId(patientItem.id);

      // 3️⃣ Fetch ALL lab requests
      const labReqRes = await axios.get(`${API_URL}/lab-requests/`, { params: { patient_id: patientItem.id }, headers });

      if (!Array.isArray(labReqRes.data) || labReqRes.data.length === 0) {
        // No lab requests yet — still valid
        setRequestId(null);
        setSelectedTests([]);
        setLabResults([]);
        setTab(0);
        return;
      }

      // Use most recent request
      const lastRequest = labReqRes.data.at(-1);

      setRequestId(lastRequest.id);
      setSelectedRequest(lastRequest);
      setSampleDate(lastRequest.sample_date ?? "");

      // 4️⃣ Fetch lab results for request
      const labResRes = await axios.get(`${API_URL}/lab-requests/${lastRequest.id}/results/`, { headers });

      const results = Array.isArray(labResRes.data) ? labResRes.data : [];

      setLabResults(results);

      // If the client has existing results, map them to selectedTests
      if (results.length > 0) {
        setSelectedTests(
          results.map((r) => ({
            id: r.lab_test_id,
            name: r.test_name,
            category: getTestCategory(r.test_name),
            result: r.results,
            unit: r.unit,
            refRange: r.ref_range,
            flag: r.flag,
            comment: r.comment,
          }))
        );
        // Navigate to Test Results tab since we have results
        setTab(2);
      } else {
        // No results yet, clear selectedTests and send to Test Request tab
        setSelectedTests([]);
        setTab(1); // Go to Test Request tab to select tests first
      }

      setSnack({ open: true, message: `Client found: ${patientItem.first_name} ${patientItem.last_name}`, severity: "success" });
    } catch (error) {
      console.error("❌ Search failed:", error);
      console.error("Response data:", error.response?.data);
      console.error("Response status:", error.response?.status);
      console.error("Error message:", error.message);
      
      // Provide specific error messages based on response
      let errorMsg = "Failed to retrieve client data";
      if (error.response?.status === 401) {
        errorMsg = "Authentication failed. Please login again.";
      } else if (error.response?.status === 422) {
        errorMsg = "Invalid search query. Please enter a valid name.";
      } else if (error.response?.data?.detail) {
        errorMsg = `Search error: ${error.response.data.detail}`;
      }
      
      setSnack({ open: true, message: errorMsg, severity: "error" });
    }
  };

  useEffect(() => {
    const requestIdFromState = location.state?.requestId;
    const targetTab = location.state?.targetTab;

    if (!requestIdFromState) return;

    loadRequestById(requestIdFromState, targetTab);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, loadRequestById, navigate]);

  const handleVerify = () => {
    if (!requestId) setRequestId(`BIO${dayjs().format("YYMMDDHHmmss")}`);
    setSnack({ open: true, message: `Request verified${requestId ? ` (${requestId})` : ""}`, severity: "info" });
  };

  const handleUpdate = async () => {
    if (!patientId) return setSnack({ open: true, message: "No client selected to update. Search and select a client first.", severity: "warning" });

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const headers = { Authorization: `Bearer ${token}` };

      // 1️⃣ Update client info
      await axios.put(
        `${API_URL}/clients/${patientId}`,
        {
          first_name: patient.firstName,
          last_name: patient.lastName,
          dob: patient.dob || null,
          gender: patient.gender || null,
          phone: patient.phone || null,
          email: patient.email || null,
          address: patient.address || null,
          funding: patient.funding || null,
          member_number: patient.memberNumber || null,
          member_suffix: patient.memberSuffix || null,
          relationship: patient.relationship || null,
          principal: patient.principal ?? true,
          facility: patient.facility || null,
          doctor_name: patient.doctorName || null,
          ah_foz: patient.ahFoz || null,
          clinical_data: patient.clinicalData || null,
        },
        { headers }
      );

      // 2️⃣ Update lab results if tests exist
      if (requestId && selectedTests.length > 0) {
        await Promise.all(
          selectedTests.map((test) =>
            axios.post(
              `${API_URL}/lab-results/`,
              {
                patient_id: patientId,
                lab_request_id: requestId,
                lab_test_id: Number(test.id),
                test_name: test.name,
                results: String(test.result ?? ""),
                unit: test.unit ?? "",
                ref_range: test.refRange ?? "",
                flag: test.flag ?? "",
                comment: test.comment ?? "",
              },
              { headers }
            )
          )
        );
      }

      // 3️⃣ Refresh requests for this patient
      const res = await axios.get(`${API_URL}/lab-requests/`, { params: { patient_id: patientId }, headers });
      setRequests(res.data || []);

      setSnack({ open: true, message: "Client details and food test results updated successfully ✅", severity: "success" });
    } catch (err) {
      console.error("Update failed:", err.response?.data || err.message);
      setSnack({ open: true, message: `Update failed ❌: ${err.response?.data?.detail || err.message}`, severity: "error" });
    }
  };

  return (
    <Box sx={{ p: 2, m: -8, background: pageBackground, minHeight: "100vh", maxWidth: 1200, mx: "auto" }}>
      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 3 }}>
        <RequestToolbar
          onNewRequest={handleNewRequest}
          onNewPatient={() => setSnack({ open: true, message: "Open New Client modal (not implemented)", severity: "info" })}
          onSave={handleSave}
          onSearch={handleSearch}
          onUpdate={handleUpdate}
          onDrop={handleNewRequest}
          onVerify={handleVerify}
          saving={saving}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </Paper>

      {/* Tabs + Logout */}
      <Paper sx={{ borderRadius: 2, boxShadow: 2, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Tabs
            value={tab}
            onChange={(e, v) => setTab(v)}
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Submission Form" />
            <Tab label="Food Test Selection" />
            <Tab label="Food Test Results" />
            <Tab label="View Results" />
            <Tab label="Authorise ▾" />
          </Tabs>

          <Button variant="outlined" color="error" sx={{ mr: 2 }} onClick={handleLogout}>
            Logout
          </Button>
        </Box>

        <Divider />

        <Box sx={{ p: 3 }}>
          {tab === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, boxShadow: 3, border: `1px solid ${borderColor}`, background: cardSurface }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 2, flexWrap: "wrap" }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: accentColor, letterSpacing: 0.8 }}>
                      CLIENT AND SUBMISSION INFORMATION
                    </Typography>
                    <Typography variant="body2" sx={{ color: mutedText, mt: 0.5 }}>
                      Laboratory submission request form designed for modern LIMS workflows.
                    </Typography>
                  </Box>
                  <Box sx={{ px: 1.5, py: 0.75, borderRadius: 2, background: isDarkMode ? "rgba(46,125,50,0.15)" : "#edf7ee", color: accentColor }}>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>Request ID: {requestId || "— pending —"}</Typography>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      label="Submitting Client / Organization"
                      fullWidth
                      {...register("submittingClient", { required: "Client / organization is required" })}
                      error={Boolean(errors.submittingClient)}
                      helperText={errors.submittingClient?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      label="Contact Person"
                      fullWidth
                      {...register("contactPerson", { required: "Contact person is required" })}
                      error={Boolean(errors.contactPerson)}
                      helperText={errors.contactPerson?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      label="Telephone / Email"
                      fullWidth
                      {...register("telephoneEmail", { required: "Telephone or email is required" })}
                      error={Boolean(errors.telephoneEmail)}
                      helperText={errors.telephoneEmail?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      label="Submission Date"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      {...register("submissionDate", { required: "Submission date is required" })}
                      error={Boolean(errors.submissionDate)}
                      helperText={errors.submissionDate?.message}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField label="Sampler" fullWidth {...register("sampler", { required: "Sampler is required" })} error={Boolean(errors.sampler)} helperText={errors.sampler?.message} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField label="Site / Sampling Location" fullWidth {...register("siteLocation", { required: "Sampling location is required" })} error={Boolean(errors.siteLocation)} helperText={errors.siteLocation?.message} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField label="Sampling Plan Reference" fullWidth {...register("samplingPlanReference")} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField label="Decision Rule" fullWidth {...register("decisionRule")} />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Job Reference Number (Unique Sample Identifier)"
                      fullWidth
                      {...register("labJobReference")}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField label="Samples Received By" fullWidth {...register("labReceivedBy")} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField label="Samples Submitted By" fullWidth {...register("labSubmittedBy")} />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <Controller
                      name="reportingFormat"
                      control={control}
                      defaultValue="Email"
                      render={({ field }) => (
                        <TextField {...field} select label="Reporting Format" fullWidth>
                          <MenuItem value="Email">Email</MenuItem>
                          <MenuItem value="PDF">PDF</MenuItem>
                          <MenuItem value="Printed Copy">Printed Copy</MenuItem>
                          <MenuItem value="Email + PDF">Email + PDF</MenuItem>
                          <MenuItem value="Email + Printed">Email + Printed</MenuItem>
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField label="TAT Requested (Working Days)" type="number" fullWidth {...register("tatRequested")} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ border: `1px solid ${borderColor}`, borderRadius: 2, p: 1.5, background: isDarkMode ? "rgba(255,255,255,0.03)" : "#fcfdfc" }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: textColor }}>
                        Sub-contracting Consent
                      </Typography>
                      <Controller
                        name="subContractingConsent"
                        control={control}
                        defaultValue="Yes"
                        render={({ field }) => (
                          <RadioGroup row {...field}>
                            <FormControlLabel value="Yes" control={<Radio color="success" />} label="Yes" />
                            <FormControlLabel value="No" control={<Radio color="success" />} label="No" />
                          </RadioGroup>
                        )}
                      />
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField label="Authorized Signatory" fullWidth {...register("authorizedSignatory")} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField label="Designation" fullWidth {...register("designation")} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField label="Signature" fullWidth placeholder="Signature placeholder" {...register("signature")} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register("signatureDate")} />
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, boxShadow: 3, border: `1px solid ${borderColor}`, background: cardSurface }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: accentColor }}>
                    SAMPLE INVENTORY
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button variant="contained" startIcon={<AddCircleOutline />} onClick={handleAddSample} sx={{ backgroundColor: accentColor, '&:hover': { backgroundColor: '#256b2a' } }}>
                      + Add Sample
                    </Button>
                    <Button variant="outlined" color="error" startIcon={<DeleteOutline />} onClick={() => handleDeleteSample(samples.length - 1)}>
                      Delete Sample
                    </Button>
                    <Button variant="outlined" startIcon={<ContentCopy />} onClick={() => handleDuplicateSample(samples.length - 1)}>
                      Duplicate Sample
                    </Button>
                  </Stack>
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Sample Number</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Sample Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Sample ID (Lab Use)</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Matrix / Category</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Sampling Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Storage Condition</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Quantity / Packaging</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Special Instructions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {samples.map((sample, index) => (
                        <TableRow key={sample.id} hover>
                          <TableCell>{sample.sampleNumber}</TableCell>
                          <TableCell>
                            <TextField size="small" fullWidth value={sample.sampleName} onChange={(event) => handleSampleFieldChange(index, "sampleName", event.target.value)} />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" fullWidth value={sample.sampleId} onChange={(event) => handleSampleFieldChange(index, "sampleId", event.target.value)} />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" fullWidth value={sample.matrix} onChange={(event) => handleSampleFieldChange(index, "matrix", event.target.value)} />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" fullWidth value={sample.type} onChange={(event) => handleSampleFieldChange(index, "type", event.target.value)} />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" type="date" InputLabelProps={{ shrink: true }} fullWidth value={sample.samplingDate} onChange={(event) => handleSampleFieldChange(index, "samplingDate", event.target.value)} />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" fullWidth value={sample.storageCondition} onChange={(event) => handleSampleFieldChange(index, "storageCondition", event.target.value)} />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" fullWidth value={sample.quantityPackaging} onChange={(event) => handleSampleFieldChange(index, "quantityPackaging", event.target.value)} />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" fullWidth value={sample.specialInstructions} onChange={(event) => handleSampleFieldChange(index, "specialInstructions", event.target.value)} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              <Box sx={{ position: "sticky", bottom: 16, display: "flex", justifyContent: "flex-end", zIndex: 4 }}>
                <Button variant="contained" size="large" startIcon={<Verified />} onClick={handleSave} disabled={saving} sx={{ borderRadius: 999, px: 3, backgroundColor: accentColor, '&:hover': { backgroundColor: '#256b2a' } }}>
                  {saving ? "Saving..." : "Save Request"}
                </Button>
              </Box>
            </Box>
          )}

            {tab === 1 && <FoodSafetyTestRequest selectedTests={selectedTests} setSelectedTests={setSelectedTests} sampleCount={samples.length} />}
            {tab === 2 && <FoodTestResults selectedTests={selectedTests} setSelectedTests={setSelectedTests} />}
            {tab === 3 && <ViewResults patient={patient} selectedTests={selectedTests} labResults={labResults} submissionForm={getValues()} samples={samples} labScientist="MR CHONZI" requestId={requestId} sampleDate={sampleDate} />}
            {tab === 4 && (
              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <Button variant="contained" startIcon={<VerifiedIcon />} onClick={() => setSnack({ open: true, message: "Authorise as Doctor (not implemented)", severity: "info" })}>
                  Authorise (Doctor)
                </Button>
                <Button variant="outlined" onClick={() => setSnack({ open: true, message: "Authorise as Lab Admin (not implemented)", severity: "info" })}>
                  Authorise (Lab Admin)
                </Button>
              </Box>
            )}
          </Box>
      </Paper>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NewRequestPage;


