import { useState } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import PasswordReset from "./PasswordReset";

export default function Login() {
  // ======================
  // STATE
  // ======================
  const [showReset, setShowReset] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

  // ======================
  // LOGIN
  // ======================
  const handleLogin = async () => {
    try {
      setMessage("");
      
      // Validation
      if (!username.trim() || !password.trim()) {
        setMessage("Please enter both username and password");
        return;
      }

      setIsLoading(true);
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const { data } = await axios.post(`${API_URL}/token`, formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (!data.access_token) {
        setMessage("Authentication failed");
        setIsLoading(false);
        return;
      }

      // Persist token and user info
      localStorage.setItem("token", data.access_token);
      const user = { username: data.username, role: data.role };
      localStorage.setItem("user", JSON.stringify(user));

      const recentLogins = JSON.parse(localStorage.getItem("recent_users") || "[]");
      const nextRecentLogins = [
        { ...user, lastLogin: new Date().toISOString() },
        ...recentLogins.filter((entry) => entry.username !== user.username),
      ].slice(0, 10);
      localStorage.setItem("recent_users", JSON.stringify(nextRecentLogins));

      // Role-based navigation
      switch (user.role) {
        case "Admin":
        case "labtech":
        case "doctor":
          navigate("/dashboard/lab");
          break;
        default:
          navigate("/dashboard/lab");
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      setMessage(
        Array.isArray(detail)
          ? detail.map((d) => d.msg).join(", ")
          : detail?.msg || "Invalid username or password"
      );
      setIsLoading(false);
    }
  };

  // ======================
  // CONDITIONAL VIEWS
  // ======================
  if (showReset) return <PasswordReset onBack={() => setShowReset(false)} />;

  // ======================
  // UI
  // ======================
  return (
    <Container maxWidth="sm" sx={{ mt: 10, mb: 10 }}>
      <Paper sx={{ p: 4, boxShadow: 3 }}>
        <Typography variant="h5" textAlign="center" gutterBottom>
          Biozone Analytics (BZA)
        </Typography>
        
        <Typography variant="body2" textAlign="center" sx={{ mb: 3, color: "text.secondary" }}>
          Login to your account
        </Typography>

        <TextField
          label="Username"
          fullWidth
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleLogin()}
        />

        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleLogin()}
        />

        <Button 
          fullWidth 
          variant="contained" 
          sx={{ mt: 3 }} 
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </Button>

        <Typography textAlign="center" sx={{ mt: 2 }}>
          <Button size="small" onClick={() => setShowReset(true)}>
            Forgot Password?
          </Button>
        </Typography>

        {message && (
          <Typography color="error" textAlign="center" sx={{ mt: 2 }}>
            {message}
          </Typography>
        )}
        
      </Paper>
    </Container>
  );
}
