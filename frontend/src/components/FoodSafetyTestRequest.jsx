import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Typography,
  Grid,
  Checkbox,
  FormControlLabel,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Paper,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";

const API = "http://127.0.0.1:8000";


const fallbackCategories = [
  {
    id: 1,
    code: "D1",
    name: "Microbiology",
    tests: [
      "Total Viable Count (TVC)",
      "Yeasts and Molds",
      "Coliforms (Colony Count)",
      "Coliforms / E.coli MPN",
      "E.coli beta-glucuronidase +",
      "Enterobacteriaceae",
      "Salmonella spp. (Detection)",
      "Listeria monocytogenes / Listeria spp.",
      "Staphylococcus aureus (Coag+)",
      "Bacillus cereus",
      "Clostridium perfringens",
      "Pseudomonas spp. / P.aeruginosa",
      "Cronobacter spp.",
      "Campylobacter spp.",
      "Sulphite-reducing Clostridia",
      "Other (Specify)"
    ]
  },
  {
    id: 2,
    code: "D2",
    name: "Chemistry (Proximate / Nutritional / Quality)",
    tests: [
      "pH",
      "Acidity / Titratable Acidity",
      "Salty Content (NaCl)",
      "Moisture Content",
      "Ash",
      "Crude Protein (Kjeldahl / Dumas)",
      "Crude Fat",
      "Crude Fiber",
      "Carbohydrate (By Difference)",
      "Total Sugars / Reducing Sugars",
      "Water Activity (aw)",
      "Peroxide Value (Oils & Fats)",
      "Free Fatty Acids (FFA)",
      "Pesticide Residues Analysis",
      "Antibiotic Residues",
      "Other (Specify)"
    ]
  },
  {
    id: 3,
    code: "D3",
    name: "Allergens",
    tests: [
      "Gluten",
      "Peanut",
      "Tree Nuts (Specify)",
      "Soy",
      "Milk / Casein / Beta-lactoglobulin",
      "Egg",
      "Fish",
      "Crustacean Shellfish",
      "Mollusc",
      "Sesame",
      "Mustard",
      "Celery",
      "Sulphites",
      "Lupin",
      "Other (Specify)"
    ]
  },
  {
    id: 4,
    code: "D4",
    name: "Mycotoxins",
    tests: [
      "Aflatoxin B1",
      "Total Aflatoxins (B1+B2+G1+G2)",
      "Aflatoxin M1",
      "Ochratoxin A",
      "Zearalenone",
      "Deoxynivalenol (DON)",
      "Fumonisins (B1+B2)",
      "T-2 / HT-2",
      "Other (Specify)"
    ]
  },
  {
    id: 5,
    code: "D5",
    name: "Heavy Metals",
    tests: [
      "Lead (Pb)",
      "Cadmium (Cd)",
      "Mercury (Hg)",
      "Arsenic (Total)",
      "Arsenic (Inorganic)",
      "Copper (Cu)",
      "Iron (Fe)",
      "Zinc (Zn)",
      "Nickel (Ni)",
      "Tin (Sn)",
      "Aluminium (Al)",
      "Other (Specify)"
    ]
  },
  {
    id: 6,
    code: "D6",
    name: "GMO Detection",
    tests: [
      "Qualitative GMO Screening (35S/NOS/FMV)",
      "Quantitative GMO Screening (CP4 EPSPS)",
      "Qualitative GMO Screening (BT Cry1Ab/Ac)",
      "Qualitative GMO Screening (PAT/BAR)",
      "Event-specific GMO Identification",
      "Other (Specify)"
    ]
  },
  {
    id: 7,
    code: "D7",
    name: "Meat Authenticity / Species Identification",
    tests: [
      "Species Identification – Beef",
      "Species Identification – Pork",
      "Species Identification – Poultry",
      "Species Identification – Horse",
      "Species Identification – Donkey",
      "Species Identification – Sheep / Goat",
      "Species Identification – Other (Specify)",
      "Milk Authentication",
      "Expected Species",
      "Other (Specify)"
    ]
  },
  {
    id: 8,
    code: "D8",
    name: "Water Analysis",
    tests: [
      "pH",
      "Conductivity",
      "Turbidity",
      "Total Dissolved Solids (TDS)",
      "Salinity",
      "Chemical Oxygen Demand (COD)",
      "Biochemical Oxygen Demand (BOD)",
      "Total / Fecal Coliforms",
      "E.coli",
      "Enterococci",
      "Heterotrophic Plate Count (HPC)",
      "Free / Total Chlorine",
      "Nitrate / Nitrite",
      "Hardness (CaCO3)",
      "Heavy Metals",
      "Other (Specify)"
    ]
  }
];

