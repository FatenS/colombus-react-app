import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import "chartjs-adapter-date-fns";
import { Row, Col, Table, Card, Button } from "react-bootstrap";
import Select from "react-select";
import { Bar, Line } from "react-chartjs-2";
import html2canvas from "html2canvas";
import PerformanceGrid from "./PerformanceGrid.jsx";
import "./GainsTable.css";
import AdminTcaPage from "./AdminTcaPage";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../../switcher.jsx";
import jsPDF from "jspdf";
import {
  fetchSummary,
  fetchForwardRate,
  fetchSuperperformance,
  fetchBankGains,
} from "../../../store/actions/DashboardActions";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import axiosInstance from "../../../services/AxiosInstance.js";
Chart.register(ChartDataLabels);

// --- Utility Functions ---/* ----------  Locale helpers (put just after your imports) ---------- */
const LOCALE = "fr-FR";          // ASCII dash – no more RangeError!

function formatK(value) {
  const v = +value || 0;
  if (v === 0) return "0 TND";
  return (
    Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(v / 1000) +
    " K TND"
  );
}
/**
 * Nettoie une valeur monétaire et la convertit en nombre.
 *  - accepte "123 456,78", "123 456.78", "123 456 TND", etc.
 */
function toNumeric(val) {
  if (val == null) return 0;

  // 1) on garde chiffres, point, virgule, signe moins
  let cleaned = String(val).replace(/[^\d.,-]/g, "");

  // 2) on enlève les espaces fines ou normales
  cleaned = cleaned.replace(/\s/g, "");

  // 3) si le séparateur décimal est une virgule → on la remplace par un point
  const comma = cleaned.lastIndexOf(",");
  const dot   = cleaned.lastIndexOf(".");
  if (comma > dot) cleaned = cleaned.replace(",", ".");

  return parseFloat(cleaned) || 0;
}

/**
 * Formate un montant.
 * @param val       valeur d'origine (string ou number)
 * @param decimals  nb de décimales désiré
 * @param locale    "fr-FR", "en-US"…
 */
function fmtMontant(val, decimals = 0, locale = "fr-FR") {
  const n = toNumeric(val);
  return Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}



// Formats a number as "XYZ K TND" if >= 1000, otherwise "XYZ TND"
function formatNoDecimalNoTriangle(value) {
  const val = Math.round(Number(value) || 0);
  return val >= 1000 ? `${Math.round(val / 1000)} K TND` : `${val} TND`;
}
// Similar formatter for short labels
function formatNoDecimal(value) {
  const val = Math.round(Number(value) || 0);
  return val >= 1000 ? `${val} K TND` : `${val} TND`;
}

function getCurrentYearMonth() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function uniqueDataset(data, key, dateKey = "date") {
  const seenDates = new Set();
  const filteredData = [];
  data.forEach((item) => {
    const date = item[dateKey];
    const value = item[key];
    if (date && value != null && !seenDates.has(date)) {
      filteredData.push({ x: date, y: value });
      seenDates.add(date);
    }
  });
  return filteredData.sort((a, b) => new Date(a.x) - new Date(b.x));
}

const monthOrder = [
  "January", "February", "March", "April", "May",
  "June", "July", "August", "September", "October",
  "November", "December",
];

function sortMonths(months = [], arr1 = [], arr2 = []) {
  const monthMap = {
    January: 0, February: 1, March: 2,
    April: 3, May: 4, June: 5,
    July: 6, August: 7, September: 8,
    October: 9, November: 10, December: 11,
  };
  const combined = months.map((label, i) => {
    const [monthStr, yearStr] = label.trim().split(/\s+/);
    const month = monthMap[monthStr] ?? 99;
    const year = parseInt(yearStr, 10);
    return {
      original: label,
      idx: i,
      sortKey: year * 12 + month,
      val1: arr1[i],
      val2: arr2[i],
    };
  });
  combined.sort((a, b) => a.sortKey - b.sortKey);
  return {
    sortedMonths: combined.map((c) => c.original),
    sortedArr1: combined.map((c) => c.val1),
    sortedArr2: combined.map((c) => c.val2),
  };
}

