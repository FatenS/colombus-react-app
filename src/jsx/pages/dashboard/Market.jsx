import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Row,
  Col,
  Table,
  Card,
  Tooltip,
  OverlayTrigger,
  Button,
} from "react-bootstrap";
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

// Helper to get YYYY-MM for current month
function getCurrentYearMonth() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// Helper to check if array has 2+ valid data points
function hasEnoughPoints(dataArray = []) {
  const validPoints = dataArray.filter((val) => val !== null && val !== undefined);
  return validPoints.length >= 2;
}

const Market = () => {
  const dispatch = useDispatch();
  const pdfRef = useRef(null);

  // Toggle PDF mode
  const [pdfMode, setPdfMode] = useState(false);

  // Selected currency
  const [selectedCurrency, setSelectedCurrency] = useState({
    label: "USD",
    value: "USD",
  });

  // Redux store selectors
  const { summary, forwardRate, superperformanceTrend, bankGains } = useSelector(
    (state) => state.dashboard
  );

  // On mount or currency change, fetch data
  useEffect(() => {
    dispatch(fetchSummary(selectedCurrency.value));
    dispatch(fetchForwardRate(selectedCurrency.value));
    dispatch(fetchSuperperformance(selectedCurrency.value));
    dispatch(fetchBankGains(selectedCurrency.value));
  }, [dispatch, selectedCurrency]);

  // Common chart layout padding
  const chartLayout = {
    padding: {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
    },
  };

  // ========== CHARTS CONFIG ==========

  // 1) Stacked Bar: Total transigé vs. Gain total par mois
  const optionsBar = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1.5,
    layout: chartLayout,
    scales: {
      x: {
        stacked: true,
        grid: { color: "#e9ecef" },
      },
      y: {
        beginAtZero: true,
        stacked: true,
        grid: { color: "#e9ecef" },
        ticks: {
          callback: (value) => `${value.toLocaleString()} TND`,
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          font: {
            family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
          },
        },
      },
    },
    animation: {
      duration: 800,
      easing: "easeInOutQuart",
    },
  };

  const monthlyBarChartData = {
    labels: summary.months || [],
    datasets: [
      {
        label: "Total transigé en TND",
        data: summary.monthlyTotalTransacted || [],
        backgroundColor: "rgba(70, 130, 180, 0.6)",
        borderColor: "#315f82",
        borderWidth: 1,
        stack: "combined",
      },
      {
        label: "Gain total en TND",
        data: summary.monthlyTotalGain || [],
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "#FF6347",
        borderWidth: 1,
        stack: "combined",
      },
    ],
  };

  // 2) Superperformance: Updated to include separate export & import execution rates
  const executionDataExport = Array.isArray(superperformanceTrend)
    ? superperformanceTrend.map((item) => item.execution_rate_export)
    : [];
  const executionDataImport = Array.isArray(superperformanceTrend)
    ? superperformanceTrend.map((item) => item.execution_rate_import)
    : [];
  const interbankData = Array.isArray(superperformanceTrend)
    ? superperformanceTrend.map((item) => item.interbank_rate)
    : [];

  const execExportHasMultiple = hasEnoughPoints(executionDataExport);
  const execImportHasMultiple = hasEnoughPoints(executionDataImport);
  const interbankHasMultiple = hasEnoughPoints(interbankData);

  // Compute min & max from all three arrays (ignoring null/undefined)
  const superPerfValues =
    Array.isArray(superperformanceTrend) && superperformanceTrend.length
      ? superperformanceTrend
          .flatMap((item) => [
            item.execution_rate_export,
            item.execution_rate_import,
            item.interbank_rate,
          ])
          .filter((v) => v !== null && v !== undefined)
      : [0];
  const superPerfMin = Math.min(...superPerfValues);
  const superPerfMax = Math.max(...superPerfValues);

  const optionsLine = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1.5,
    layout: chartLayout,
    interaction: {
      mode: "index",
      intersect: false,
    },
    scales: {
      x: {
        grid: { color: "#e9ecef" },
      },
      y: {
        grid: { color: "#e9ecef" },
        beginAtZero: false,
        min: superPerfMin * 0.98,
        max: superPerfMax * 1.02,
        ticks: {
          stepSize: 0.01,
        },
      },
    },
    tension: 0.3,
    plugins: {
      legend: {
        labels: {
          font: {
            family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
          },
        },
      },
    },
    animation: {
      duration: 800,
      easing: "easeInOutQuart",
    },
  };

  const superperformanceChartData = {
    labels: Array.isArray(superperformanceTrend)
      ? superperformanceTrend.map((item) => item.date)
      : [],
    datasets: [
      {
        label: "Taux d'exécution export",
        data: executionDataExport,
        borderColor: "#007bff",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        showLine: execExportHasMultiple,
        spanGaps: execExportHasMultiple,
        pointRadius: execExportHasMultiple ? 0 : 4,
        pointHoverRadius: 5,
      },
      {
        label: "Taux d'exécution import",
        data: executionDataImport,
        borderColor: "#28a745",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        showLine: execImportHasMultiple,
        spanGaps: execImportHasMultiple,
        pointRadius: execImportHasMultiple ? 0 : 4,
        pointHoverRadius: 5,
      },
      {
        label: "Taux interbancaire",
        data: interbankData,
        borderColor: "#ff7f50",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        borderDash: [5, 5],
        showLine: interbankHasMultiple,
        spanGaps: interbankHasMultiple,
        pointRadius: interbankHasMultiple ? 0 : 4,
        pointHoverRadius: 5,
      },
    ],
  };

  // 3) Forward Rates: Secured vs. Market
  const minRate = Math.min(
    ...forwardRate.map((item) =>
      Math.min(
        item.secured_forward_rate_export || Infinity,
        item.market_forward_rate_export || Infinity,
        item.secured_forward_rate_import || Infinity,
        item.market_forward_rate_import || Infinity
      )
    )
  );
  const maxRate = Math.max(
    ...forwardRate.map((item) =>
      Math.max(
        item.secured_forward_rate_export || -Infinity,
        item.market_forward_rate_export || -Infinity,
        item.secured_forward_rate_import || -Infinity,
        item.market_forward_rate_import || -Infinity
      )
    )
  );

  const securedExportData = forwardRate.map(
    (item) => item.secured_forward_rate_export
  );
  const marketExportData = forwardRate.map(
    (item) => item.market_forward_rate_export
  );
  const securedImportData = forwardRate.map(
    (item) => item.secured_forward_rate_import
  );
  const marketImportData = forwardRate.map(
    (item) => item.market_forward_rate_import
  );

  const hasSecuredExportMulti = hasEnoughPoints(securedExportData);
  const hasMarketExportMulti = hasEnoughPoints(marketExportData);
  const hasSecuredImportMulti = hasEnoughPoints(securedImportData);
  const hasMarketImportMulti = hasEnoughPoints(marketImportData);

  const forwardRateChartData = {
    labels: forwardRate.map((item) => item.transaction_date),
    datasets: [
      {
        label: "Secured Forward Rate - Export",
        data: securedExportData,
        borderColor: "#007bff",
        borderWidth: 2,
        backgroundColor: "rgba(0, 123, 255, 0.1)",
        fill: false,
        tension: 0.4,
        showLine: hasSecuredExportMulti,
        spanGaps: hasSecuredExportMulti,
        pointRadius: hasSecuredExportMulti ? 0 : 4,
        pointHoverRadius: 5,
        order: 1,
      },
      {
        label: "Market Forward Rate - Export",
        data: marketExportData,
        borderColor: "#ffc107",
        borderWidth: 2,
        backgroundColor: "rgba(255, 193, 7, 0.1)",
        fill: false,
        tension: 0.4,
        showLine: hasMarketExportMulti,
        spanGaps: hasMarketExportMulti,
        pointRadius: hasMarketExportMulti ? 0 : 4,
        pointHoverRadius: 5,
        order: 2,
      },
      {
        label: "Secured Forward Rate - Import",
        data: securedImportData,
        borderColor: "#28a745",
        borderWidth: 2,
        backgroundColor: "rgba(40, 167, 69, 0.1)",
        fill: false,
        tension: 0.4,
        showLine: hasSecuredImportMulti,
        spanGaps: hasSecuredImportMulti,
        pointRadius: hasSecuredImportMulti ? 0 : 4,
        pointHoverRadius: 5,
        order: 3,
      },
      {
        label: "Market Forward Rate - Import",
        data: marketImportData,
        borderColor: "#dc3545",
        borderWidth: 2,
        backgroundColor: "rgba(220, 53, 69, 0.1)",
        fill: false,
        tension: 0.4,
        showLine: hasMarketImportMulti,
        spanGaps: hasMarketImportMulti,
        pointRadius: hasMarketImportMulti ? 0 : 4,
        pointHoverRadius: 5,
        order: 4,
      },
    ],
  };

  const optionsLineDynamic = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1.5,
    layout: chartLayout,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      tooltip: {
        enabled: true,
        mode: "index",
        intersect: false,
        callbacks: {
          label: function (context) {
            return ` ${context.dataset.label}: ${context.parsed.y.toFixed(4)}`;
          },
        },
      },
      legend: {
        labels: {
          font: {
            family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
          },
        },
      },
    },
    scales: {
      x: {
        type: "category",
        position: "bottom",
        display: true,
        title: {
          display: true,
          text: "Transaction Date",
        },
        grid: {
          color: "#e9ecef",
        },
        ticks: {
          callback: (value, index) => forwardRate[index]?.transaction_date,
        },
      },
      y: {
        beginAtZero: false,
        min: minRate * 0.98,
        max: maxRate * 1.02,
        ticks: {
          stepSize: 0.005,
        },
        grid: {
          color: "#e9ecef",
        },
      },
    },
    animation: {
      duration: 800,
      easing: "easeInOutQuart",
    },
  };

  // ========== PDF-Mode Container Styles ==========
  const pdfContainerStyle = pdfMode
    ? {
        backgroundColor: "#fff",
        padding: "5px",
        borderRadius: 0,
        boxShadow: "none",
        fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
      }
    : {
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
      };

  // Gains table: show only current month if pdfMode is true
  const currentYearMonth = getCurrentYearMonth();
  const displayedBankGains = pdfMode
    ? bankGains.filter((item) => item.month === currentYearMonth)
    : bankGains;

  // PDF Export: adjust PDF mode, capture and download the PDF
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

        if (finalHeight > pageHeight - 10) {
          const ratio = (pageHeight - 10) / finalHeight;
          finalHeight = pageHeight - 10;
          finalWidth = finalWidth * ratio;
        }

        const xPos = (pageWidth - finalWidth) / 2;
        const yPos = 5;

        pdf.addImage(imgData, "PNG", xPos, yPos, finalWidth, finalHeight);
        pdf.save(`Dashboard_${new Date().toISOString().slice(0, 10)}.pdf`);
        setPdfMode(false);
      });
    }, 0);
  };

  // Tooltip for summary cards
  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      Plus de détails
    </Tooltip>
  );

  return (
    <>
      {/* PDF Button */}
      <div className="text-end me-4 mt-2">
        <Button variant="primary" onClick={handleDownloadPdf}>
          Télécharger PDF
        </Button>
      </div>

      {/* Dashboard content wrapper for PDF capture */}
      <div ref={pdfRef} className="container mt-4" style={pdfContainerStyle}>
        {/* Main Title */}
        <Row className="mb-4">
          <Col md={12}>
            <h3 className="text-dark text-center" style={{ fontWeight: 600 }}>
              Résumé des gains sur transaction
            </h3>
          </Col>
        </Row>

        {/* Currency Selector */}
        <Row className="mb-4 d-flex align-items-center">
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
                }),
              }}
            />
          </Col>
        </Row>

        {/* Summary Cards */}
        <Row className="mb-4">
          {[
            {
              title: `Total Transigé (${selectedCurrency.value})`,
              value: summary.total_traded,
            },
            {
              title: `Total Couvert (${selectedCurrency.value})`,
              value: summary.total_covered,
            },
            {
              title: `Économies Totales (${selectedCurrency.value})`,
              value: summary.economies_totales,
            },
            {
              title: `Économies Totales sur Couverture (${selectedCurrency.value})`,
              value: summary.economies_totales_couverture,
            },
          ].map((item, index) => (
            <Col md={3} key={index}>
              <OverlayTrigger placement="top" overlay={renderTooltip}>
                <Card
                  className="shadow-sm text-center p-3 mb-3"
                  style={{
                    border: "1px solid #dee2e6",
                    transition: "transform 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.transform = "scale(1.02)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  <Card.Body>
                    <Card.Title
                      className="text-secondary"
                      style={{ fontSize: "0.9rem" }}
                    >
                      {item.title}
                    </Card.Title>
                    <Card.Text className="fs-4 fw-bold text-dark">
                      {item.value !== undefined
                        ? Intl.NumberFormat("fr-FR", {
                            useGrouping: true,
                            maximumFractionDigits: 0,
                          }).format(item.value)
                        : "Loading..."}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </OverlayTrigger>
            </Col>
          ))}
        </Row>

        {/* Charts Row */}
        <Row className="mb-4 align-items-start">
          <Col md={6} className="mb-4">
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Card.Title
                  className="text-center text-dark"
                  style={{
                    fontSize: "1rem",
                    fontWeight: 500,
                    textTransform: "none",
                  }}
                >
                  Total transigé &amp; gain total par mois
                </Card.Title>
                <div style={{ height: "350px" }}>
                  <Bar data={monthlyBarChartData} options={optionsBar} />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} className="mb-4">
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Card.Title
                  className="text-center text-dark"
                  style={{
                    fontSize: "1rem",
                    fontWeight: 500,
                    textTransform: "none",
                  }}
                >
                  Superformance interbancaire : taux d'exécution export/import vs taux interbancaire
                </Card.Title>
                <div style={{ height: "350px" }}>
                  <Line data={superperformanceChartData} options={optionsLine} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Explanation paragraph */}
        <Row>
          <Col>
            <p className="text-muted" style={{ fontSize: "0.9rem" }}>
              ** Le gain est calculé sur la base de votre performance historique, telle que déterminée dans le TCA que nous avons préparé. Ce calcul repose sur l'historique des vos transactions que vous nous avez fournies, comparé à la moyenne des taux observés sur le marché.
            </p>
          </Col>
        </Row>

        {/* Forward Rate Comparison */}
        <Row className="mb-4">
          <Col md={12}>
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Card.Title
                  className="text-center text-dark"
                  style={{
                    fontSize: "1rem",
                    fontWeight: 500,
                    textTransform: "none",
                  }}
                >
                  Taux à terme sécurisés vs taux à terme du marché au moment de la transaction
                </Card.Title>
                <div style={{ height: "400px" }}>
                  <Line data={forwardRateChartData} options={optionsLineDynamic} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Bank Gains Table */}
        <Row>
          <Col md={12}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title
                  className="text-center text-dark"
                  style={{
                    fontSize: "1rem",
                    fontWeight: 500,
                    textTransform: "none",
                  }}
                >
                  Tableau des gains par banque
                  {pdfMode && (
                    <small style={{ fontSize: "0.8rem" }}>
                      {" "}
                      (Mois courant: {currentYearMonth})
                    </small>
                  )}
                </Card.Title>
                <div
                  style={{
                    maxHeight: pdfMode ? "none" : "300px",
                    overflowY: pdfMode ? "visible" : "auto",
                  }}
                >
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr
                        className="bg-light text-dark"
                        style={{ fontSize: "0.9rem" }}
                      >
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
                          <tr key={index} style={{ fontSize: "0.9rem" }}>
                            <td>{item.bank}</td>
                            <td>{item.month}</td>
                            <td>{item.total_traded}</td>
                            <td>{`${item.coverage_percent.toFixed(2)}%`}</td>
                            <td>{item.gain.toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center text-secondary">
                            Pas de données disponibles
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
                <p className="text-muted" style={{ fontSize: "0.8rem" }}>
                  ** Il est important de souligner que le marché interbancaire est exclusivement destiné aux banques. Toutefois, les taux que nous avons négociés pour les imports ont, dans 72% des cas, surpassé le taux interbancaire.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Market;
