import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Divider,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Email as EmailIcon,
  Event as EventIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";

const BIOZONEEmails = () => {
  const [emails, setEmails] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [openAppointmentDialog, setOpenAppointmentDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState("emails"); // "emails" or "appointments"
  const [snackbar, setSnackbar] = useState({ open: false, message: "", type: "success" });

  // Email form state
  const [emailForm, setEmailForm] = useState({
    recipient: "",
    subject: "",
    message: "",
  });

  // Appointment form state
  const [appointmentForm, setAppointmentForm] = useState({
    patientName: "",
    patientEmail: "",
    appointmentDate: "",
    appointmentTime: "",
    doctor: "",
    type: "Lab Test",
    notes: "",
  });

  const token = localStorage.getItem("token");

  // Fetch emails
  useEffect(() => {
    fetchEmails();
    fetchAppointments();
  }, []);

  const fetchEmails = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/emails/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmails(response.data || []);
    } catch (error) {
      console.error("Failed to fetch emails:", error);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/appointments/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(response.data || []);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      setAppointments([]);
    }
  };

  // Send email
  const handleSendEmail = async () => {
    if (!emailForm.recipient || !emailForm.subject || !emailForm.message) {
      setSnackbar({ open: true, message: "Please fill all email fields", type: "error" });
      return;
    }

    try {
      await axios.post(
        "http://127.0.0.1:8000/api/emails/send/",
        emailForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ open: true, message: "Email sent successfully!", type: "success" });
      setEmailForm({ recipient: "", subject: "", message: "" });
      setOpenEmailDialog(false);
      fetchEmails();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || "Failed to send email",
        type: "error",
      });
    }
  };

  // Schedule appointment
  const handleScheduleAppointment = async () => {
    if (
      !appointmentForm.patientName ||
      !appointmentForm.patientEmail ||
      !appointmentForm.appointmentDate ||
      !appointmentForm.appointmentTime
    ) {
      setSnackbar({
        open: true,
        message: "Please fill all appointment fields",
        type: "error",
      });
      return;
    }

    try {
      const appointmentDateTime = `${appointmentForm.appointmentDate}T${appointmentForm.appointmentTime}`;

      await axios.post(
        "http://127.0.0.1:8000/api/appointments/schedule/",
        {
          patient_name: appointmentForm.patientName,
          patient_email: appointmentForm.patientEmail,
          appointment_datetime: appointmentDateTime,
          doctor: appointmentForm.doctor,
          type: appointmentForm.type,
          notes: appointmentForm.notes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSnackbar({
        open: true,
        message: "Appointment scheduled successfully!",
        type: "success",
      });
      setAppointmentForm({
        patientName: "",
        patientEmail: "",
        appointmentDate: "",
        appointmentTime: "",
        doctor: "",
        type: "Lab Test",
        notes: "",
      });
      setOpenAppointmentDialog(false);
      fetchAppointments();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || "Failed to schedule appointment",
        type: "error",
      });
    }
  };

  // Delete appointment
  const handleDeleteAppointment = async (appointmentId) => {
    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/appointments/${appointmentId}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ open: true, message: "Appointment cancelled", type: "success" });
      fetchAppointments();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to cancel appointment",
        type: "error",
      });
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        BIOZONE Emails & Appointments
      </Typography>

      {/* Tab buttons */}
      <Box sx={{ mb: 3, display: "flex", gap: 1 }}>
        <Button
          variant={selectedTab === "emails" ? "contained" : "outlined"}
          startIcon={<EmailIcon />}
          onClick={() => setSelectedTab("emails")}
        >
          Emails
        </Button>
        <Button
          variant={selectedTab === "appointments" ? "contained" : "outlined"}
          startIcon={<EventIcon />}
          onClick={() => setSelectedTab("appointments")}
        >
          Appointments
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* EMAILS TAB */}
      {selectedTab === "emails" && (
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EmailIcon />}
            onClick={() => setOpenEmailDialog(true)}
            sx={{ mb: 2 }}
          >
            Send Email
          </Button>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell><strong>Recipient</strong></TableCell>
                  <TableCell><strong>Subject</strong></TableCell>
                  <TableCell><strong>Date Sent</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {emails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <Typography color="textSecondary">No emails sent yet</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  emails.map((email) => (
                    <TableRow key={email.id} hover>
                      <TableCell>{email.recipient}</TableCell>
                      <TableCell>{email.subject}</TableCell>
                      <TableCell>{new Date(email.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            color: email.status === "sent" ? "green" : "orange",
                            fontWeight: "bold",
                          }}
                        >
                          {email.status || "Sent"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* APPOINTMENTS TAB */}
      {selectedTab === "appointments" && (
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EventIcon />}
            onClick={() => setOpenAppointmentDialog(true)}
            sx={{ mb: 2 }}
          >
            Schedule Appointment
          </Button>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell><strong>Patient</strong></TableCell>
                  <TableCell><strong>Date & Time</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Doctor</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography color="textSecondary">No appointments scheduled</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  appointments.map((appointment) => (
                    <TableRow key={appointment.id} hover>
                      <TableCell>{appointment.patient_name}</TableCell>
                      <TableCell>
                        {new Date(appointment.appointment_datetime).toLocaleString()}
                      </TableCell>
                      <TableCell>{appointment.type}</TableCell>
                      <TableCell>{appointment.doctor || "—"}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteAppointment(appointment.id)}
                        >
                          Cancel
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* SEND EMAIL DIALOG */}
      <Dialog open={openEmailDialog} onClose={() => setOpenEmailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Email</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Recipient Email"
            type="email"
            value={emailForm.recipient}
            onChange={(e) => setEmailForm({ ...emailForm, recipient: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Subject"
            value={emailForm.subject}
            onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Message"
            multiline
            rows={4}
            value={emailForm.message}
            onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEmailDialog(false)}>Cancel</Button>
          <Button onClick={handleSendEmail} variant="contained">
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* SCHEDULE APPOINTMENT DIALOG */}
      <Dialog
        open={openAppointmentDialog}
        onClose={() => setOpenAppointmentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Schedule Appointment</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Patient Name"
            value={appointmentForm.patientName}
            onChange={(e) =>
              setAppointmentForm({ ...appointmentForm, patientName: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Patient Email"
            type="email"
            value={appointmentForm.patientEmail}
            onChange={(e) =>
              setAppointmentForm({ ...appointmentForm, patientEmail: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Appointment Date"
            type="date"
            value={appointmentForm.appointmentDate}
            onChange={(e) =>
              setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Appointment Time"
            type="time"
            value={appointmentForm.appointmentTime}
            onChange={(e) =>
              setAppointmentForm({ ...appointmentForm, appointmentTime: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Doctor (Optional)"
            value={appointmentForm.doctor}
            onChange={(e) => setAppointmentForm({ ...appointmentForm, doctor: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Appointment Type</InputLabel>
            <Select
              value={appointmentForm.type}
              onChange={(e) => setAppointmentForm({ ...appointmentForm, type: e.target.value })}
            >
              <MenuItem value="Lab Test">Lab Test</MenuItem>
              <MenuItem value="Consultation">Consultation</MenuItem>
              <MenuItem value="Follow-up">Follow-up</MenuItem>
              <MenuItem value="Physical">Physical</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={3}
            value={appointmentForm.notes}
            onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAppointmentDialog(false)}>Cancel</Button>
          <Button onClick={handleScheduleAppointment} variant="contained">
            Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert severity={snackbar.type} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BIOZONEEmails;