function hasAtLeast2Points(arr = []) {
  return arr.filter((v) => v != null).length >= 2;
}

// --- Component ---

const Market = () => {
const { t, i18n } = useTranslation();        
const LOCALE = i18n.language === "en" ? "en-US" : "fr-FR";
  const dispatch = useDispatch();
  const pdfRef = useRef(null);
  const [pdfMode, setPdfMode] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState({ label: "USD", value: "USD" });
  const [interbankRates, setInterbankRates] = useState([]);
  const { summary, forwardRate, superperformanceTrend, bankGains } = useSelector(
    (state) => state.dashboard
  );

  useEffect(() => {
    dispatch(fetchSummary(selectedCurrency.value));
    dispatch(fetchForwardRate(selectedCurrency.value));
    dispatch(fetchSuperperformance(selectedCurrency.value));
    dispatch(fetchBankGains(selectedCurrency.value));
  }, [dispatch, selectedCurrency]);

  // ─── inter-bank daily rates ────────────────────────────────────────────
useEffect(() => {
  const loadInterbankRates = async () => {
    try {
      const { data } = await axiosInstance.get("/get-interbank-rates");
      if (Array.isArray(data)) setInterbankRates(data);
    } catch (err) {
      console.error("Cannot load interbank rates:", err);
    }
  };

  loadInterbankRates();
}, []);

  
  const superperformanceTrendArray = Array.isArray(superperformanceTrend)
    ? superperformanceTrend
    : [];
  const forwardRateArray = Array.isArray(forwardRate) ? forwardRate : [];

  // Sort monthly data from summary
  const { sortedMonths, sortedArr1, sortedArr2 } = sortMonths(
    summary.months || [],
    summary.monthlyTotalTransacted || [],
    summary.monthlyTotalGain || []
  );

  // To keep the triangle marker at a consistent position, we use the same values as the bar.
  // (The label will show the actual gain.)
  const gainData = sortedArr1;
  const grossGainMtd = sortedArr2.at(-1) ?? 0;   // 4 K for May

  // --- Bar Chart Options ---
  /* ------------------------------------------------------------------ */
/* 1)  BAR CHART OPTIONS  – replace the whole optionsBar object       */
/* ------------------------------------------------------------------ */
/* ----------  Bar‑chart options (overwrite your current optionsBar) ---------- */
const optionsBar = {
  responsive: true,
  maintainAspectRatio: false,
  aspectRatio: 1.3,

  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#001247", maxRotation: 45, minRotation: 45 }
    },
    y: {
      beginAtZero: true,
      grace: "10%",
      grid: { display: false },
      ticks: {
        color: "#001247",
        callback: formatK
      }
    }
  },

  layout: {
    padding: { top: 40, bottom: 10, left: 5, right: 5 }  // Increased top padding for legend spacing
  },

  elements: {
    bar: { borderSkipped: false }
  },

  plugins: {
    legend: {
      position: 'bottom',
      align: 'center',
      labels: {
        usePointStyle: true,
        font: {
          size: 12,
          weight: 'bold',
          family: "Calibri, sans-serif"
        },
        padding: 20, // Adds space between legend and chart
        generateLabels: (chart) =>
          chart.data.datasets.map((d, i) => ({
            text: d.label,
            fillStyle: d.backgroundColor,
            strokeStyle: d.borderColor,
            hidden: !chart.isDatasetVisible(i),
            index: i,
            pointStyle: d.label === "Gain en TND" ? "triangle" : "rectRounded"
          }))
      }
    },

    tooltip: {
      callbacks: {
        label: (ctx) => {
          const i = ctx.dataIndex;
          return ctx.dataset.label === "Gain en TND"
            ? `Gain en TND : ${formatK(sortedArr2[i] || 0)}`
            : `Montant en TND : ${formatK(sortedArr1[i] || 0)}`;
        }
      }
    },

    datalabels: {
      display: (ctx) => ctx.dataset.label === "Gain en TND",
      anchor: "start",
      align: "start",
      offset:-36,
      backgroundColor: "#d9d9d9",
      borderRadius: 4,
      padding: { left: 4, right: 4, top: 1, bottom: 2 },
      color: "#001247",
      font: { family: "Calibri, sans-serif", size: 8, weight: "bold" },
      formatter: (v, ctx) => formatK(sortedArr2[ctx.dataIndex] || 0)
    }
  },

  animation: {
    duration: 800,
    easing: "easeInOutQuart"
  }
};

