import React from "react";
import {
  Alert,
  Box,
  Divider,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  Typography,
} from "@mui/material";

const FoodTestResults = ({ selectedTests = [], setSelectedTests = () => {} }) => {
  const [activeCategoryTab, setActiveCategoryTab] = React.useState(0);

  const resolveCategoryCode = (category = "") => {
    const raw = String(category || "").trim();
    const upper = raw.toUpperCase();
    const codeMatch = upper.match(/^D(\d+)\b/);
    if (codeMatch) {
      return `D${codeMatch[1]}`;
    }

    if (upper.includes("MICROBIOLOGY")) return "D1";
    if (upper.includes("CHEMISTRY") || upper.includes("NUTRITION") || upper.includes("QUALITY")) return "D2";
    if (upper.includes("ALLERGEN")) return "D3";
    if (upper.includes("MYCOTOXIN")) return "D4";
    if (upper.includes("HEAVY METAL")) return "D5";
    if (upper.includes("GMO")) return "D6";
    if (upper.includes("MEAT") || upper.includes("SPECIES")) return "D7";
    if (upper.includes("WATER")) return "D8";

    return "OTHER";
  };

  const updateTest = (testId, field, value) => {
    setSelectedTests((prev) =>
      prev.map((test) => (test.id === testId ? { ...test, [field]: value } : test))
    );
  };

  const getCategoryConfig = (category = "") => {
    const code = String(category).toUpperCase();
    if (code === "D1") {
      return {
        title: "Microbiology Parameters",
        columns: [
          { key: "parameter", label: "Microbiology Parameter", type: "text" },
          { key: "unit", label: "Unit", type: "text" },
          { key: "result", label: "Result", type: "text" },
        ],
      };
    }

    if (code === "D2") {
      return {
        title: "Chemical Parameters",
        columns: [
          { key: "parameter", label: "Chemical Parameter", type: "text" },
          { key: "unit", label: "Unit", type: "text" },
          { key: "result", label: "Result", type: "text" },
          { key: "permissibleLimit", label: "Permissible Limit", type: "text" },
          { key: "compliance", label: "Compliance", type: "select" },
        ],
      };
    }

    if (code === "D8") {
      return {
        title: "Chemical Parameters",
        columns: [
          { key: "parameter", label: "Parameter", type: "text" },
          { key: "unit", label: "Unit", type: "text" },
          { key: "result", label: "Result", type: "text" },
          { key: "permissibleLimit", label: "Permissible Limit", type: "text" },
          { key: "compliance", label: "Compliance", type: "select" },
        ],
      };
    }

    if (code === "D3") {
      return {
        title: "Sample Analysis",
        columns: [
          { key: "sampleId", label: "Sample ID", type: "text" },
          { key: "analyse", label: "Analyse", type: "text" },
          { key: "result", label: "Result", type: "text" },
          { key: "loq", label: "LOQ", type: "text" },
          { key: "permissibleLimit", label: "Permissible Limit", type: "text" },
          { key: "complianceStatus", label: "Compliance Status", type: "select" },
        ],
      };
    }

    if (code === "D5") {
      return {
        title: "Chemical Parameters",
        columns: [
          { key: "parameter", label: "Chemical Parameter", type: "text" },
          { key: "unit", label: "Unit", type: "text" },
          { key: "result", label: "Result", type: "text" },
        ],
      };
    }

    if (code === "D4") {
      return {
        title: "Mycotoxin Testing",
        columns: [
          { key: "mycotoxin", label: "Mycotoxin", type: "text" },
          { key: "detectedLevel", label: "Detected Level (ppb)", type: "text" },
          { key: "allowedLimit", label: "Allowed Limit (ppb)", type: "text" },
          { key: "compliance", label: "Compliance", type: "select" },
        ],
      };
    }

    if (code === "D6") {
      return {
        title: "Qualitative and Quantitative Results",
        columns: [
          { key: "sampleId", label: "Sample ID", type: "text" },
          { key: "qualitativeResult", label: "Qualitative Result", type: "text" },
          { key: "quantitativeResult", label: "Quantitative Result", type: "text" },
          { key: "interpretation", label: "Interpretation", type: "text" },
        ],
      };
    }

    if (code === "D7") {
      return {
        title: "Species Protein Analysis",
        columns: [
          { key: "sampleId", label: "Sample ID", type: "text" },
          { key: "bovineProtein", label: "Bovine Protein", type: "text" },
          { key: "poultryProtein", label: "Poultry Protein", type: "text" },
          { key: "pigProtein", label: "Pig Protein", type: "text" },
          { key: "interpretation", label: "Interpretation", type: "text" },
        ],
      };
    }

    return {
      title: "Test Results",
      columns: [
        { key: "parameter", label: "Parameter", type: "text" },
        { key: "unit", label: "Unit", type: "text" },
        { key: "result", label: "Result", type: "text" },
      ],
    };
  };

  const groupedTests = selectedTests.reduce((acc, test) => {
    const key = resolveCategoryCode(test.category || "Other");
    if (!acc[key]) acc[key] = [];
    acc[key].push(test);
    return acc;
  }, {});

  const categoryKeys = Object.keys(groupedTests).sort((a, b) => {
    const aNum = Number(a.replace(/D/, "")) || 99;
    const bNum = Number(b.replace(/D/, "")) || 99;
    return aNum - bNum;
  });

  React.useEffect(() => {
    if (categoryKeys.length && activeCategoryTab >= categoryKeys.length) {
      setActiveCategoryTab(0);
    }
  }, [categoryKeys, activeCategoryTab]);

  if (!selectedTests.length) {
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        Select food tests in the request tab, then record the findings here.
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
        Food Test Results Entry
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Record findings for the selected D1-D8 food tests using the appropriate table format.
      </Typography>

      <Tabs
        value={activeCategoryTab}
        onChange={(_, value) => setActiveCategoryTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        {categoryKeys.map((categoryKey) => (
          <Tab key={categoryKey} label={categoryKey} />
        ))}
      </Tabs>

      {categoryKeys.map((categoryKey, index) => {
        if (index !== activeCategoryTab) return null;

        const tests = groupedTests[categoryKey];
        const config = getCategoryConfig(categoryKey);
        return (
          <Box key={categoryKey} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              {categoryKey} - {config.title}
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {config.columns.map((column) => (
                      <TableCell key={column.key} sx={{ fontWeight: 700 }}>
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tests.map((test) => (
                    <TableRow key={test.id} hover>
                      {config.columns.map((column) => {
                        if ((categoryKey === "D1" || categoryKey === "D2" || categoryKey === "D5") && column.key === "parameter") {
                          const fixedParameter = test.parameter || test.name || "-";
                          return (
                            <TableCell key={column.key} sx={{ fontWeight: 600 }}>
                              {fixedParameter}
                            </TableCell>
                          );
                        }

                        if (categoryKey === "D4" && column.key === "mycotoxin") {
                          const fixedMycotoxin = test.mycotoxin || test.name || "-";
                          return (
                            <TableCell key={column.key} sx={{ fontWeight: 600 }}>
                              {fixedMycotoxin}
                            </TableCell>
                          );
                        }

                        const value = test[column.key] ?? "";
                        if (column.type === "select") {
                          return (
                            <TableCell key={column.key}>
                              <TextField
                                select
                                size="small"
                                fullWidth
                                value={value}
                                onChange={(e) => updateTest(test.id, column.key, e.target.value)}
                              >
                                <MenuItem value="">Select</MenuItem>
                                <MenuItem value="Yes">Yes</MenuItem>
                                <MenuItem value="No">No</MenuItem>
                                <MenuItem value="Compliant">Compliant</MenuItem>
                                <MenuItem value="Non-Compliant">Non-Compliant</MenuItem>
                              </TextField>
                            </TableCell>
                          );
                        }

                        return (
                          <TableCell key={column.key}>
                            <TextField
                              size="small"
                              fullWidth
                              multiline={column.key === "interpretation" || column.key === "result"}
                              minRows={column.key === "interpretation" || column.key === "result" ? 2 : 1}
                              value={value}
                              onChange={(e) => updateTest(test.id, column.key, e.target.value)}
                              placeholder={column.label}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );
      })}

      <Divider sx={{ mt: 2 }} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        These records will stay with the selected food tests and can be used in the report view.
      </Typography>
    </Paper>
  );
};

export default FoodTestResults;