const normalizeTest = (test, category, index) => {
  if (typeof test === "object" && test !== null) {
    return {
      id: test.id || `${category.code || category.name || "category"}-${index}-${test.name || "test"}`,
      name: test.name || `Test ${index + 1}`,
      category: test.category || category.name || "",
      category_id: test.category_id || null,
    };
  }

  return {
    id: `${category.code || category.name || "category"}-${index}-${String(test)}`,
    name: String(test),
    category: category.name || "",
    category_id: null,
  };
};

const FoodSafetyTestRequest = ({ selectedTests, setSelectedTests, sampleCount = 8 }) => {
  const [categories, setCategories] = useState(fallbackCategories);
  const [loading, setLoading] = useState(true);
  const [activeCategoryTab, setActiveCategoryTab] = useState(0);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/api/tests/categories`);
        const data = Array.isArray(res.data) ? res.data : [];
        setCategories(data.length > 0 ? data : fallbackCategories);
      } catch (e) {
        console.error("Failed to load test categories:", e);
        setCategories(fallbackCategories);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length && activeCategoryTab >= categories.length) {
      setActiveCategoryTab(0);
    }
  }, [categories, activeCategoryTab]);

  const sampleColumns = useMemo(() => {
    const existingMaxSampleIndex = (selectedTests || []).reduce((max, test) => {
      const keys = Object.keys(test?.samples || {});
      const localMax = keys.reduce((innerMax, key) => {
        const match = /^S(\d+)$/.exec(key);
        if (!match) return innerMax;
        return Math.max(innerMax, Number(match[1]));
      }, 0);
      return Math.max(max, localMax);
    }, 0);

    const total = Math.max(8, Number(sampleCount) || 0, existingMaxSampleIndex);
    return Array.from({ length: total }, (_, index) => `S${index + 1}`);
  }, [sampleCount, selectedTests]);

  const toggleSampleCheckbox = (test, categoryName, col) => {
    setSelectedTests(prev => {
      const copy = JSON.parse(JSON.stringify(prev || []));
      const entry = copy.find(t => t.id === test.id);
      if (!entry) {
        const newEntry = {
          id: test.id,
          name: test.name,
          category: categoryName,
          category_id: test.category_id || null,
          samples: {},
          other_specify: ""
        };
        sampleColumns.forEach(c => newEntry.samples[c] = false);
        newEntry.samples[col] = true;
        copy.push(newEntry);
      } else {
        if (!entry.samples || typeof entry.samples !== "object") {
          entry.samples = {};
        }
        sampleColumns.forEach((c) => {
          if (typeof entry.samples[c] !== "boolean") {
            entry.samples[c] = false;
          }
        });
        entry.samples[col] = !entry.samples[col];
        const any = Object.values(entry.samples).some(Boolean);
        if (!any) {
          const idx = copy.findIndex(x => x.id === entry.id);
          if (idx !== -1) copy.splice(idx,1);
        }
      }
      return copy;
    });
  };

  const handleOtherSpecifyChange = (testId, value, testName, categoryName) => {
    setSelectedTests(prev => {
      const copy = JSON.parse(JSON.stringify(prev || []));
      const entry = copy.find(t => t.id === testId);
      if (entry) {
        if (!entry.samples || typeof entry.samples !== "object") {
          entry.samples = {};
        }
        sampleColumns.forEach((c) => {
          if (typeof entry.samples[c] !== "boolean") {
            entry.samples[c] = false;
          }
        });
        entry.other_specify = value;
      } else {
        const newEntry = { id: testId, name: testName || "", category: categoryName || "", category_id: null, samples: {}, other_specify: value };
        sampleColumns.forEach(c => newEntry.samples[c] = false);
        copy.push(newEntry);
      }
      return copy;
    });
  };

  if (loading) return <Paper sx={{p:2, display:'flex', alignItems:'center', justifyContent:'center'}}><CircularProgress size={24} /></Paper>;

  const selectedCategory = categories[activeCategoryTab] || null;
  const normalizedTests = (selectedCategory?.tests || []).map((test, index) => normalizeTest(test, selectedCategory || {}, index));

  return (
    <Box>
      <Tabs
        value={activeCategoryTab}
        onChange={(_, value) => setActiveCategoryTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        {categories.map((cat, index) => (
          <Tab key={cat.id || cat.code || index} label={`${cat.code || `D${index + 1}`} - ${cat.name || "Category"}`} />
        ))}
      </Tabs>

      {selectedCategory && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            {selectedCategory.code} - {selectedCategory.name}
          </Typography>

          <TableContainer sx={{ maxWidth: "100%", overflowX: "auto" }}>
          <Table
            size="small"
            sx={{
              width: "100%",
              tableLayout: "fixed",
              "& .MuiTableCell-root": { px: 0.5, py: 0.5 },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, minWidth: 220, width: 220 }}>Test / Item</TableCell>
                {sampleColumns.map((c) => (
                  <TableCell key={c} align="center" sx={{ fontWeight: 700, width: 42, minWidth: 42 }}>
                    {c}
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 700, minWidth: 180, width: 180 }}>Other Specify</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {normalizedTests.map((test) => {
                const selectedEntry = (selectedTests || []).find((t) => t.id === test.id);
                const selectedSamples = selectedEntry?.samples || {};
                const selectedCount = sampleColumns.filter((col) => Boolean(selectedSamples[col])).length;
                const allSelected = sampleColumns.length > 0 && selectedCount === sampleColumns.length;
                const partiallySelected = selectedCount > 0 && !allSelected;

                return (
                  <TableRow key={test.id} hover>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={allSelected}
                            indeterminate={partiallySelected}
                            size="small"
                            onChange={() => {
                              setSelectedTests((prev) => {
                                const copy = JSON.parse(JSON.stringify(prev || []));
                                const idx = copy.findIndex((t) => t.id === test.id);
                                const currentEntry = idx !== -1 ? copy[idx] : null;
                                const currentSamples = currentEntry?.samples || {};
                                const currentAllSelected = sampleColumns.length > 0 && sampleColumns.every((c) => Boolean(currentSamples[c]));

                                if (idx !== -1 && currentAllSelected) {
                                  copy.splice(idx, 1);
                                  return copy;
                                }

                                const newEntry = {
                                  id: test.id,
                                  name: test.name,
                                  category: test.category || selectedCategory.name,
                                  category_id: test.category_id || null,
                                  samples: {},
                                  other_specify: currentEntry?.other_specify || "",
                                };

                                sampleColumns.forEach((c) => {
                                  newEntry.samples[c] = true;
                                });

                                if (idx !== -1) {
                                  copy[idx] = newEntry;
                                } else {
                                  copy.push(newEntry);
                                }

                                return copy;
                              });
                            }}
                          />
                        }
                        label={test.name}
                      />
                    </TableCell>
                    {sampleColumns.map((col) => {
                      const checked = Boolean(selectedSamples[col]);
                      return (
                        <TableCell key={col} align="center">
                          <Checkbox
                            size="small"
                            checked={checked}
                            onChange={() => toggleSampleCheckbox(test, test.category || selectedCategory.name, col)}
                            sx={{ p: 0.25 }}
                          />
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Other (specify)"
                        value={selectedEntry?.other_specify || ""}
                        onChange={(e) => handleOtherSpecifyChange(test.id, e.target.value, test.name, test.category || selectedCategory.name)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default FoodSafetyTestRequest;