/* ------------- helpers for Excel‑style triangles ------------------ */
const TRIANGLE_BLUE = "#9ab3d2";                // lighter blue
const triangleData = sortedArr1.map(v => v * 1.12);      // +12 %

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* 2)  BAR CHART DATA  – replace monthlyBarChartData                  */
/* ------------------------------------------------------------------ */
const monthlyBarChartData = {
  labels: sortedMonths,          // keep your month list
  datasets: [
    {
      label: t('lblAmountTnd'),
      data: sortedArr1,
      backgroundColor: "#00194d",   // darker navy
      borderColor: "#00194d",
      borderWidth: 1,
      type: "bar",
      order: 1
    },
    {
      label: t('lblGainTnd'),
      data: triangleData,               // same y‑value as bar so the triangle sits on top
      borderColor: TRIANGLE_BLUE,
      backgroundColor: TRIANGLE_BLUE,
      type: "line",
      fill: false,
      showLine: false,
      pointStyle: "triangle",
      pointRadius: 6,
      pointHoverRadius: 8,
      order: 2
    }
  ]
};


  // --- Bar Chart Data ---
 

  const allForwardVals = forwardRateArray
    .flatMap((f) => [
      f.secured_forward_rate_export,
      f.market_forward_rate_export,
      f.secured_forward_rate_import,
      f.market_forward_rate_import,
    ])
    .filter((v) => v != null);

  const hasExportOrders =
    superperformanceTrendArray.some(item => item.execution_rate_export != null) ||
    forwardRateArray.some(item => item.secured_forward_rate_export != null || item.market_forward_rate_export != null);
  const hasImportOrders =
    superperformanceTrendArray.some(item => item.execution_rate_import != null) ||
    forwardRateArray.some(item => item.secured_forward_rate_import != null || item.market_forward_rate_import != null);

  const skipSameDateSegment = {
    borderColor: (ctx) =>
      ctx.p0.parsed.x === ctx.p1.parsed.x ? "transparent" : undefined,
  };

  const optionsLine = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1.3,
    scales: {
      x: {
        type: "time",
        time: { unit: "day", tooltipFormat: "yyyy-MM-dd", displayFormats: { day: "yyyy-MM-dd" } },
        grid: { display: false },
        ticks: { color: "#001247" },
        title: { display: true, text: "Transaction Date", color: "#001247" },
      },
      y: {
        beginAtZero: false,
        grid: { display: false },
        ticks: { color: "#001247" },
      },
    },
    tension: 0.3,
    plugins: {
      legend: { labels: { font: { family: "Calibri, sans-serif" }, color: "#001247" } },
      datalabels: { display: false },
    },
    animation: { duration: 800, easing: "easeInOutQuart" },
    elements: { line: { segment: skipSameDateSegment } },
  };

  const superExecExport = uniqueDataset(superperformanceTrendArray, "execution_rate_export");
  const superExecImport = uniqueDataset(superperformanceTrendArray, "execution_rate_import");
  const superInterbank = uniqueDataset(superperformanceTrendArray, "interbank_rate");

  // ---------- tighten the Y range so the two curves separate ----------
