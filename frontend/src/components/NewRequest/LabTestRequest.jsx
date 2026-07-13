import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Grid,
  Checkbox,
  FormControlLabel,
  Divider,
  TextField,
  Box,
  Button,
  MenuItem,
} from "@mui/material";
import axios from "axios";

const API = "http://127.0.0.1:8000";

const LabTestRequest = ({ selectedTests, setSelectedTests }) => {
  const [labTests, setLabTests] = useState({});
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [newTestName, setNewTestName] = useState("");
  const [newTestCategory, setNewTestCategory] = useState("");

  // ==================================================
  // FETCH LAB TESTS
  // ==================================================
  useEffect(() => {
    const fetchLabTests = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/lab-tests`);

        const grouped = res.data.reduce((acc, test) => {
          if (!acc[test.category]) acc[test.category] = [];
          acc[test.category].push(test);
          return acc;
        }, {});

        setLabTests(grouped);
        setAllCategories(Object.keys(grouped));
      } catch (err) {
        console.error("Error fetching lab tests", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLabTests();
  }, []);

  // ==================================================
  // TEST TOGGLE
  // ==================================================
  const toggleTest = (test) => {
    const exists = selectedTests.some((t) => t.id === test.id);

    setSelectedTests((prev) =>
      exists ? prev.filter((t) => t.id !== test.id) : [...prev, test]
    );
  };

  // ==================================================
  // CATEGORY TOGGLE
  // ==================================================
  const allSelected = (tests) =>
    tests.every((t) => selectedTests.some((s) => s.id === t.id));

  const someSelected = (tests) =>
    tests.some((t) => selectedTests.some((s) => s.id === t.id));

  const toggleCategory = (tests) => {
    if (allSelected(tests)) {
      setSelectedTests((prev) =>
        prev.filter((t) => !tests.some((ct) => ct.id === t.id))
      );
    } else {
      setSelectedTests((prev) => {
        const missing = tests.filter(
          (t) => !prev.some((p) => p.id === t.id)
        );
        return [...prev, ...missing];
      });
    }
  };

  // ==================================================
  // ADD NEW TEST
  // ==================================================
  const handleAddTest = async () => {
    if (!newTestName || !newTestCategory) {
      alert("Fill all fields");
      return;
    }

    try {
      const res = await axios.post(`${API}/lab-tests/add`, {
        name: newTestName,
        category: newTestCategory,
      });

      const saved = res.data;

      setLabTests((prev) => ({
        ...prev,
        [newTestCategory]: prev[newTestCategory]
          ? [...prev[newTestCategory], saved]
          : [saved],
      }));

      if (!allCategories.includes(newTestCategory)) {
        setAllCategories((prev) => [...prev, newTestCategory]);
      }

      setNewTestName("");
      setNewTestCategory("");
    } catch {
      alert("Error saving test");
    }
  };

  // ==================================================
  // SEARCH FILTER
  // ==================================================
  const filteredTests = Object.values(labTests)
    .flat()
    .filter((t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // ==================================================
  // RENDER
  // ==================================================
  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      {/* SEARCH */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search lab tests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Box>

      {/* ADD NEW TEST */}
      <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
        <TextField
          label="New Test Name"
          size="small"
          value={newTestName}
          onChange={(e) => setNewTestName(e.target.value)}
        />

        <TextField
          select
          label="Category"
          size="small"
          sx={{ minWidth: 180 }}
          value={newTestCategory}
          onChange={(e) => setNewTestCategory(e.target.value)}
        >
          {allCategories.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
          <MenuItem value="Other">Other (New Category)</MenuItem>
        </TextField>

        <Button variant="contained" onClick={handleAddTest}>
          Add Test
        </Button>
      </Box>

      {loading && <Typography>Loading lab tests…</Typography>}

      {/* SEARCH MODE */}
      {searchTerm ? (
        filteredTests.map((test) => (
          <FormControlLabel
            key={test.id}
            control={
              <Checkbox
                checked={selectedTests.some((t) => t.id === test.id)}
                onChange={() => toggleTest(test)}
              />
            }
            label={`${test.name} (${test.category})`}
          />
        ))
      ) : (
        /* CATEGORY MODE */
        Object.entries(labTests).map(([category, tests]) => (
          <Box key={category} sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={allSelected(tests)}
                  indeterminate={someSelected(tests) && !allSelected(tests)}
                  onChange={() => toggleCategory(tests)}
                />
              }
              label={
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {category}
                </Typography>
              }
            />

            <Divider sx={{ mb: 1 }} />

            <Grid container spacing={1}>
              {tests.map((test) => (
                <Grid item xs={12} md={4} key={test.id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedTests.some(
                          (t) => t.id === test.id
                        )}
                        onChange={() => toggleTest(test)}
                      />
                    }
                    label={test.name}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}
    </Paper>
  );
};

export default LabTestRequest;
