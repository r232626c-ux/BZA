import React, { useRef, useMemo, useEffect } from "react";
import { Box, Typography, Divider, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Alert } from "@mui/material";

const MICROBIOLOGY_METHOD_ROWS = [
  { parameter: "Total Viable Count", methodCode: "FSH-MICRO-01", methodOfAnalysis: "Miles and Misra method" },
  { parameter: "Enumeration of Coliforms", methodCode: "FSH-MICRO-02", methodOfAnalysis: "Miles and Misra method" },
  { parameter: "Enumeration of Escherichia coli", methodCode: "FSH-MICRO-02", methodOfAnalysis: "Miles and Misra method" },
  { parameter: "Enumeration of Bacillus cereus", methodCode: "FSH-MICRO-12", methodOfAnalysis: "Miles and Misra method" },
  { parameter: "Enumeration of Coagulase Positive Staphylococci", methodCode: "FSH-MICRO-07", methodOfAnalysis: "Miles and Misra method" },
  { parameter: "Detection of Salmonella spp.", methodCode: "FSH-MICRO-04", methodOfAnalysis: "Pre-enrichment followed by plating on selective agar" },
  { parameter: "Enumeration of Yeasts and Moulds", methodCode: "FSH-MICRO-11", methodOfAnalysis: "Miles and Misra method" },
  { parameter: "Enumeration of Lactic Acid Bacteria", methodCode: "FSH-MICRO-11", methodOfAnalysis: "Miles and Misra method" },
];

const D2_CHEMISTRY_METHOD_ROWS = [
  { parameter: "pH", instrumentUsed: "Benchtop pH/mV Meter", sopCode: "FSH-CHEM-001" },
  { parameter: "Conductivity", instrumentUsed: "UV-Visible Spectrophotometer (UV-VIS)", sopCode: "FSH-CHEM-002" },
  { parameter: "Turbidity", instrumentUsed: "Water Quality Tester", sopCode: "FSH-CHEM-003" },
  { parameter: "Total Dissolved Solids (TDS)", instrumentUsed: "UV-Visible Spectrophotometer (UV-VIS)", sopCode: "FSH-CHEM-004" },
  { parameter: "Total Hardness", instrumentUsed: "Water Quality Tester", sopCode: "FSH-CHEM-005" },
  { parameter: "Alkalinity", instrumentUsed: "Water Quality Tester", sopCode: "FSH-CHEM-006" },
  { parameter: "Nitrate", instrumentUsed: "Water Quality Tester", sopCode: "FSH-CHEM-007" },
  { parameter: "Nitrite", instrumentUsed: "UV-Visible Spectrophotometer (UV-VIS)", sopCode: "FSH-CHEM-008" },
  { parameter: "Ammonia", instrumentUsed: "UV-Visible Spectrophotometer (UV-VIS)", sopCode: "FSH-CHEM-009" },
  { parameter: "Chloride", instrumentUsed: "Portable Ion/mV Meter", sopCode: "FSH-CHEM-010" },
  { parameter: "Sulphate", instrumentUsed: "UV-Visible Spectrophotometer (UV-VIS)", sopCode: "FSH-CHEM-011" },
];

const D4_MYCOTOXIN_METHOD_ROWS = [
  { parameter: "Aflatoxin B1", methodCode: "Symmetric B1 Green", summaryOfMethods: "Lateral Flow Immunoassay with Reader (Quantitative)" },
  { parameter: "Total Aflatoxins (B1, B2, G1 and G2)", methodCode: "Symmetric Total Green (0-30)", summaryOfMethods: "Lateral Flow Immunoassay with Reader (Quantitative)" },
  { parameter: "Deoxynivalenol (DON)", methodCode: "Symmetric DON Green", summaryOfMethods: "Lateral Flow Immunoassay with Reader (Quantitative)" },
  { parameter: "Fumonisins (FUMO)", methodCode: "Symmetric Fumonisin Green", summaryOfMethods: "Lateral Flow Immunoassay with Reader (Quantitative)" },
  { parameter: "Ochratoxin A", methodCode: "Symmetric Ochratoxin Green", summaryOfMethods: "Lateral Flow Immunoassay with Reader (Quantitative)" },
  { parameter: "T-2/HT-2 Toxins", methodCode: "Symmetric T-2/HT-2 Green", summaryOfMethods: "Lateral Flow Immunoassay with Reader (Quantitative)" },
  { parameter: "Zearalenones (ZON)", methodCode: "Symmetric ZON Green", summaryOfMethods: "Lateral Flow Immunoassay with Reader (Quantitative)" },
];

const D5_HEAVY_METAL_METHOD_ROWS = [
  { parameter: "Lead (Pb)", summaryOfMethods: "Rapid Colorimetric Detection Method" },
  { parameter: "Cadmium (Cd)", summaryOfMethods: "Rapid Colorimetric Detection Method" },
  { parameter: "Mercury (Hg)", summaryOfMethods: "Rapid Colorimetric Detection Method" },
  { parameter: "Nickel (Ni)", summaryOfMethods: "Rapid Colorimetric Detection Method" },
  { parameter: "Copper (Cu)", summaryOfMethods: "Rapid Colorimetric Detection Method" },
  { parameter: "Zinc (Zn)", summaryOfMethods: "Rapid Colorimetric Detection Method" },
  { parameter: "Cobalt (Co)", summaryOfMethods: "Rapid Colorimetric Detection Method" },
];

const D6_GMO_METHOD_ROWS = [
  { parameter: "CP4 EPSPS (Qualitative)", methodCode: "GMOD-01", summaryOfMethods: "Lateral Flow Immunoassay with Cassette Visual Readout (Qualitative)" },
  { parameter: "CP4 EPSPS (Quantitative)", methodCode: "GMOD-02", summaryOfMethods: "Lateral Flow Immunoassay with Digital Reader (Quantitative)" },
];

