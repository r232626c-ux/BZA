import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";

const STORAGE_KEY = "medicalAidClaims";

const medicalAidOptions = [
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

const defaultClaimForm = {
  patientName: "",
  medicalAid: "",
  memberNumber: "",
  memberSuffix: "",
  claimAmount: "",
  claimDate: new Date().toISOString().slice(0, 10),
  notes: "",
  medicalAidStatus: "Used First",
  pathologyRequest: "",
};

const demoPatients = [
  {
    id: 1,
    initials: "Mr",
    funder: "Discovery Health",
    first_name: "John",
    last_name: "Smith",
    option: "",
    suffix: "A",
    gender: "Male",
    title: "Mr",
    dob: "1985-03-12",
    id_number: "8503125123080",
    membership_status: "Active",
    enrolment_status: "Active",
    member_number: "D10001",
    member_suffix: "A",
  },
  {
    id: 2,
    initials: "Ms",
    funder: "GEMS",
    first_name: "Sarah",
    last_name: "Mokoena",
    option: "",
    suffix: "B",
    gender: "Female",
    title: "Ms",
    dob: "1990-11-04",
    id_number: "9001040450083",
    membership_status: "Active",
    enrolment_status: "Pending",
    member_number: "G20002",
    member_suffix: "B",
  },
];

const MedicalAidClaims = () => {
  const [claims, setClaims] = useState([]);
  const [activeTab, setActiveTab] = useState("capture");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", type: "success" });
  const [lookupForm, setLookupForm] = useState({
    funder: "",
    lookupType: "memberNumber",
    memberNumber: "",
    suffix: "",
    patientName: "",
  });
  const [lookupState, setLookupState] = useState("idle");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [claimForm, setClaimForm] = useState(defaultClaimForm);
  const [linkForm, setLinkForm] = useState({ claimId: "", pathologyRequest: "" });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setClaims(JSON.parse(stored));
      } catch {
        setClaims([]);
      }
    }
  }, []);

  const saveClaims = (newClaims) => {
    setClaims(newClaims);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newClaims));
    } catch (err) {
      console.error("Failed to persist claims", err);
    }
  };

  const showSnackbar = (message, type = "success") => {
    setSnackbar({ open: true, message, type });
  };

  const handleLookupChange = (e) => {
    const { name, value } = e.target;
    setLookupForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildPatientLookup = async () => {
    const trimmed = lookupForm.lookupType === "memberNumber"
      ? lookupForm.memberNumber.trim()
      : lookupForm.lookupType === "idNumber"
        ? lookupForm.patientName.trim()
        : lookupForm.patientName.trim();

    if (!trimmed) {
      showSnackbar("Please enter a lookup value before searching.", "error");
      return;
    }

    setLookupLoading(true);
    setLookupState("searching");
    try {
      let matches = [];
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/clients/search/?query=${encodeURIComponent(trimmed)}&lookup_type=${encodeURIComponent(lookupForm.lookupType)}&funder=${encodeURIComponent(lookupForm.funder || "")}&suffix=${encodeURIComponent(lookupForm.suffix || "")}`
        );
        if (response.ok) {
          const backendPatients = await response.json();
          matches = backendPatients.map((patient) => ({
            id: patient.id,
            initials: patient.initials || "",
            funder: patient.funding || lookupForm.funder || "",
            first_name: patient.first_name || "",
            last_name: patient.last_name || "",
            option: patient.option || "",
            suffix: patient.member_suffix || lookupForm.suffix || "",
            gender: patient.gender || "",
            title: patient.title || "",
            dob: patient.dob || "",
            id_number: patient.id_number || "",
            membership_status: patient.membership_status || "",
            enrolment_status: patient.enrolment_status || "",
            member_number: patient.member_number || lookupForm.memberNumber || "",
            member_suffix: patient.member_suffix || lookupForm.suffix || "",
          }));
        }
      } catch (err) {
        console.error("Patient lookup failed", err);
      }

      if (!matches.length) {
        matches = demoPatients.filter((patient) => {
          if (lookupForm.lookupType === "memberNumber") {
            return patient.member_number?.toLowerCase().includes(trimmed.toLowerCase());
          }
          if (lookupForm.lookupType === "idNumber") {
            return patient.id_number?.toLowerCase().includes(trimmed.toLowerCase());
          }
          return `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(trimmed.toLowerCase());
        });
      }

      if (!matches.length) {
        setSelectedPatient(null);
        setLookupState("not-found");
        showSnackbar("No matching beneficiary was found.", "error");
        return;
      }

      const matchedPatient = matches[0];
      setSelectedPatient(matchedPatient);
      setLookupState("found");
      setClaimForm((prev) => ({
        ...prev,
        patientName: `${matchedPatient.first_name} ${matchedPatient.last_name}`,
        medicalAid: matchedPatient.funder || lookupForm.funder,
        memberNumber: matchedPatient.member_number || lookupForm.memberNumber,
        memberSuffix: matchedPatient.member_suffix || lookupForm.suffix,
      }));
      showSnackbar(`Beneficiary found: ${matchedPatient.first_name} ${matchedPatient.last_name}`, "success");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleConfirmBeneficiary = (confirmed) => {
    if (!selectedPatient) {
      return;
    }

    if (!confirmed) {
      setSelectedPatient(null);
      setLookupState("idle");
      showSnackbar("Lookup cancelled. Please search again.", "info");
      return;
    }

    setActiveTab("capture");
    showSnackbar("Beneficiary confirmed. Please complete the claim capture.", "success");
  };

  const handleCaptureClaim = () => {
    if (!selectedPatient) {
      showSnackbar("Please verify a beneficiary before capturing a claim.", "error");
      return;
    }

    if (!claimForm.claimAmount || !claimForm.medicalAid || !claimForm.memberNumber) {
      showSnackbar("Please complete the claim amount, funder and member number before submitting.", "error");
      return;
    }

    const newClaim = {
      id: Date.now(),
      ...claimForm,
      beneficiary: selectedPatient,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    saveClaims([newClaim, ...claims]);
    showSnackbar("Claim captured successfully.", "success");
    setClaimForm({ ...defaultClaimForm, medicalAid: claimForm.medicalAid, memberNumber: claimForm.memberNumber, memberSuffix: claimForm.memberSuffix });
    setSelectedPatient(null);
    setLookupForm((prev) => ({ ...prev, memberNumber: "", suffix: "", patientName: "" }));
    setLookupState("idle");
    setActiveTab("past");
  };

  const handleLinkPathology = () => {
    if (!linkForm.claimId || !linkForm.pathologyRequest) {
      showSnackbar("Select a claim and enter a pathology request number.", "error");
      return;
    }

    const updatedClaims = claims.map((claim) =>
      claim.id === Number(linkForm.claimId)
        ? { ...claim, pathologyRequest: linkForm.pathologyRequest }
        : claim
    );

    saveClaims(updatedClaims);
    setLinkForm({ claimId: "", pathologyRequest: "" });
    showSnackbar("Pathology request linked to the claim.", "success");
  };

  const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const summaryCards = useMemo(() => [
    { label: "Captured Claims", value: claims.length },
    { label: "Linked Pathology Requests", value: claims.filter((claim) => claim.pathologyRequest).length },
  ], [claims]);

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            Medical Aid Claims
          </Typography>
          <Typography color="text.secondary">
            Capture a claim, review past claims, and link pathology requests from one place.
          </Typography>
        </Box>
        <Chip icon={<LocalAtmIcon />} label="Claim workflow" color="primary" variant="outlined" />
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} key={card.label}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">{card.label}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{card.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab value="capture" label="Capture Claim" />
          <Tab value="past" label="Past Claims" />
          <Tab value="link" label="Link Pathology Request" />
        </Tabs>
      </Paper>

      {activeTab === "capture" && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Find the patient first</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Funder"
                      name="funder"
                      value={lookupForm.funder}
                      onChange={handleLookupChange}
                    >
                      {medicalAidOptions.map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Lookup Type"
                      name="lookupType"
                      value={lookupForm.lookupType}
                      onChange={handleLookupChange}
                    >
                      <MenuItem value="memberNumber">Member Number</MenuItem>
                      <MenuItem value="surname">Surname</MenuItem>
                      <MenuItem value="idNumber">ID Number</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={lookupForm.lookupType === "memberNumber" ? "Member Number" : lookupForm.lookupType === "idNumber" ? "ID Number" : "Patient Surname"}
                      name="memberNumber"
                      value={lookupForm.memberNumber}
                      onChange={handleLookupChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Suffix"
                      name="suffix"
                      value={lookupForm.suffix}
                      onChange={handleLookupChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button variant="contained" onClick={buildPatientLookup} disabled={lookupLoading}>
                      {lookupLoading ? "Looking up..." : "Lookup"}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            {lookupState === "found" && selectedPatient ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Beneficiary details</Typography>
                  <Grid container spacing={2}>
                    {[
                      ["Member details", selectedPatient.initials || ""],
                      ["Initials", selectedPatient.initials || ""],
                      ["Funder", selectedPatient.funder || ""],
                      ["First name", selectedPatient.first_name || ""],
                      ["Surname", selectedPatient.last_name || ""],
                      ["Option", selectedPatient.option || ""],
                      ["Suffix", selectedPatient.suffix || ""],
                      ["Gender", selectedPatient.gender || ""],
                      ["Title", selectedPatient.title || ""],
                      ["DOB", selectedPatient.dob || ""],
                      ["ID number", selectedPatient.id_number || ""],
                      ["Membership status", selectedPatient.membership_status || ""],
                      ["Enrolment status", selectedPatient.enrolment_status || ""],
                    ].map(([label, value]) => (
                      <Grid item xs={12} sm={6} key={label}>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Typography variant="body1">{value || "—"}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                  <Typography sx={{ mb: 2, fontWeight: 600 }}>Is this the correct beneficiary?</Typography>
                  <Stack direction="row" spacing={2}>
                    <Button variant="contained" color="success" onClick={() => handleConfirmBeneficiary(true)}>
                      Yes
                    </Button>
                    <Button variant="outlined" color="error" onClick={() => handleConfirmBeneficiary(false)}>
                      No
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ) : lookupState === "not-found" ? (
              <Card>
                <CardContent>
                  <Typography color="error">No matching beneficiary found. Please review the lookup details and try again.</Typography>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Lookup a beneficiary first to continue with claim capture.</Typography>
                </CardContent>
              </Card>
            )}
          </Grid>

          {selectedPatient && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Capture claim</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Patient Name" value={claimForm.patientName} disabled />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        label="Funder"
                        value={claimForm.medicalAid}
                        onChange={(e) => setClaimForm((prev) => ({ ...prev, medicalAid: e.target.value }))}
                      >
                        {medicalAidOptions.map((option) => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Member Number"
                        value={claimForm.memberNumber}
                        onChange={(e) => setClaimForm((prev) => ({ ...prev, memberNumber: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Suffix"
                        value={claimForm.memberSuffix}
                        onChange={(e) => setClaimForm((prev) => ({ ...prev, memberSuffix: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Claim Amount"
                        value={claimForm.claimAmount}
                        onChange={(e) => setClaimForm((prev) => ({ ...prev, claimAmount: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Claim Date"
                        type="date"
                        value={claimForm.claimDate}
                        onChange={(e) => setClaimForm((prev) => ({ ...prev, claimDate: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        label="Medical Aid Status"
                        value={claimForm.medicalAidStatus}
                        onChange={(e) => setClaimForm((prev) => ({ ...prev, medicalAidStatus: e.target.value }))}
                      >
                        <MenuItem value="Terminated">Terminated</MenuItem>
                        <MenuItem value="Exhausted">Exhausted</MenuItem>
                        <MenuItem value="Used First">Used First</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Pathology Request"
                        value={claimForm.pathologyRequest}
                        onChange={(e) => setClaimForm((prev) => ({ ...prev, pathologyRequest: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        label="Notes"
                        value={claimForm.notes}
                        onChange={(e) => setClaimForm((prev) => ({ ...prev, notes: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button variant="contained" onClick={handleCaptureClaim}>
                        Capture claim
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {activeTab === "past" && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Past claims</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Beneficiary</TableCell>
                    <TableCell>Funder</TableCell>
                    <TableCell>Member #</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Pathology</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {claims.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary">No claims captured yet.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    claims.map((claim) => (
                      <TableRow key={claim.id} hover>
                        <TableCell>{claim.claimDate}</TableCell>
                        <TableCell>{claim.patientName}</TableCell>
                        <TableCell>{claim.medicalAid}</TableCell>
                        <TableCell>{claim.memberNumber}</TableCell>
                        <TableCell>{claim.claimAmount}</TableCell>
                        <TableCell>{claim.status}</TableCell>
                        <TableCell>{claim.pathologyRequest || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === "link" && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Link pathology request</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Claim"
                  value={linkForm.claimId}
                  onChange={(e) => setLinkForm((prev) => ({ ...prev, claimId: e.target.value }))}
                >
                  {claims.map((claim) => (
                    <MenuItem key={claim.id} value={claim.id}>{claim.patientName} — {claim.memberNumber}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Pathology Request Number"
                  value={linkForm.pathologyRequest}
                  onChange={(e) => setLinkForm((prev) => ({ ...prev, pathologyRequest: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" onClick={handleLinkPathology}>
                  Link request
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.type} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MedicalAidClaims;
