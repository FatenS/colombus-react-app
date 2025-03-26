import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import "chartjs-adapter-date-fns";
import { Row, Col, Table, Card, Tooltip, OverlayTrigger, Button } from "react-bootstrap";
import Select from "react-select";
import { Bar, Line } from "react-chartjs-2";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  fetchSummary,
  fetchForwardRate,
  fetchSuperperformance,
  fetchBankGains,
} from "../../../store/actions/DashboardActions";

// Chart.js + DataLabels
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
Chart.register(ChartDataLabels);

// Helper: get current YYYY-MM
function getCurrentYearMonth() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// Helper: known months in chronological order
const monthOrder = [
  "janv", "févr", "mars", "avril", "mai",
  "juin", "juil", "août", "sept", "oct",
  "nov", "déc",
];

// Sort months + associated data arrays
function sortMonths(months = [], arr1 = [], arr2 = []) {
  const combined = months.map((m, i) => ({
    month: m.toLowerCase(),
    idx: i,
    val1: arr1[i],
    val2: arr2[i],
  }));

  combined.sort((a, b) => {
    const aIndex = monthOrder.findIndex((x) => a.month.includes(x));
    const bIndex = monthOrder.findIndex((x) => b.month.includes(x));
    // if not found => push to end
    return (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex);
  });

  return {
    sortedMonths: combined.map((c) => months[c.idx]),
    sortedArr1: combined.map((c) => c.val1),
    sortedArr2: combined.map((c) => c.val2),
  };
}

// Format Gains with no decimal fraction => “▲ 300 TND” or “▲ 4K TND”
function formatNoDecimal(value) {
  const val = Math.round(Number(value) || 0); // no decimals
  if (val >= 1000) {
    return `▲ ${Math.round(val / 1000)}K TND`; // e.g. “▲ 4K TND”
  }
  return `▲ ${val} TND`;
}

