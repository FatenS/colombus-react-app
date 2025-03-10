import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Row,
  Col,
  Table,
  Card,
  Tooltip,
  OverlayTrigger,
} from "react-bootstrap";
import Select from "react-select";
import { Bar, Line } from "react-chartjs-2";
import {
  fetchSummary,
  fetchForwardRate,
  fetchSuperperformance,
  fetchBankGains,
} from "../../../store/actions/DashboardActions";

// Helper to determine if we have 2 or more valid (non-null/undefined) data points
function hasEnoughPoints(dataArray = []) {
  const validPoints = dataArray.filter(
    (val) => val !== null && val !== undefined
  );
  return validPoints.length >= 2;
}

const Market = () => {
  const dispatch = useDispatch();
  const [selectedCurrency, setSelectedCurrency] = useState({
    label: "USD",
    value: "USD",
  });
  const { summary, forwardRate, superperformanceTrend, bankGains } =
    useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchSummary(selectedCurrency.value));
    dispatch(fetchForwardRate(selectedCurrency.value));
    dispatch(fetchSuperperformance(selectedCurrency.value));
    dispatch(fetchBankGains(selectedCurrency.value));
  }, [dispatch, selectedCurrency]);

  // Currency options
  const currencyOptions = [
    { label: "USD", value: "USD" },
    { label: "EUR", value: "EUR" },
  ];

  /**
   * ---------------------------------------------------
   * 1) STACKED BAR: Total Transigé & Gain total par mois
   * ---------------------------------------------------
   */
  const optionsBar = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1.5,
    scales: {
      x: {
        stacked: true,
        grid: {
          color: "#e9ecef",
        },
      },
      y: {
        beginAtZero: true,
        stacked: true,
        grid: {
          color: "#e9ecef",
        },
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

  /**
   * --------------------------------------------------------
   * 2) SUPERPERFORMANCE: (Taux d'exécution vs Taux interbancaire)
   * --------------------------------------------------------
   */

  const superPerfValues =
    Array.isArray(superperformanceTrend) && superperformanceTrend.length
      ? superperformanceTrend.flatMap((item) => [
          item.execution_rate,
          item.interbank_rate,
        ])
      : [0];

  const superPerfMin = Math.min(...superPerfValues);
  const superPerfMax = Math.max(...superPerfValues);

  const optionsLine = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1.5,
    interaction: {
      mode: "index",
      intersect: false,
    },
    scales: {
      x: {
        grid: {
          color: "#e9ecef",
        },
      },
      y: {
        grid: {
          color: "#e9ecef",
        },
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

  // Build your superperformance dataset arrays:
  const executionData = Array.isArray(superperformanceTrend)
    ? superperformanceTrend.map((item) => item.execution_rate)
    : [];
  const interbankData = Array.isArray(superperformanceTrend)
    ? superperformanceTrend.map((item) => item.interbank_rate)
    : [];

  // Decide whether to show lines or points for each dataset:
  const execHasMultiple = hasEnoughPoints(executionData);
  const interbankHasMultiple = hasEnoughPoints(interbankData);

  const superperformanceChartData = {
    labels: Array.isArray(superperformanceTrend)
      ? superperformanceTrend.map((item) => item.date)
      : [],
    datasets: [
      {
        label: "Taux d'exécution",
        data: executionData,
        borderColor: "#007bff",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        // If at least 2 data points, draw a line & hide points. If 1 point, show the point, no line.
        showLine: execHasMultiple, // if >=2 points => line
        spanGaps: execHasMultiple,
        pointRadius: execHasMultiple ? 0 : 4,
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

  /**
   * ---------------------------------------------------
   * 3) FORWARD RATE LINE CHART (Secured vs Market Rates)
   * ---------------------------------------------------
   */
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

  // We'll apply the same logic for each sub-dataset in forwardRate:
  // 1) Collect the data
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

  // 2) Decide for each if we show line or points
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

  // Tooltip for the summary cards
  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      Plus de détails
    </Tooltip>
  );

  return (
    <div
      className="container mt-4"
      style={{
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
      }}
    >
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
            options={currencyOptions}
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

      {/* Monthly (Bar) and Superperformance (Line) Charts */}
      <Row>
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
                Total transigé & gain total par mois
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
                style={{
                  fontSize: "1rem",
                  fontWeight: 500,
                  textTransform: "none",
                }}
              >
                Superformance interbancaire : taux d'exécution vs taux
                interbancaire
              </Card.Title>
              <div style={{ height: "350px" }}>
                <Line data={superperformanceChartData} options={optionsLine} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <p className="text-muted " style={{ fontSize: "0.9rem" }}>
          ** Le gain est calculé sur la base de votre performance historique,
          telle que déterminée dans le TCA que nous avons préparé. Ce calcul
          repose sur l'historique des vos transactions que vous nous avez
          fournies, comparé à la moyenne des taux observés sur le marché.
        </p>
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
                Taux à terme sécurisés vs taux à terme du marché au moment de la
                transaction
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
              </Card.Title>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
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
                    {bankGains.length ? (
                      bankGains.map((item, index) => (
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
                        <td colSpan="5" className="text-center text-secondary">
                          Pas de données disponibles
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
              <p className="text-muted" style={{ fontSize: "0.8rem" }}>
                ** Il est important de souligner que le marché interbancaire est
                exclusivement destiné aux banques. Toutefois, les taux que nous
                avons négociés pour les imports ont, dans 72% des cas, surpassé
                le taux interbancaire.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Market;