const PAD          = 0.003;                                       // 0.3 ‰
const allExpValues = [...superExecExport, ...superInterbank].map(d => d.y);
const yMinExport   = Math.min(...allExpValues) - PAD;
const yMaxExport   = Math.max(...allExpValues) + PAD;

const allImpValues = [...superExecImport, ...superInterbank].map(d => d.y);
const yMinImport   = Math.min(...allImpValues) - PAD;
const yMaxImport   = Math.max(...allImpValues) + PAD;
// --------------------------------------------------------------------

// --- min / max helpers for separate scaling (export & import)
const minExecExp = Math.min(...superExecExport.map(d => d.y));
const maxExecExp = Math.max(...superExecExport.map(d => d.y));
const minIBExp   = Math.min(...superInterbank.map(d => d.y));
const maxIBExp   = Math.max(...superInterbank.map(d => d.y));

const minExecImp = Math.min(...superExecImport.map(d => d.y));
const maxExecImp = Math.max(...superExecImport.map(d => d.y));

const optionsLineSuperExport = {
  ...optionsLine,
  scales: {
    x: optionsLine.scales.x,          // keep the existing X axis
    y: {
      beginAtZero : false,
      min         : yMinExport,
      max         : yMaxExport,
      ticks       : { color: "#001247", stepSize: 0.01 }   // stepSize optional
    }
  }
};