const MethodsSummaryTable = ({ rows = [], categoryType = "default" }) => {
  const isD2Category = categoryType === "d2";
  const isD4Category = categoryType === "d4";
  const isD5Category = categoryType === "d5";
  const isD6Category = categoryType === "d6";
  return (
    <Paper
      sx={{
        mt: 3,
        p: 2,
        borderRadius: 2,
        border: "1px solid #e5e7eb",
        position: "relative",
        overflow: "hidden",
        pageBreakBefore: "always",
        breakBefore: "page",
      }}
    >
      <Box
        component="div"
        sx={{
          fontFamily: "inherit",
          fontSize: "14px",
          fontWeight: 700,
          mb: 2,
          color: "inherit",
          textTransform: "uppercase",
        }}
      >
        SUMMARY OF TEST METHODS
      </Box>

      {rows.length === 0 ? (
        <Alert severity="info">No test methods available.</Alert>
      ) : (
        <>
          <TableContainer sx={{ overflowX: "auto", borderRadius: 2, border: "1px solid #e5e7eb" }}>
            <Table size="small" aria-label="summary of test methods table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>{isD5Category ? "Chemical Parameter" : "Element / Parameter"}</TableCell>
                  {isD5Category ? (
                    <TableCell sx={{ fontWeight: 700 }}>Summary of Method(s)</TableCell>
                  ) : (
                    <>
                      <TableCell sx={{ fontWeight: 700 }}>{isD2Category ? "Instrument Used" : "Method Code"}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{isD2Category ? "SOP Code" : (isD4Category || isD6Category) ? "Summary of Method(s)" : "Method of Analysis"}</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow
                    key={`${row.sopCode || row.methodCode || row.parameter}-${row.parameter}`}
                    hover
                    sx={{
                      backgroundColor: index % 2 === 0 ? "background.paper" : "action.hover",
                      "& td": { verticalAlign: "top" },
                    }}
                  >
                    <TableCell>{row.parameter}</TableCell>
                    {isD5Category ? (
                      <TableCell sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>{row.summaryOfMethods}</TableCell>
                    ) : isD2Category ? (
                      <>
                        <TableCell sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>{row.instrumentUsed}</TableCell>
                        <TableCell>
                          <Chip label={row.sopCode} size="small" color="info" variant="filled" />
                        </TableCell>
                      </>
                    ) : (isD4Category || isD6Category) ? (
                      <>
                        <TableCell>
                          <Chip label={row.methodCode} size="small" color="info" variant="filled" />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>{row.summaryOfMethods}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          <Chip label={row.methodCode} size="small" color="info" variant="filled" />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>{row.methodOfAnalysis}</TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Paper>
  );
};

const disclaimerSections = [
  {
    title: "1) Scope of Testing",
    text:
      "This report relates only to the specific sample identified in this report and to the analytes tested. It does not constitute certification or approval of the entire batch/consignment or any other lots, and it should be interpreted together with the stated sample description and condition on receipt.",
  },
  {
    title: "2) Sampling and representativeness",
    text:
      "Unless BIOTECH personnel performed sampling under a documented sampling plan, the selection, collection, sealing, labelling, and transport of the sample are the responsibility of the client (or its appointed agent). Accordingly, the results reflect the test portion of the sample submitted and may not represent the whole batch where the product is heterogeneous or where sampling was not statistically representative.",
  },
  {
    title: "3) Methods, reporting limits and uncertainty",
    text:
      "Analyses were performed using the method(s) stated in this report. All analytical measurements have inherent uncertainty. Results reported with a “<” sign indicate that the analyte was not detected above the method reporting limit stated in the result table. Where regulatory enforcement, dispute resolution, or importing-country requirements demand confirmatory testing by a reference method, BIOTECH can advise and/or facilitate confirmatory analysis upon request.",
  },
  {
    title: "4) Regulatory interpretation",
    text:
      "Any “Allowed Limit” values and compliance statements are made only against the specific limits referenced in this report. Regulatory limits and decision rules may differ by jurisdiction, commodity definition, intended use (food vs. feed), and importing authority; the client remains responsible for determining and meeting all applicable legal requirements in the destination market and in Zimbabwe.",
  },
  {
    title: "5) Reliance, distribution and reproduction",
    text:
      "This report is issued exclusively for the client named herein for its quality, regulatory, and risk-management purposes. No third party may rely on this report without BIOTECH’s prior written consent. Reproduction is permitted only in full and unaltered form. Extracts, partial reproduction, or use for advertising/marketing claims (including “certified/approved”) is not permitted without BIOTECH’s written approval.",
  },
  {
    title: "6) Limitation of liability",
    text:
      "To the maximum extent permitted by applicable law, BIOTECH’s total liability arising from or connected with the services and this report (whether in contract, delict/tort, negligence or otherwise) is limited to the fees paid for the specific testing giving rise to the claim. BIOTECH shall not be liable for indirect, consequential, special or economic losses (including loss of profit, recall costs, loss of market, or business interruption). Nothing in this disclaimer limits liability for fraud, willful misconduct, or any liability that cannot lawfully be excluded.",
  },
  {
    title: "7) Queries and retention (if applicable)",
    text:
      "Any questions, requests for re-testing, or disputes regarding this report should be raised promptly and, where possible, before the sample/test portion is disposed of in accordance with laboratory retention and disposal procedures.",
  },
];

const noteLines = [
  "Presence/Absence Tests: Qualitative methods used to determine whether specific indicator organisms or pathogens (e.g., Escherichia coli, Salmonella spp., fecal coliforms) are detected in the sample.",
  "Absence: Indicates microbiological compliance for potable water standards.",
  "Presence: Indicates contamination and potential public health risk; the water is considered unsafe for human consumption without treatment.",
  "Fecal Coliforms and E. coli: Indicator organisms used to assess fecal contamination of water. Their presence suggests possible contamination from human or animal waste and the potential presence of enteric pathogens.",
  "Salmonella spp.: A pathogenic organism. Its detection in water indicates serious contamination and renders the water unsuitable for consumption.",
  "Membrane Filtration Method: A standard technique used for microbiological analysis of water, allowing detection and enumeration of microorganisms by filtering a defined volume of sample through a membrane and culturing on selective media.",
  "Sample Integrity: Results apply only to the sample as received. Improper sampling, storage, or transport conditions may affect microbial recovery.",
  "Public Health Consideration: The presence of indicator organisms or pathogens suggests that the water source may be compromised and requires corrective action such as disinfection, source protection, or further investigation.",
];

const ViewResults = ({
  selectedTests = [],
  labResults = [],
  submissionForm = {},
  samples = [],
  patient = {},
  requestId,
  sampleDate,
  onCancel = () => {},
}) => {
  const componentRef = useRef(null);

  const microCategories = [
    "Urine Microscopy",
    "Swab M/C/S",
    "Sputum M/C/S",
    "Stool M/C/S",
  ];

  const displayTests = useMemo(
    () => (labResults.length ? labResults : selectedTests).map((test) => ({
      id: test.id ?? test.lab_test_id ?? test.name,
      name: test.test_name ?? test.name ?? "Unknown Test",
      sampleId: test.sampleId ?? test.sample_id ?? "",
      analyse: test.analyse ?? test.analysis ?? test.test_name ?? test.name ?? "",
      loq: test.loq ?? test.limitOfQuantification ?? test.limit_of_quantification ?? "",
      complianceStatus: test.complianceStatus ?? test.compliance_status ?? test.compliance ?? "",
      bovineProtein: test.bovineProtein ?? test.bovine_protein ?? "",
      poultryProtein: test.poultryProtein ?? test.poultry_protein ?? "",
      pigProtein: test.pigProtein ?? test.pig_protein ?? "",
      parameter: test.parameter ?? test.test_name ?? test.name ?? "",
      mycotoxin: test.mycotoxin ?? test.test_name ?? test.name ?? "",
      category: test.category ?? test.lab_test?.category ?? "Other",
      result: test.results ?? test.result ?? "",
      qualitativeResult: test.qualitativeResult ?? test.qualitative_result ?? "",
      quantitativeResult: test.quantitativeResult ?? test.quantitative_result ?? "",
      interpretation: test.interpretation ?? "",
      detectedLevel: test.detectedLevel ?? test.detected_level ?? test.results ?? test.result ?? "",
      unit: test.unit ?? "",
      allowedLimit: test.allowedLimit ?? test.allowed_limit ?? test.permissibleLimit ?? test.permissible_limit ?? "",
      permissibleLimit: test.permissibleLimit ?? test.permissible_limit ?? test.allowedLimit ?? test.allowed_limit ?? "",
      compliance: test.compliance ?? test.complianceStatus ?? test.compliance_status ?? "",
      refRange: test.ref_range ?? test.refRange ?? "",
      flag: test.flag ?? "",
      comment: test.comment ?? "",
    })),
    [labResults, selectedTests]
  );

  const groupedTests = useMemo(
    () =>
      displayTests.reduce((acc, test) => {
        const category = test.category || "Other";
        if (!acc[category]) acc[category] = [];
        acc[category].push(test);
        return acc;
      }, {}),
    [displayTests]
  );

  const isMicrobiologyCategory = (category = "") => {
    const value = String(category || "").trim().toLowerCase();
    return value.includes("microbiology") || value.startsWith("d1") || value.includes("micro");
  };

  const isChemistryCategory = (category = "") => {
    const value = String(category || "").trim().toLowerCase();
    return (
      value.startsWith("d2") ||
      value.includes("chemistry") ||
      value.includes("nutritional") ||
      value.includes("nutrition") ||
      value.includes("quality")
    );
  };

  const isD2ChemistryCategory = (category = "") => {
    const value = String(category || "").trim().toLowerCase();
    return value.startsWith("d2") || value === "chemistry (proximate / nutritional / quality)";
  };

  const isD3Category = (category = "") => {
    const value = String(category || "").trim().toLowerCase();
    return value.startsWith("d3") || value.includes("allergen");
  };

  const isD4MycotoxinCategory = (category = "") => {
    const value = String(category || "").trim().toLowerCase();
    return value.startsWith("d4") || value.includes("mycotoxin");
  };

  const isD5Category = (category = "") => {
    const value = String(category || "").trim().toLowerCase();
    return value.startsWith("d5") || value.includes("heavy metal");
  };

  const isD6Category = (category = "") => {
    const value = String(category || "").trim().toLowerCase();
    return value.startsWith("d6") || value.includes("gmo") || value.includes("qualitative and quantitative");
  };

  const isD7Category = (category = "") => {
    const value = String(category || "").trim().toLowerCase();
    return value.startsWith("d7") || value.includes("species") || value.includes("meat");
  };

  const isD8Category = (category = "") => {
    const value = String(category || "").trim().toLowerCase();
    return value.startsWith("d8") || value.includes("water");
  };

  const hasMicrobiologyCategory = useMemo(() => {
    const entries = Object.keys(groupedTests);
    return entries.some((category) => {
      const value = String(category || "").toLowerCase();
      return value.includes("microbiology") || value.startsWith("d1");
    });
  }, [groupedTests]);

  const reportJobs = useMemo(
    () => ({
      reportNumber: submissionForm.reportNumber || submissionForm.labReportNumber || requestId || "-",
      jobRef: submissionForm.labJobReference || requestId || "-",
      customerName:
        submissionForm.submittingClient || `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "-",
      customerDetails:
        [
          submissionForm.submittingClient || `${patient.firstName || ""} ${patient.lastName || ""}`.trim(),
          submissionForm.contactPerson,
          submissionForm.telephoneEmail,
        ]
          .filter(Boolean)
          .join(" | ") || "-",
      conditionUponReceipt: submissionForm.storageCondition || submissionForm.siteLocation || "-",
      parametersTested:
        displayTests.map((test) => test.name).filter(Boolean).join(", ") || "-",
      dateSampled: submissionForm.submissionDate || sampleDate || "-",
      dateAnalyzed: submissionForm.dateAnalyzed || sampleDate || submissionForm.labSubmissionDate || "-",
      dateReported: submissionForm.reportDate || sampleDate || submissionForm.labSubmissionDate || "-",
      numberOfSamples:
        samples && samples.length > 0
          ? samples.filter((sample) => String(sample?.sampleName || "").trim().length > 0).length
          : "-",
    }),
    [submissionForm, samples, patient, sampleDate, displayTests, requestId]
  );

  const disclaimerSections = [
    {
      title: "1) Scope of Testing",
      text:
        "This report relates only to the specific sample identified in this report and to the analytes tested. It does not constitute certification or approval of the entire batch/consignment or any other lots, and it should be interpreted together with the stated sample description and condition on receipt.",
    },
    {
      title: "2) Sampling and representativeness",
      text:
        "Unless BIOTECH personnel performed sampling under a documented sampling plan, the selection, collection, sealing, labelling, and transport of the sample are the responsibility of the client (or its appointed agent). Accordingly, the results reflect the test portion of the sample submitted and may not represent the whole batch where the product is heterogeneous or where sampling was not statistically representative.",
    },
    {
      title: "3) Methods, reporting limits and uncertainty",
      text:
        "Analyses were performed using the method(s) stated in this report. All analytical measurements have inherent uncertainty. Results reported with a “<” sign indicate that the analyte was not detected above the method reporting limit stated in the result table. Where regulatory enforcement, dispute resolution, or importing-country requirements demand confirmatory testing by a reference method, BIOTECH can advise and/or facilitate confirmatory analysis upon request.",
    },
    {
      title: "4) Regulatory interpretation",
      text:
        "Any “Allowed Limit” values and compliance statements are made only against the specific limits referenced in this report. Regulatory limits and decision rules may differ by jurisdiction, commodity definition, intended use (food vs. feed), and importing authority; the client remains responsible for determining and meeting all applicable legal requirements in the destination market and in Zimbabwe.",
    },
    {
      title: "5) Reliance, distribution and reproduction",
      text:
        "This report is issued exclusively for the client named herein for its quality, regulatory, and risk-management purposes. No third party may rely on this report without BIOTECH's prior written consent. Reproduction is permitted only in full and unaltered form. Extracts, partial reproduction, or use for advertising/marketing claims (including certified/approved) is not permitted without BIOTECH's written approval.",
    },
    {
      title: "6) Limitation of liability",
      text:
        "To the maximum extent permitted by applicable law, BIOTECH’s total liability arising from or connected with the services and this report (whether in contract, delict/tort, negligence or otherwise) is limited to the fees paid for the specific testing giving rise to the claim. BIOTECH shall not be liable for indirect, consequential, special or economic losses (including loss of profit, recall costs, loss of market, or business interruption). Nothing in this disclaimer limits liability for fraud, willful misconduct, or any liability that cannot lawfully be excluded.",
    },
    {
      title: "7) Queries and retention (if applicable)",
      text:
        "Any questions, requests for re-testing, or disputes regarding this report should be raised promptly and, where possible, before the sample/test portion is disposed of in accordance with laboratory retention and disposal procedures.",
    },
  ];

  const d2DisclaimerSections = [
    {
      title: "1) Scope of Testing",
      text:
        "This report relates only to the specific sample identified in this report and to the analytes tested. It does not constitute certification or approval of the entire batch/consignment or any other lots, and it should be interpreted together with the stated sample description and condition on receipt.",
    },
    {
      title: "2) Sampling and representativeness",
      text:
        "Unless BIOTECH personnel performed sampling under a documented sampling plan, the selection, collection, sealing, labelling, and transport of the sample are the responsibility of the client (or its appointed agent). Accordingly, the results reflect the test portion of the sample submitted and may not represent the whole batch where the product is heterogeneous or where sampling was not statistically representative.",
    },
    {
      title: "3) Methods, reporting limits and uncertainty",
      text:
        "Analyses were performed using the method(s) stated in this report. All analytical measurements have inherent uncertainty. Results reported with a “<” sign indicate that the analyte was not detected above the method reporting limit stated in the result table. Where regulatory enforcement, dispute resolution, or importing-country requirements demand confirmatory testing by a reference method, BIOTECH can advise and/or facilitate confirmatory analysis upon request.",
    },
    {
      title: "4) Regulatory interpretation",
      text:
        "Any “Allowed Limit” values and compliance statements are made only against the specific limits referenced in this report. Regulatory limits and decision rules may differ by jurisdiction, commodity definition, intended use (food vs. feed), and importing authority; the client remains responsible for determining and meeting all applicable legal requirements in the destination market and in Zimbabwe.",
    },
    {
      title: "5) Reliance, distribution and reproduction",
      text:
        "This report is issued exclusively for the client named herein for its quality, regulatory, and risk-management purposes. No third party may rely on this report without BIOTECH's prior written consent. Reproduction is permitted only in full and unaltered form. Extracts, partial reproduction, or use for advertising/marketing claims (including certified/approved) is not permitted without BIOTECH's written approval.",
    },
    {
      title: "6) Limitation of liability",
      text:
        "To the maximum extent permitted by applicable law, BIOTECH’s total liability arising from or connected with the services and this report (whether in contract, delict/tort, negligence or otherwise) is limited to the fees paid for the specific testing giving rise to the claim. BIOTECH shall not be liable for indirect, consequential, special or economic losses (including loss of profit, recall costs, loss of market, or business interruption). Nothing in this disclaimer limits liability for fraud, willful misconduct, or any liability that cannot lawfully be excluded.",
    },
    {
      title: "7) Queries and retention (if applicable)",
      text:
        "Any questions, requests for re-testing, or disputes regarding this report should be raised promptly and, where possible, before the sample/test portion is disposed of in accordance with laboratory retention and disposal procedures.",
    },
  ];

  const noteLines = [
    "Presence/Absence Tests: Qualitative methods used to determine whether specific indicator organisms or pathogens (e.g., Escherichia coli, Salmonella spp., fecal coliforms) are detected in the sample.",
    "Absence: Indicates microbiological compliance for potable water standards.",
    "Presence: Indicates contamination and potential public health risk; the water is considered unsafe for human consumption without treatment.",
    "Fecal Coliforms and E. coli: Indicator organisms used to assess fecal contamination of water. Their presence suggests possible contamination from human or animal waste and the potential presence of enteric pathogens.",
    "Salmonella spp.: A pathogenic organism. Its detection in water indicates serious contamination and renders the water unsuitable for consumption.",
    "Membrane Filtration Method: A standard technique used for microbiological analysis of water, allowing detection and enumeration of microorganisms by filtering a defined volume of sample through a membrane and culturing on selective media.",
    "Sample Integrity: Results apply only to the sample as received. Improper sampling, storage, or transport conditions may affect microbial recovery.",
    "Public Health Consideration: The presence of indicator organisms or pathogens suggests that the water source may be compromised and requires corrective action such as disinfection, source protection, or further investigation.",
  ];

  const d5NoteLines = [
    "Results are reported on a qualitative basis (Detected/Not Detected) for the specified heavy metals tested.",
    "Analysis was performed using a rapid colorimetric screening method, based on the chemical reaction between specific reagents and target metal ions to produce a visible colour change where the analyte is present.",
    '"Not Detected" indicates that the analyte was not detected above the method\'s detection capability under the conditions of the test.',
    "This method is intended for screening purposes only and does not provide quantitative concentration values (e.g., mg/L or ug/L).",
    'A result of "Not Detected" does not necessarily indicate the complete absence of the analyte, but rather that any concentration present is below the detection capability of the method employed.',
    "The analysis is limited to the following analytes: Lead (Pb), Cadmium (Cd), Mercury (Hg), Nickel (Ni), Copper (Cu), Zinc (Zn), and Cobalt (Co).",
    "This screening does not constitute a comprehensive assessment of all possible heavy metal contaminants that may be present in the sample.",
    "Where regulatory compliance, risk assessment, or accurate quantification is required, confirmatory analysis using validated quantitative techniques such as Inductively Coupled Plasma Mass Spectrometry (ICP-MS) or Atomic Absorption Spectroscopy (AAS) is recommended.",
    "The reported results apply only to the sample received and tested and may not be representative of the entire water source, batch, or consignment.",
    "The accuracy and reliability of the results depend on appropriate sample collection, preservation, handling, transport, and storage prior to analysis.",
  ];

  const d7NoteLines = [
    "These qualitative assays utilize highly purified antibodies to detect species-specific animal serum protein (albumin), which occurs naturally at high concentrations in raw meat (e.g., minced meat), processed meat products (e.g., burgers), and blood exudate.",
    "The limit of detection (LOD) is approximately 1% in ground raw meat and may vary slightly depending on sample type, sample quality, and extraction efficiency.",
    "The stated detection limit has been verified using reference materials supplied by the United Kingdom Laboratory of the Government Chemist (LGC).",
    '"Detected" indicates that species-specific animal serum protein was identified within the sensitivity and specificity of the test method.',
    '"Not Detected" indicates that the target species-specific protein was not detected above the method\'s detection limit. This does not necessarily confirm the complete absence of the species in the sample.',
    "Results apply only to the sample submitted for analysis and the species tested.",
    "These assays are intended for qualitative screening and do not provide quantitative estimates of species content.",
    "Where regulatory action or legal proceedings require confirmation, additional analysis using validated molecular methods (e.g., PCR or DNA-based species identification) is recommended.",
  ];

  const renderTestTable = (tests, showHeader = true, isMicrobiology = false) => (
    <table style={isMicrobiology ? { tableLayout: "fixed", width: "100%" } : undefined}>
      {isMicrobiology && (
        <colgroup>
          <col style={{ width: "60%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "25%" }} />
        </colgroup>
      )}
      {showHeader && (
        <thead>
          <tr>
            <th style={isMicrobiology ? { padding: "4px 6px" } : undefined}>{isMicrobiology ? "Microbiology Parameter" : "Test Name"}</th>
            {isMicrobiology && <th style={{ padding: "4px 6px" }}>Unit</th>}
            <th style={isMicrobiology ? { padding: "4px 6px" } : undefined}>Result</th>
            {!isMicrobiology && <th>Unit</th>}
          </tr>
        </thead>
      )}
      <tbody>
        {tests.map((test) => (
          <tr key={test.id}>
            <td
              className="left"
              style={isMicrobiology ? { padding: "3px 2px", lineHeight: 1.05, fontWeight: 600 } : undefined}
            >
              {isMicrobiology ? (test.parameter || test.name || "-") : (test.name || "-")}
            </td>
            {isMicrobiology && (
              <td className="center" style={{ padding: "3px 6px", lineHeight: 1.05, whiteSpace: "nowrap" }}>
                {test.unit || ""}
              </td>
            )}
            <td
              className="center"
              style={isMicrobiology ? { padding: "3px 6px", lineHeight: 1.05, wordBreak: "break-word" } : undefined}
            >
              {test.result || ""}
            </td>
            {!isMicrobiology && <td className="center">{test.unit || ""}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderD2Table = (tests) => (
    <table>
      <thead>
        <tr>
          <th>Chemical Parameter</th>
          <th>Unit</th>
          <th>Result</th>
          <th>Permissible Limit</th>
          <th>Compliance</th>
        </tr>
      </thead>
      <tbody>
        {tests.map((test) => (
          <tr key={test.id}>
            <td className="left">{test.parameter || test.name || "-"}</td>
            <td className="center">{test.unit || ""}</td>
            <td className="center">{test.result || ""}</td>
            <td className="center">{test.permissibleLimit || ""}</td>
            <td className="center">{test.compliance || ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderD3Table = (tests) => (
    <table>
      <thead>
        <tr>
          <th>Sample ID</th>
          <th>Analyse</th>
          <th>Result</th>
          <th>LOQ</th>
          <th>Permissible Limit</th>
          <th>Compliance Status</th>
        </tr>
      </thead>
      <tbody>
        {tests.map((test) => (
          <tr key={test.id}>
            <td className="center">{test.sampleId || ""}</td>
            <td className="left">{test.analyse || test.name || ""}</td>
            <td className="center">{test.result || ""}</td>
            <td className="center">{test.loq || ""}</td>
            <td className="center">{test.permissibleLimit || ""}</td>
            <td className="center">{test.complianceStatus || ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderD4Table = (tests) => (
    <table>
      <thead>
        <tr>
          <th>Mycotoxin</th>
          <th>Detected Level (ppb)</th>
          <th>Allowed Limit (ppb)</th>
          <th>Compliance</th>
        </tr>
      </thead>
      <tbody>
        {tests.map((test) => (
          <tr key={test.id}>
            <td className="left">{test.mycotoxin || test.name || "-"}</td>
            <td className="center">{test.detectedLevel || ""}</td>
            <td className="center">{test.allowedLimit || ""}</td>
            <td className="center">{test.compliance || ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderD5Table = (tests) => (
    <table>
      <thead>
        <tr>
          <th>Chemical Parameter</th>
          <th>Unit</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        {tests.map((test) => (
          <tr key={test.id}>
            <td className="left">{test.parameter || test.name || "-"}</td>
            <td className="center">{test.unit || ""}</td>
            <td className="center">{test.result || ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderD6Table = (tests) => (
    <table>
      <thead>
        <tr>
          <th>Sample ID</th>
          <th>Qualitative Result</th>
          <th>Quantitative Result</th>
          <th>Interpretation</th>
        </tr>
      </thead>
      <tbody>
        {tests.map((test) => (
          <tr key={test.id}>
            <td className="center">{test.sampleId || ""}</td>
            <td className="center">{test.qualitativeResult || ""}</td>
            <td className="center">{test.quantitativeResult || ""}</td>
            <td className="left">{test.interpretation || ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderD7Table = (tests) => (
    <table>
      <thead>
        <tr>
          <th>Sample ID</th>
          <th>Bovine Protein</th>
          <th>Poultry Protein</th>
          <th>Pig Protein</th>
          <th>Interpretation</th>
        </tr>
      </thead>
      <tbody>
        {tests.map((test) => (
          <tr key={test.id}>
            <td className="center">{test.sampleId || ""}</td>
            <td className="center">{test.bovineProtein || ""}</td>
            <td className="center">{test.poultryProtein || ""}</td>
            <td className="center">{test.pigProtein || ""}</td>
            <td className="left">{test.interpretation || ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderD8Table = (tests) => (
    <table>
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Unit</th>
          <th>Result</th>
          <th>Permissible Limit</th>
          <th>Compliance</th>
        </tr>
      </thead>
      <tbody>
        {tests.map((test) => (
          <tr key={test.id}>
            <td className="left">{test.parameter || test.name || "-"}</td>
            <td className="center">{test.unit || ""}</td>
            <td className="center">{test.result || ""}</td>
            <td className="center">{test.permissibleLimit || ""}</td>
            <td className="center">{test.compliance || ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const handlePrint = () => {
    if (!componentRef.current) return;

    const printContent = componentRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Lab Report - ${reportJobs.customerName || "Sample"}</title>
  <style>
    @page { size: A4; margin: 15mm; }

    body {
      font-family: "Courier New", monospace;
      font-size: 12px;
      color: #000;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    @media print {
      .header {
        display: flex;
      }
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      font-weight: bold;
      color: #227029;
    }

    .header img {
    max-width:220px}

    .divider {
      border-top: 1px solid #000;
      margin: 10px 0 15px;
    }

    .report-meta-grid {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-top: 10px;
      font-size: 11px;
    }

    .report-meta-column {
      border: 1px solid #cfcfcf;
      padding: 8px;
    }

    .report-meta-row {
      display: grid;
      grid-template-columns: 170px 1fr;
      gap: 8px;
      padding: 3px 0;
      border-bottom: 1px dashed #e3e3e3;
    }

    .report-meta-row:last-child {
      border-bottom: none;
    }

    .report-meta-label {
      font-weight: bold;
    }

    .report-meta-value {
      text-align: left;
      word-break: break-word;
    }

    .right-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .patient-qr {
      text-align: center;
    }

    .qr-caption {
      font-size: 11px;
      margin-top: 4px;
    }

    .lab-meta {
      width: 100%;
      font-size: 11px;
    }

    .lab-meta div {
      margin-bottom: 4px;
    }

    .clinical-text {
      font-weight: bold;
      white-space: pre-wrap;
    }

    .divider {
      border-top: 1px solid #000;
      margin: 10px 0 15px;
    }


    .results-header {
  margin-top: 1px;
  margin-bottom: 1px;
  font-weight: bold;
  font-size: 14px;
  text-transform: uppercase;
}

    .micro-section-header {
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      margin: 15px 0 5px 0;
      color: #227029;
      border-bottom: 1px solid #ccc;
      padding-bottom: 3px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
    }

    th, td {
      border: 1px solid #ccc;
      padding: 8px;
    }

    th {
      background: #f5f5f5;
    }

    .left {
  text-align: left;
}

.center {
  text-align: center;
  vertical-align: middle; /* vertically centers multi-line content */
}
.comments {
  background-color: #f9f9f9;  /* Light gray background */
  padding: 12px 16px;
  border-radius: 6px;
  margin-top: 16px;
}

.comments h6 {
  font-weight: bold;
  font-size: 14px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.comments p {
  margin: 4px 0;
  font-size: 0.95rem;
  color: #333;
}

    .report-page {
      width: 100%;
      display: block;
      break-after: page;
      page-break-after: always;
      page-break-inside: auto;
    }

    .report-page:last-child {
      break-after: auto;
      page-break-after: auto;
    }

    .disclaimer-page {
      break-before: page;
      page-break-before: always;
    }
  
 .divider {
      border-top: 1px solid #000;
      margin: 10px 0 15px;
    }

    .footer {
      margin-top: 0px;
      font-size: 14px;
    }

    .end {
      text-align: center;
      font-style: italic;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  ${printContent}
</body>
</html>
`);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();

    onCancel();
  };

  useEffect(() => {
    if (displayTests.length) {
      handlePrint();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayTests.length]);

  if (!displayTests.length) {
    return <Typography>No tests selected.</Typography>;
  }

  return (
    <Box
      ref={componentRef}
      sx={{
        position: "relative",
        width: "100%",
        pointerEvents: "auto",
        zIndex: 1,
        opacity: 1,
      }}
    >
      {Object.entries(groupedTests).map(([category, tests]) => (
        <div key={category} className="report-page" style={{ position: "relative", marginBottom: "50px" }}>
          {/* HEADER */}
          <div className="header">
            <img
              src="https://d24naddg1rhy2p.cloudfront.net/67005/127/0/biotechinst_logo_new_2020-03-05_v4.png"
              alt="Biotech Logo"
            />
            <div className="contact">
              <div>30 Golden Stairs, Mt Pleasant</div>
              <div>Harare, Zimbabwe</div>
              <div>Tel: 0785 665 046;0716 402 536/8</div>
              <div>analytics@biotechinst.com</div>
              <div>www.biotechinst.com</div>
            </div>
          </div>

          <div className="divider" />

          <div className="report-meta-grid">
            <div className="report-meta-column">
              <div className="report-meta-row"><span className="report-meta-label">Report Number</span><span className="report-meta-value">{reportJobs.reportNumber}</span></div>
              <div className="report-meta-row"><span className="report-meta-label">Customer Details</span><span className="report-meta-value">{reportJobs.customerDetails}</span></div>
              <div className="report-meta-row"><span className="report-meta-label">Condition Upon Receipt</span><span className="report-meta-value">{reportJobs.conditionUponReceipt}</span></div>
              <div className="report-meta-row"><span className="report-meta-label">No of Samples</span><span className="report-meta-value">{reportJobs.numberOfSamples}</span></div>
              <div className="report-meta-row"><span className="report-meta-label">Parameter(s) Tested</span><span className="report-meta-value">{reportJobs.parametersTested}</span></div>
            </div>
            <div className="report-meta-column">
              <div className="report-meta-row"><span className="report-meta-label">Job Reference Number</span><span className="report-meta-value">{reportJobs.jobRef}</span></div>
              <div className="report-meta-row"><span className="report-meta-label">Date Sampled</span><span className="report-meta-value">{reportJobs.dateSampled}</span></div>
              <div className="report-meta-row"><span className="report-meta-label">Date Analyzed</span><span className="report-meta-value">{reportJobs.dateAnalyzed}</span></div>
              <div className="report-meta-row"><span className="report-meta-label">Date Reported</span><span className="report-meta-value">{reportJobs.dateReported}</span></div>
            </div>
          </div>

      <div className="divider" />

          {/* RESULTS TABLE */}
          <h3 className="results-header">
            {isMicrobiologyCategory(category)
              ? "Microbiology Results"
              : category && category !== "Other"
                ? `Test Results: ${category}`
                : "Test Results"}
          </h3>
          
          {isMicrobiologyCategory(category) ? (
            // Special handling for microbiology categories
            (() => {
              const subTabGroups = tests.reduce((acc, test) => {
                const subTab = test.subTab || "microscopy";
                if (!acc[subTab]) acc[subTab] = [];
                acc[subTab].push(test);
                return acc;
              }, {});

              return Object.entries(subTabGroups).map(([subTab, subTests], index) => (
                <div key={subTab} style={{ marginBottom: "20px" }}>
                  <h4 className="micro-section-header">
                    {subTab.charAt(0).toUpperCase() + subTab.slice(1)} Results
                  </h4>
                  {renderTestTable(subTests, index === 0, true)}
                </div>
              ));
            })()
          ) : isD2ChemistryCategory(category) ? (
            renderD2Table(tests)
          ) : isD3Category(category) ? (
            renderD3Table(tests)
          ) : isD4MycotoxinCategory(category) ? (
            renderD4Table(tests)
          ) : isD5Category(category) ? (
            renderD5Table(tests)
          ) : isD6Category(category) ? (
            renderD6Table(tests)
          ) : isD7Category(category) ? (
            renderD7Table(tests)
          ) : isD8Category(category) ? (
            renderD8Table(tests)
          ) : (
            // Standard table for non-microbiology categories
            renderTestTable(tests)
          )}

          {isD4MycotoxinCategory(category) && (
            <Box sx={{ mt: 1.5 }}>
              <Typography sx={{ fontSize: "0.95rem", fontStyle: "italic" }}>
                NB: ppb: parts per billion
              </Typography>
              <Typography sx={{ fontSize: "0.95rem", fontStyle: "italic" }}>
                *Limits based on EU recommended guidelines. 1 ppb = 1 ug/kg.
              </Typography>
              <Typography sx={{ fontSize: "0.95rem", fontStyle: "italic" }}>
                *Decision rule applied: Detected value must be &lt;= maximum limit for compliance.
              </Typography>
            </Box>
          )}

          {isD6Category(category) && (
            <Box sx={{ mt: 1.5 }}>
              <Typography sx={{ fontSize: "0.95rem", fontStyle: "italic" }}>
                NB: This assay is specific to the CP4 EPSPS protein marker. Genetically modified events or traits not expressing CP4 EPSPS will not be detected. The assay utilizes highly specific immunochemical detection to identify the presence of CP4 EPSPS protein produced by glyphosate-tolerant genetically modified crops.
              </Typography>
              <Typography sx={{ mt: 1.5, fontWeight: 700 }}>
                THRESHOLDS & INTERPRETATION CRITERIA
              </Typography>
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2.5 }}>
                <Typography component="li" sx={{ mb: 0.75 }}>
                  Negative (&lt; 0.1 %): No significant CP4 EPSPS protein detected; sample is considered non-GMO.
                </Typography>
                <Typography component="li" sx={{ mb: 0.75 }}>
                  Low Presence (0.1 % - 2.0 %): CP4 EPSPS detected at trace levels; possible cross-contamination or mixed lots. Regulatory bodies may treat these differently, but they are below the 2 % label-required threshold in many jurisdictions.
                </Typography>
                <Typography component="li">
                  Positive (&gt; 2.0 %): Confirms the sample contains GMO material at levels that typically require labeling or further action, depending on local regulations.
                </Typography>
              </Box>
            </Box>
          )}

          {isD2ChemistryCategory(category) && (
            <Box sx={{ mt: 1.5 }}>
              <Typography sx={{ fontSize: "0.95rem", fontStyle: "italic" }}>
                *TDS - Total Dissolved Solids Note: Specification limits may be based on WHO Drinking Water Guidelines and/or national drinking water standards.
              </Typography>
              <Typography sx={{ mt: 1.5, fontWeight: 700 }}>
                REMARKS
              </Typography>
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2.5 }}>
                <Typography component="li" sx={{ mb: 0.75 }}>
                  Alkalinity exceeded the permissible limit and is therefore <strong>non-compliant</strong> with drinking water specifications.
                </Typography>
                <Typography component="li" sx={{ mb: 0.75 }}>
                  Sulphate complied with the specification if the measured concentration was <strong>&lt;= 250 mg/L</strong>; otherwise, it is non-compliant.
                </Typography>
                <Typography component="li">
                  Parameters marked as <strong>Pending</strong> were not available at the time of report compilation and will be communicated in an addendum once analysis is complete.
                </Typography>
              </Box>
            </Box>
          )}

          {isD7Category(category) && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="h6" sx={{ mt: 1, mb: 1, fontWeight: 700 }}>
                Notes
              </Typography>
              {d7NoteLines.map((line, index) => (
                <Typography key={index} sx={{ whiteSpace: "pre-wrap", mt: 0.5, fontSize: "0.95rem", fontStyle: "italic" }}>
                  • {line}
                </Typography>
              ))}
            </Box>
          )}

          {/* COMMENTS */}
{tests.some((t) => t.comment) && (
  <Box className="comments" sx={{ mt: 2 }}>
    <Typography variant="h6" sx={{ mb: 1 }}>
      Comments
    </Typography>
    {tests
      .filter((t) => t.comment)
      .map((t, i) => (
        <Typography key={i} sx={{ mt: 1 }}>
          • {t.comment}
        </Typography>
      ))}
  </Box>
)}

      <div className="divider" />

      <div className="divider" />

      <div className="disclaimer-page">
        <Typography variant="h4" sx={{ mt: 2, mb: 2, fontWeight: "bold" }}>
          Disclaimer
        </Typography>
        <Box className="comments" sx={{ backgroundColor: "#fff8f0", padding: 2 }}>
          {(isD2ChemistryCategory(category) ? d2DisclaimerSections : disclaimerSections).map((section) => (
            <Box key={section.title} sx={{ mb: 1.5 }}>
              <Typography sx={{ fontWeight: "bold" }}>{section.title}</Typography>
              <Typography sx={{ whiteSpace: "pre-wrap", mt: 0.5, fontSize: "0.9rem" }}>
                {section.text}
              </Typography>
            </Box>
          ))}

          {isMicrobiologyCategory(category) && !isD2ChemistryCategory(category) && (
            <>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Notes
              </Typography>
              {noteLines.map((line, index) => (
                <Typography key={index} sx={{ whiteSpace: "pre-wrap", mt: 0.5, fontSize: "0.9rem" }}>
                  • {line}
                </Typography>
              ))}
            </>
          )}

          {isD5Category(category) && (
            <>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Notes
              </Typography>
              {d5NoteLines.map((line, index) => (
                <Typography key={index} sx={{ whiteSpace: "pre-wrap", mt: 0.5, fontSize: "0.9rem" }}>
                  • {line}
                </Typography>
              ))}
            </>
          )}
        </Box>

          {!isD3Category(category) && !isD7Category(category) && !isD8Category(category) && (
          <MethodsSummaryTable
            rows={isD2ChemistryCategory(category)
              ? D2_CHEMISTRY_METHOD_ROWS
              : isD4MycotoxinCategory(category)
                ? D4_MYCOTOXIN_METHOD_ROWS
                : isD6Category(category)
                  ? D6_GMO_METHOD_ROWS
                : isD5Category(category)
                  ? D5_HEAVY_METAL_METHOD_ROWS
                : isMicrobiologyCategory(category)
                  ? MICROBIOLOGY_METHOD_ROWS
                  : []}
            categoryType={isD2ChemistryCategory(category) ? "d2" : isD4MycotoxinCategory(category) ? "d4" : isD6Category(category) ? "d6" : isD5Category(category) ? "d5" : "microbiology"}
          />
        )}

        <Box sx={{ mt: 3 }}>
          <Typography sx={{ fontWeight: "bold", mb: 1.5, textTransform: "uppercase" }}>
            SIGNATORY APPROVAL
          </Typography>
          <TableContainer sx={{ border: "1px solid #ccc" }}>
            <Table size="small" aria-label="signatory approval table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Role designation</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Name & Title</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Signature</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Reported by:</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                </TableRow>
                <TableRow>
                  <TableCell>Technical review by:</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                </TableRow>
                <TableRow>
                  <TableCell>Quality review by:</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                </TableRow>
                <TableRow>
                  <TableCell>Authorised by:</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </div>
        </div>
      ))}

    </Box>
  );
};

export default ViewResults;