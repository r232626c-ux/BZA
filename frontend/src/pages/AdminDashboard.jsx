// src/pages/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { Grid, Paper, Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { People, Settings, Assignment, LocalHospital } from "@mui/icons-material";
import DashboardLayout from "../components/DashboardLayout";
import axios from "axios";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    labTechs: 0,
    doctors: 0,
    totalRequests: 0,
  });

  const navigate = useNavigate();
  const API_URL = "http://127.0.0.1:8000"; // Your backend URL

  // Fetch stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStats(res.data); // Expect { users, labTechs, doctors, totalRequests }
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  // Card configuration
  const cards = [
    {
      label: "User Settings",
      value: stats.users,
      color: "#ffe082",
      icon: <Settings fontSize="large" />,
      route: "/admin/settings",
    },
    {
      label: "Patients Records",
      value: stats.totalRequests,
      color: "#ffd54f",
      icon: <People fontSize="large" />,
      route: "/admin/patients",
    },
    {
      label: "Doctors",
      value: stats.doctors,
      color: "#ffca28",
      icon: <LocalHospital fontSize="large" />,
      route: "/admin/doctors",
    },
    {
      label: "Lab Requests",
      value: stats.totalRequests,
      color: "#ffc107",
      icon: <Assignment fontSize="large" />,
      route: "/admin/lab-requests",
    },
  ];

  return (
    <DashboardLayout role="admin">
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, Admin
        </Typography>
        <Button variant="outlined" color="error" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Paper
              sx={{
                p: 2,
                bgcolor: card.color,
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "scale(1.05)",
                  boxShadow: 6,
                },
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
              onClick={() => navigate(card.route)}
            >
              <Box sx={{ mb: 1 }}>{card.icon}</Box>
              <Typography variant="h6">{card.label}</Typography>
              <Typography variant="h4">{card.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </DashboardLayout>
  );
}