const optionsLineSuperImport = {
  ...optionsLine,
  scales: {
    x: optionsLine.scales.x,
    y: {
      beginAtZero : false,
      min         : yMinImport,
      max         : yMaxImport,
      ticks       : { color: "#001247", stepSize: 0.01 }
    }
  }
};

  const superperformanceExportChartData = {
    datasets: [
      {
        label: t('lblExecExport'),
        data: superExecExport,
        borderColor: "#007bff",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        spanGaps: false,
        pointRadius: superExecExport.length > 0 && superInterbank.length <= 2 ? 4 : 0,
        pointHoverRadius: superExecExport.length > 0 && superInterbank.length <= 2 ? 5 : 0,
      },
      {
        label: t('lblInterbank'),
        data: superInterbank,
        borderColor: "#ff7f50",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        borderDash: [5, 5],
        spanGaps: false,
        pointRadius: superExecExport.length > 0 && superInterbank.length <= 2 ? 4 : 0,
        pointHoverRadius: superExecExport.length > 0 && superInterbank.length <= 2 ? 5 : 0,
      },
    ],
  };

  const superperformanceImportChartData = {
    datasets: [
      {
        label: t('lblExecImport'),
        data: superExecImport,
        borderColor: "#28a745",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        spanGaps: false,
        pointRadius: superExecImport.length > 0 && superInterbank.length <= 2 ? 4 : 0,
        pointHoverRadius: superExecImport.length > 0 && superInterbank.length <= 2 ? 5 : 0,
      },
      {
        label: t('lblInterbank'),
        data: superInterbank,
        borderColor: "#ff7f50",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        borderDash: [5, 5],
        spanGaps: false,
        pointRadius: superExecImport.length > 0 && superInterbank.length <= 2 ? 4 : 0,
        pointHoverRadius: superExecImport.length > 0 && superInterbank.length <= 2 ? 5 : 0,
      },
    ],
  };

  const securedExportData = uniqueDataset(forwardRateArray, "secured_forward_rate_export", "transaction_date");
  const marketExportData = uniqueDataset(forwardRateArray, "market_forward_rate_export", "transaction_date");
  const securedImportData = uniqueDataset(forwardRateArray, "secured_forward_rate_import", "transaction_date");
  const marketImportData = uniqueDataset(forwardRateArray, "market_forward_rate_import", "transaction_date");

  const forwardRateExportChartData = {
    datasets: [
      {
        label: t('lblSecForwardExport'),
        data: securedExportData,
        borderColor: "#007bff",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: allForwardVals.length <= 2 ? 4 : 0,
        pointHoverRadius: allForwardVals.length <= 2 ? 5 : 0,
      },
      {
        label: "Market Forward Rate - Export",
        data: marketExportData,
        borderColor: "#ffc107",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: allForwardVals.length <= 2 ? 4 : 0,
        pointHoverRadius: allForwardVals.length <= 2 ? 5 : 0,
      },
    ],
  };

  const forwardRateImportChartData = {
    datasets: [
      {
        label: "Secured Forward Rate - Import",
        data: securedImportData,
        borderColor: "#28a745",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: allForwardVals.length <= 2 ? 4 : 0,
        pointHoverRadius: allForwardVals.length <= 2 ? 5 : 0,
      },
      {
        label: "Market Forward Rate - Import",
        data: marketImportData,
        borderColor: "#dc3545",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: allForwardVals.length <= 2 ? 4 : 0,
        pointHoverRadius: allForwardVals.length <= 2 ? 5 : 0,
      },
    ],
  };

  const baseForwardOptions = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1.3,
    scales: {
      x: {
        type: "time",
        time: {
          unit: "day",
          tooltipFormat: "yyyy-MM-dd",
          displayFormats: { day: "yyyy-MM-dd" },
        },
        title: { display: true, text: "Transaction Date", color: "#001247" },
        grid: { display: false },
        ticks: { color: "#001247" },
      },
      y: { beginAtZero: false, grid: { display: false }, ticks: { color: "#001247" } },
    },
    plugins: {
      tooltip: {
        enabled: true,
        callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(4)}` },
      },
      legend: { labels: { font: { family: "Calibri, sans-serif" }, color: "#001247" } },
      datalabels: { display: false },
    },
    animation: { duration: 800, easing: "easeInOutQuart" },
    elements: { line: { segment: skipSameDateSegment } },
  };

  const optionsLineForwardExport = {
    ...baseForwardOptions,
    scales: {
      ...baseForwardOptions.scales,
      y: {
        ...baseForwardOptions.scales.y,
        min: Math.min(...securedExportData.map((d) => d.y), ...marketExportData.map((d) => d.y)) * 0.98,
        max: Math.max(...securedExportData.map((d) => d.y), ...marketExportData.map((d) => d.y)) * 1.02,
      },
    },
  };

  const optionsLineForwardImport = {
    ...baseForwardOptions,
    scales: {
      ...baseForwardOptions.scales,
      y: {
        ...baseForwardOptions.scales.y,
        min: Math.min(...securedImportData.map((d) => d.y), ...marketImportData.map((d) => d.y)) * 0.98,
        max: Math.max(...securedImportData.map((d) => d.y), ...marketImportData.map((d) => d.y)) * 1.02,
      },
    },
  };

  const pdfContainerStyle = pdfMode
    ? {
        width: "1400px",
        height: "1980px",
        margin: "0 auto",
        padding: "20px",
        backgroundColor: "#fff",
        fontFamily: "Calibri, sans-serif",
      }
    : {
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        fontFamily: "Calibri, sans-serif",
      };

  const pdfPageStyle = pdfMode
    ? {
        height: "990px",
        overflow: "hidden",
        pageBreakAfter: "always",
        padding: "20px",
        boxSizing: "border-box",
      }
    : {};

  const chartHeight = pdfMode ? "250px" : "340px";
  const currentYearMonth = getCurrentYearMonth();
  // const displayedBankGains = pdfMode
  //   ? bankGains.filter((item) => item.month === currentYearMonth)
  //   : bankGains;

  // const displayedBankGains = bankGains.filter((row) => {
  //   const dateStr = row["Date Transaction"];
  //   const parts = dateStr?.split("/");
  //   return parts?.[2] === "2025";
  // });
  
  const displayedBankGains = bankGains;

  const showExportChart = hasExportOrders && superExecExport.length > 0;
  const showImportChart = hasImportOrders && superExecImport.length > 0;
  const showForwardExportChart =
  securedExportData.length > 0 || marketExportData.length > 0;
  const showForwardImportChart =
  securedImportData.length > 0 || marketImportData.length > 0;
  
  const handleDownloadPdf = async () => {
    setPdfMode(true);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const pdf = new jsPDF("landscape", "mm", "a4");
    const pages = pdfRef.current.querySelectorAll(".pdf-page");
    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    }
    pdf.save(`Dashboard_${new Date().toISOString().slice(0, 10)}.pdf`);
    setPdfMode(false);
  };
  function formatPositiveNumber(val, isPercent = false) {
    if (!val) return "";
  
    // Remove non-numeric characters except for comma, dot and minus
    let cleaned = val
      .toString()
      .replace(/[^\d,.\-]/g, "")   // Remove units like 'TND', thin spaces, etc.
      .replace(",", ".");          // Convert comma to dot for decimal
  
    let num = Number(cleaned);
    if (isNaN(num)) return "";
  
    return isPercent
      ? `${Math.abs(num).toFixed(2)}%`
      : Math.abs(num).toFixed(2);
  }
  
  return (
    <>
      <div className="text-end me-3 mt-2">
        <Button variant="primary" onClick={handleDownloadPdf}>
          {t("downloadPdf")}   {/* exact même nom que dans i18n.js */}

        </Button>
      </div>
      <LanguageSwitcher />
      <div ref={pdfRef} className={pdfMode ? "" : "container-fluid"} style={pdfContainerStyle}>
        <div className="pdf-page" style={pdfPageStyle}>
          <Row className="mb-2" style={{ margin: 0 }}>
            <Col md={12}>
              <h3 className="text-center" style={{ fontWeight: 600, color: "#001247" }}>
                 {t("titleReport")}
              </h3>
            </Col>
          </Row>
          {!pdfMode && (
            <Row className="mb-2">
              <Col md={4}>
                <Select
                  className="custom-react-select"
                  options={[
                    { label: "USD", value: "USD" },
                    { label: "EUR", value: "EUR" },
                  ]}
                  value={selectedCurrency}
                  onChange={setSelectedCurrency}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: "#ced4da",
                      boxShadow: "none",
                      "&:hover": { borderColor: "#ced4da" },
                      fontFamily: "Calibri, sans-serif",
                      color: "#001247",
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: "#001247",
                      fontFamily: "Calibri, sans-serif",
                    }),
                    menu: (base) => ({
                      ...base,
                      fontFamily: "Calibri, sans-serif",
                      color: "#001247",
                    }),
                  }}
                />
              </Col>
            </Row>
          )}
          <Row className="mb-2 align-items-stretch">
          <Col md={6} className="mb-2">
  <Card className="pb-wrapper">
    <Card.Body style={{ padding: 0 }}>
   
<PerformanceGrid
   s={{ ...summary, gross_gain_mtd: grossGainMtd }}  // ← inject one extra field
   currency={selectedCurrency.value}
   pdf={pdfMode}
 />


    </Card.Body>
  </Card>
</Col>


            <Col md={6} className="mb-2">
              <Card className="shadow-sm" style={{ border: "1px solid #ccc" }}>
                <Card.Body className="d-flex flex-column align-items-center justify-content-center p-2">
                  <Card.Title className="text-center" style={{ fontSize: "1rem", fontWeight: 500, color: "#001247", textTransform: "none", margin: "5px" }}>
                  {t("totalTradedGain")}
                  </Card.Title>
                  <div style={{ height: "300px", width: "100%" }}>
                    <Bar data={monthlyBarChartData} options={optionsBar} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <p style={{ fontSize: "0.9rem",color:"#003366", fontFamily: "Calibri, sans-serif", fontWeight: "bold", fontStyle: "italic" }}>
            {t("gainFootnote")}

              <br />
            </p>
          </Row>
          {(hasExportOrders || hasImportOrders) && (
            <Row className="mb-2" style={{ padding: "10px" }}>
              {showExportChart && (
                <Col md={showExportChart && !showImportChart ? 12 : 6} className="mb-2">

                  <Card className="shadow-sm" style={{ border: "1px solid #ccc" }}>
                    <Card.Body>
                      <Card.Title className="text-center" style={{ fontSize: "1rem", fontWeight: 500, color: "#001247", textTransform: "none", margin: "5px" }}>
                      {t("exportSuper")}
                      </Card.Title>
                      <div style={{ height: chartHeight }}>
                        <Line data={superperformanceExportChartData} options={optionsLineSuperExport} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              )}
              { showImportChart && (
                <Col md={ showImportChart && ! showExportChart? 12 : 6} className="mb-2">
                
                  <Card className="shadow-sm" style={{ border: "1px solid #ccc" }}>
                    <Card.Body>
                      <Card.Title className="text-center" style={{ fontSize: "1rem", fontWeight: 500, color: "#001247", textTransform: "none", margin: "5px" }}>
                        {t("importSuper")}
                      </Card.Title>
                      <div style={{ height: chartHeight }}>
                        <Line data={superperformanceImportChartData} options={optionsLineSuperImport} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              )}
            </Row>
          )}
        </div>
        <div className="pdf-page" style={pdfPageStyle}>
          <Row className="mb-2">
          {showForwardExportChart && (
          <Col md={showForwardExportChart && !showForwardImportChart ? 12 : 6} className="mb-2">
                <Card className="shadow-sm" style={{ border: "1px solid #ccc" }}>
                  <Card.Body>
                    <Card.Title className="text-center" style={{ fontSize: "1rem", fontWeight: 500, color: "#001247", textTransform: "none", margin: "5px" }}>
                                          {t("forwardExport")}
                    </Card.Title>
                    <div style={{ height: chartHeight }}>
                      <Line data={forwardRateExportChartData} options={optionsLineForwardExport} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )}
            {showForwardImportChart && ( 
              <Col md={showForwardImportChart && !showForwardExportChart ? 12 : 6} className="mb-2">
                <Card className="shadow-sm" style={{ border: "1px solid #ccc" }}>
                  <Card.Body>
                    <Card.Title className="text-center" style={{ fontSize: "1rem", fontWeight: 500, color: "#001247", textTransform: "none", margin: "5px" }}>
                    {t("forwardImport")}
                    </Card.Title>
                    <div style={{ height: chartHeight }}>
                      <Line data={forwardRateImportChartData} options={optionsLineForwardImport} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )}
            <p style={{ fontSize: "0.9rem", fontFamily: "Calibri, sans-serif", fontWeight: "bold", fontStyle: "italic" , color: "#003366"}}>
              ** Il est important de souligner que le marché interbancaire est exclusivement destiné aux banques. Toutefois, les taux que nous avons négociés pour les imports ont, dans{" "}
              {summary.superformance_rate !== undefined ? summary.superformance_rate.toFixed(0) : "72"}
              % des cas, surpassé le taux interbancaire.
            </p>
      
          
          </Row>
          <Row>
            <Col>
              <Card className="shadow-sm" style={{ border: "1px solid #ccc" }}>
                <Card.Body>
                  <Card.Title className="text-center" style={{ fontSize: "1rem", fontWeight: 500, color: "#001247", textTransform: "none", margin: "5px" }}>
                    {t("gainsTable")}
                  </Card.Title>
                  <div style={{ maxHeight: pdfMode ? "none" : "300px", overflowY: pdfMode ? "visible" : "auto" }}>
                  <Table    className="gains-table"

  striped
  bordered
  hover
  responsive
  style={{
    borderCollapse: "collapse",
  }}
>
  <thead>
    <tr style={{ color: "#001247" }}>
      <th style={{ padding: "4px 6px", lineHeight: "1.1" }}>{t("thDateTx")}</th>
      <th style={{ padding: "4px 6px", lineHeight: "1.1" }}>{t("thDateVal")}</th>
      <th style={{ padding: "4px 6px", lineHeight: "1.1" }}>{t("thDevise")}</th>
      <th style={{ padding: "4px 6px", lineHeight: "1.1" }}>{t("thType")}</th>
      <th style={{ padding: "4px 6px", lineHeight: "1.1" }}>{t("thTypeOp")}</th>
      <th style={{ padding: "4px 6px", lineHeight: "1.1" }}>{t("thAmount")}</th>
      <th style={{ padding: "4px 6px", lineHeight: "1.1" }}>{t("thBank")}</th>
      <th style={{ padding: "4px 6px", lineHeight: "1.1" }}>{t("thRefRate")}</th>
      <th style={{ padding: "4px 6px", lineHeight: "1.1" }}>{t("thExecRate")} </th>
      <th style={{ padding: "4px 6px", lineHeight: "1.1" }}>{t("thGain")}</th>
      <th style={{ padding: "4px 6px", lineHeight: "1.1" }}>{t("thPctGain")}</th>
      <th style={{ padding: "4px 6px", lineHeight: "1.1" }}>{t("thCommission")}</th>
      <th style={{ padding: "4px 6px", lineHeight: "1.1" }}>{t("thCommGain")}</th>
    </tr>
  </thead>
  <tbody>
    
    {displayedBankGains.length ? (
      displayedBankGains.map((row, i) => (
        <tr key={i}>
          <td style={{ padding: "4px 6px", lineHeight: "1.2" }}>{row["Date Transaction"]}</td>
          <td style={{ padding: "4px 6px", lineHeight: "1.2" }}>{row["Date Valeur"]}</td>
          <td style={{ padding: "4px 6px", lineHeight: "1.2" }}>{row["Devise"]}</td>
          <td style={{ padding: "4px 6px", lineHeight: "1.2" }}>{row["Type"]}</td>
          <td style={{ padding: "4px 6px", lineHeight: "1.2" }}>{row["Type d’opération"]}</td>
          <td style={{ padding: "4px 6px", lineHeight: "1.2" }}> {fmtMontant(row["Montant"], 0, LOCALE)}</td>
          <td style={{ padding: "4px 6px", lineHeight: "1.2" }}>{row.Banque}</td>
          <td style={{ padding: "4px 6px", lineHeight: "1.2" }}>{row["Taux de référence *"]}</td>
          <td style={{ padding: "4px 6px", lineHeight: "1.2" }}>{row["Taux d’exécution"]}</td>
          <td style={{ padding: "4px 6px", lineHeight: "1.2" }}>
          {fmtMontant( formatPositiveNumber(row["Gain**"]), 0, LOCALE)} 
</td>
<td style={{ padding: "4px 6px", lineHeight: "1.2" }}>
  {formatPositiveNumber(row["% Gain"], true)}

</td>

          <td style={{ padding: "4px 6px", lineHeight: "1.2" }}>            {fmtMontant( formatPositiveNumber(row["Commission CC ***"]), 0, LOCALE)} 
         </td>
          <td style={{ padding: "4px 6px", lineHeight: "1.2" }}>{row["Commission % de gain"]}
  {/* {!isNaN(parseFloat(row["Commission % de gain"]))
    ? `${(parseFloat(row["Commission % de gain"]))}%`
    : "--"} */}
</td>

        </tr>
      ))
    ) : (
      <tr>
        <td colSpan={8} className="text-center" style={{ padding: "6px", color: "#001247" }}>
           {t("noData")}
        </td>
      </tr>
    )}
  </tbody>
</Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <p style={{ fontSize: "0.9rem", fontFamily: "Calibri, sans-serif", fontWeight: "bold", fontStyle: "italic" , color: "#003366"}}>

  <br />
  {t("commissionFootnote")}
            </p>
        </div>

      </div>
    </>
  );
};

export default Market;