const Market = () => {
  const dispatch = useDispatch();
  const pdfRef = useRef(null);

  const [pdfMode, setPdfMode] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState({ label: "USD", value: "USD" });
  const [interbankRates, setInterbankRates] = useState([]);

  // Redux store data
  const { summary, forwardRate, superperformanceTrend, bankGains } = useSelector(
    (state) => state.dashboard
  );

  // On currency change => fetch data
  useEffect(() => {
    dispatch(fetchSummary(selectedCurrency.value));
    dispatch(fetchForwardRate(selectedCurrency.value));
    dispatch(fetchSuperperformance(selectedCurrency.value));
    dispatch(fetchBankGains(selectedCurrency.value));
  }, [dispatch, selectedCurrency]);

  // Optionally fetch interbank rates once
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    fetch("/get-interbank-rates", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setInterbankRates(data);
        } else {
          console.error("Unexpected data format:", data);
        }
      })
      .catch((err) => console.error("Error fetching interbank rates:", err));
  }, []);

  // “superperformanceTrendArray” & “forwardRateArray” are arrays
  const superperformanceTrendArray = Array.isArray(superperformanceTrend)
    ? superperformanceTrend
    : [];
  const forwardRateArray = Array.isArray(forwardRate) ? forwardRate : [];

  //----------------------------------------------------------------
  // Bar chart for “Total transigé & gain total”
  //----------------------------------------------------------------

  const { sortedMonths, sortedArr1, sortedArr2 } = sortMonths(
    summary.months || [],
    summary.monthlyTotalTransacted || [],
    summary.monthlyTotalGain || []
  );

  const monthlyBarChartData = {
    labels: sortedMonths,
    datasets: [
      {
        label: "Montant en TND",
        data: sortedArr1,
        backgroundColor: "#001247",
        borderColor: "#315f82",
        borderWidth: 1,
        stack: "combined",
      },
      {
        label: "Gain en TND",
        data: sortedArr2,
        backgroundColor: "rgba(70, 130, 180, 0.6)",
        borderColor: "#315f82",
        borderWidth: 1,
        stack: "combined",
      },
    ],
  };

  // Show label only for Gains => if dataset label is “Gain en TND”
  const optionsBar = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1.3,
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: "#001247" },
      },
      y: {
        beginAtZero: true,
        stacked: true,
        grid: { display: false },
        ticks: {
          callback: (val) => `${val.toLocaleString()} TND`,
          color: "#001247",
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          font: { family: "Calibri, sans-serif" },
          color: "#001247",
        },
      },
      datalabels: {
        display: (ctx) => ctx.dataset.label === "Gain en TND",
        align: "end",
        anchor: "end",
        color: "#333",
        font: {
          family: "Calibri, sans-serif",
          size: 10,
        },
        formatter: (val) => formatNoDecimal(val), // e.g., “▲ 315 TND” or “▲ 4K TND”
      },
    },
    layout: {
      padding: { top: 10, bottom: 10, left: 10, right: 10 },
    },
    animation: { duration: 800, easing: "easeInOutQuart" },
  };

  //----------------------------------------------------------------
  // Line charts (superperformance, forward rates)
  //----------------------------------------------------------------

  // Hide line chart data labels => datalabels: { display: false }
  const skipSameDateSegment = {
    borderColor: (ctx) => {
      const { p0, p1 } = ctx;
      if (p0.parsed.x === p1.parsed.x) return "transparent";
      return undefined;
    },
  };

  // 1) Superperformance chart
  const superPerfValues = superperformanceTrendArray
    .flatMap((item) => [
      item.execution_rate_export,
      item.execution_rate_import,
      item.interbank_rate,
    ])
    .filter((v) => v !== null && v !== undefined);

  const superPerfMin = superPerfValues.length ? Math.min(...superPerfValues) : 0;
  const superPerfMax = superPerfValues.length ? Math.max(...superPerfValues) : 1;

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
        grid: { display: false },
        beginAtZero: false,
        min: superPerfMin * 0.98,
        max: superPerfMax * 1.02,
        ticks: { color: "#001247" },
      },
    },
    tension: 0.3,
    plugins: {
      legend: {
        labels: { font: { family: "Calibri, sans-serif" }, color: "#001247" },
      },
      datalabels: { display: false },
    },
    animation: { duration: 800, easing: "easeInOutQuart" },
    elements: { line: { segment: skipSameDateSegment } },
  };

  const superperformanceChartData = {
    labels: superperformanceTrendArray.map((item) => item.date),
    datasets: [
      {
        label: "Taux d'exécution export",
        data: superperformanceTrendArray.map((item) => item.execution_rate_export),
        borderColor: "#007bff",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 5,
      },
      {
        label: "Taux d'exécution import",
        data: superperformanceTrendArray.map((item) => item.execution_rate_import),
        borderColor: "#28a745",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 5,
      },
      {
        label: "Taux interbancaire",
        data: superperformanceTrendArray.map((item) => item.interbank_rate),
        borderColor: "#ff7f50",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        borderDash: [5, 5],
        pointRadius: 4,
        pointHoverRadius: 5,
      },
    ],
  };

  // 2) Forward rates line chart
  const allForwardVals = forwardRateArray
    .flatMap((f) => [
      f.secured_forward_rate_export,
      f.market_forward_rate_export,
      f.secured_forward_rate_import,
      f.market_forward_rate_import,
    ])
    .filter((v) => v != null);

  const minRate = allForwardVals.length ? Math.min(...allForwardVals) : 0;
  const maxRate = allForwardVals.length ? Math.max(...allForwardVals) : 1;

  const securedExportData = forwardRateArray.map((item) => item.secured_forward_rate_export);
  const marketExportData = forwardRateArray.map((item) => item.market_forward_rate_export);
  const securedImportData = forwardRateArray.map((item) => item.secured_forward_rate_import);
  const marketImportData = forwardRateArray.map((item) => item.market_forward_rate_import);

  const optionsLineDynamic = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1.3,
    scales: {
      x: {
        type: "time",
        time: { unit: "day", tooltipFormat: "yyyy-MM-dd", displayFormats: { day: "yyyy-MM-dd" } },
        title: { display: true, text: "Transaction Date", color: "#001247" },
        grid: { display: false },
        ticks: { color: "#001247" },
      },
      y: {
        beginAtZero: false,
        min: minRate * 0.98,
        max: maxRate * 1.02,
        grid: { display: false },
        ticks: { color: "#001247" },
      },
    },
    plugins: {
      tooltip: {
        enabled: true,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(4)}`,
        },
      },
      legend: {
        labels: { font: { family: "Calibri, sans-serif" }, color: "#001247" },
      },
      datalabels: { display: false },
    },
    animation: { duration: 800, easing: "easeInOutQuart" },
    elements: { line: { segment: skipSameDateSegment } },
  };

  const forwardRateChartData = {
    labels: forwardRateArray.map((f) => f.transaction_date),
    datasets: [
      {
        label: "Secured Forward Rate - Export",
        data: securedExportData,
        borderColor: "#007bff",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 5,
        backgroundColor: "rgba(0, 123, 255, 0.1)",
        order: 1,
      },
      {
        label: "Market Forward Rate - Export",
        data: marketExportData,
        borderColor: "#ffc107",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 5,
        backgroundColor: "rgba(255, 193, 7, 0.1)",
        order: 2,
      },
      {
        label: "Secured Forward Rate - Import",
        data: securedImportData,
        borderColor: "#28a745",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 5,
        backgroundColor: "rgba(40, 167, 69, 0.1)",
        order: 3,
      },
      {
        label: "Market Forward Rate - Import",
        data: marketImportData,
        borderColor: "#dc3545",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 5,
        backgroundColor: "rgba(220, 53, 69, 0.1)",
        order: 4,
      },
    ],
  };

  //----------------------------------------------------------------
  // PDF styling
  //----------------------------------------------------------------
  const pdfContainerStyle = pdfMode
    ? {
        backgroundColor: "#fff",
        padding: "5px",
        borderRadius: 0,
        boxShadow: "none",
        fontFamily: "Calibri, sans-serif",
      }
    : {
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        fontFamily: "Calibri, sans-serif",
      };

  const currentYearMonth = getCurrentYearMonth();

  // Filter bankGains if in pdfMode
  const displayedBankGains = pdfMode
    ? bankGains.filter((item) => item.month === currentYearMonth)
    : bankGains;

  // PDF creation
  const handleDownloadPdf = () => {
    setPdfMode(true);
    setTimeout(() => {
      const input = pdfRef.current;
      html2canvas(input, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        let finalWidth = pageWidth - 10;
        let finalHeight = (canvas.height * finalWidth) / canvas.width;

        // If finalHeight is larger than the page, scale it down
        if (finalHeight > pageHeight - 10) {
          const ratio = (pageHeight - 10) / finalHeight;
          finalHeight = pageHeight - 10;
          finalWidth *= ratio;
        }

        const xPos = (pageWidth - finalWidth) / 2;
        const yPos = 5;
        pdf.addImage(imgData, "PNG", xPos, yPos, finalWidth, finalHeight);
        pdf.save(`Dashboard_${new Date().toISOString().slice(0, 10)}.pdf`);
        setPdfMode(false);
      });
    }, 0);
  };

  // Basic styles
  const rowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    margin: "6px 0",
    color: "#001247",
    fontFamily: "Calibri, sans-serif",
  };
  const leftCol = { width: "50%" };
  const rightCol = { width: "50%", textAlign: "right" };
  const labelStyle = {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#003366",
    marginBottom: 0,
  };
  const numberStyle = {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#001247",
    marginBottom: 0,
  };
  const subLabelStyle = {
    fontSize: "0.75rem",
    color: "#007db3",
    marginLeft: 4,
  };

  return (
    <>
      <div className="text-end me-3 mt-2">
        <Button variant="primary" onClick={handleDownloadPdf}>
          Télécharger PDF
        </Button>
      </div>

      <div ref={pdfRef} className="container mt-3" style={pdfContainerStyle}>
        {/* Title */}
        <Row className="mb-2">
          <Col>
            <h3
              className="text-center"
              style={{
                fontWeight: 600,
                color: "#001247",
                fontFamily: "Calibri, sans-serif",
              }}
            >
              Résumé des gains sur transaction
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

        {/* 1) Résumé + Bar Chart */}
        <Row className="mb-2">
          <Col md={6} className="mb-2">
            <Card className="shadow-sm" style={{ border: "1px solid #ccc" }}>
              <Card.Body style={{ padding: "15px" }}>
                <h5
                  style={{
                    color: "#001247",
                    fontWeight: 700,
                    marginBottom: "10px",
                    fontSize: "1.2rem",
                  }}
                >
                  Résumé des performances
                </h5>

                {/* Row 1 */}
                <div style={rowStyle}>
                  <div style={leftCol}>
                    <p style={labelStyle}>
                      Total des transactions ({selectedCurrency.value})
                    </p>
                    <p style={numberStyle}>
                      {summary.total_traded?.toLocaleString("fr-FR") || 0}
                      <span style={subLabelStyle}> {selectedCurrency.value}</span>
                    </p>
                  </div>
                  <div style={rightCol}>
                    <p style={labelStyle}>Total Couvert ({selectedCurrency.value})</p>
                    <p style={numberStyle}>
                      {summary.total_covered?.toLocaleString("fr-FR") || 0}
                      <span style={subLabelStyle}> {selectedCurrency.value}</span>
                    </p>
                  </div>
                </div>
                <hr style={{ borderTop: "1px solid #007db3" }} />

                {/* Row 2 */}
                <div style={rowStyle}>
                  <div style={leftCol}>
                    <p style={labelStyle}>
                      Économies Totales ({selectedCurrency.value})
                    </p>
                    <p style={numberStyle}>
                      {summary.economies_totales?.toLocaleString("fr-FR") || 0}
                      <span style={subLabelStyle}> {selectedCurrency.value}</span>
                    </p>
                  </div>
                  <div style={rightCol}>
                    <p style={labelStyle}>
                      Économies Totales sur Couverture ({selectedCurrency.value})
                    </p>
                    <p style={numberStyle}>
                      {summary.economies_totales_couverture?.toLocaleString("fr-FR") || 0}
                      <span style={subLabelStyle}> {selectedCurrency.value}</span>
                    </p>
                  </div>
                </div>
                <hr style={{ borderTop: "1px solid #007db3" }} />

                {/* Row 3 */}
                <div style={rowStyle}>
                  <div style={leftCol}>
                    <p style={labelStyle}>Économies Totales (TND)</p>
                    <p style={numberStyle}>
                      {summary.economies_totales_tnd?.toLocaleString("fr-FR") || 0}
                      <span style={subLabelStyle}> TND</span>
                    </p>
                  </div>
                  <div style={rightCol}>
                    <p style={labelStyle}>Économies Totales sur Couverture (TND)</p>
                    <p style={numberStyle}>
                      {summary.economies_totales_couverture_tnd?.toLocaleString("fr-FR") ||
                        0}
                      <span style={subLabelStyle}> TND</span>
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Bar chart */}
          <Col md={6}>
            <Card className="shadow-sm" style={{ border: "1px solid #ccc" }}>
              <Card.Body>
                <Card.Title
                  className="text-center"
                  style={{
                    fontSize: "1rem",
                    fontWeight: 500,
                    color: "#001247",
                    textTransform: "none",
                  }}
                >
                  Total transigé & gain total par mois
                </Card.Title>
                <div style={{ height: "340px" }}>
                  <Bar data={monthlyBarChartData} options={optionsBar} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* 2) superperformance + forwardRate */}
        <Row className="mb-2">
          <Col md={6} className="mb-2">
            <Card className="shadow-sm" style={{ border: "1px solid #ccc" }}>
              <Card.Body>
                <Card.Title
                  className="text-center"
                  style={{
                    fontSize: "1rem",
                    fontWeight: 500,
                    color: "#001247",
                    textTransform: "none",
                  }}
                >
                  Superformance interbancaire : taux d'exécution export/import vs
                  taux interbancaire
                </Card.Title>
                <div style={{ height: "340px" }}>
                  <Line data={superperformanceChartData} options={optionsLine} />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} className="mb-2">
            <Card className="shadow-sm" style={{ border: "1px solid #ccc" }}>
              <Card.Body>
                <Card.Title
                  className="text-center"
                  style={{
                    fontSize: "1rem",
                    fontWeight: 500,
                    color: "#001247",
                    textTransform: "none",
                  }}
                >
                  Taux à terme sécurisés vs taux à terme du marché
                </Card.Title>
                <div style={{ height: "340px" }}>
                  <Line data={forwardRateChartData} options={optionsLineDynamic} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Explanation paragraph */}
        <Row className="mb-2">
          <Col>
            <p
              style={{
                fontSize: "0.9rem",
                fontFamily: "Calibri, sans-serif",
                fontWeight: "bold",
                fontStyle: "italic",
              }}
            >
              ** Le gain est calculé sur la base de votre performance historique,
              telle que déterminée dans le TCA que nous avons préparé. Ce calcul
              repose sur l'historique de vos transactions que vous nous avez
              fournies, comparé à la moyenne des taux observés sur le marché.
              <br />
              ** Il est important de souligner que le marché interbancaire est
              exclusivement destiné aux banques. Toutefois, les taux que nous avons
              négociés pour les imports ont, dans{" "}
              {summary.superformance_rate !== undefined
                ? summary.superformance_rate.toFixed(0)
                : "72"}
              % des cas, surpassé le taux interbancaire.
            </p>
          </Col>
        </Row>

        {/* Bank Gains Table */}
        <Row>
          <Col>
            <Card className="shadow-sm" style={{ border: "1px solid #ccc" }}>
              <Card.Body>
                <Card.Title
                  className="text-center"
                  style={{
                    fontSize: "1rem",
                    fontWeight: 500,
                    color: "#001247",
                    textTransform: "none",
                  }}
                >
                  Tableau des gains par banque
                  {pdfMode && (
                    <small style={{ fontSize: "0.8rem", color: "#001247" }}>
                      {" "}
                      (Mois courant: {currentYearMonth})
                    </small>
                  )}
                </Card.Title>
                <div style={{ maxHeight: pdfMode ? "none" : "300px", overflowY: pdfMode ? "visible" : "auto" }}>
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr className="bg-light" style={{ fontSize: "0.9rem", color: "#001247" }}>
                        <th>Banque</th>
                        <th>Mois</th>
                        <th>Total Traded</th>
                        <th>% Couvert</th>
                        <th>Gain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedBankGains.length ? (
                        displayedBankGains.map((item, index) => (
                          <tr key={index} style={{ fontSize: "0.9rem", color: "#001247" }}>
                            <td>{item.bank}</td>
                            <td>{item.month}</td>
                            <td>{item.total_traded}</td>
                            <td>{`${item.coverage_percent.toFixed(2)}%`}</td>
                            <td>{item.gain.toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center" style={{ color: "#001247" }}>
                            Pas de données disponibles
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
      </div>
    </>
  );
};

export default Market;
