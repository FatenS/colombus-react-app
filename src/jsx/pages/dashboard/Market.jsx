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
   * ----------------------------------------------------------------
   * 1) MONTHLY BAR + LINE CHART (Total Transigé & Gain total par mois)
   * ----------------------------------------------------------------
   */

  // Ensure the line dataset renders above the bars by using 'order' property.
  // Also, set maintainAspectRatio to false for more flexible sizing,
  // and you can adjust 'aspectRatio' if you still want a certain ratio.
  const optionsBar = {
    responsive: true,
    maintainAspectRatio: false, // let the parent container control the height
    aspectRatio: 1.5, // tweak as desired (won't matter if maintainAspectRatio is false)
    scales: {
      x: {
        grid: {
          color: "#e9ecef",
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "#e9ecef",
        },
        position: "left",
        title: {
          display: true,
          text: "Total transigé (TND)",
        },
      },
      y1: {
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        position: "right",
        title: {
          display: true,
          text: "Gain total (TND)",
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

  // Bar + Line combined data. We add `order` so the line is on top (higher order).
  const monthlyBarChartData = {
    labels: summary.months || [],
    datasets: [
      {
        label: "Total transigé en TND",
        data: summary.monthlyTotalTransacted || [],
        backgroundColor: "rgba(70, 130, 180, 0.6)", // Slightly transparent
        borderColor: "#315f82",
        borderWidth: 1,
        yAxisID: "y",
        order: 1, // Bars behind
        barPercentage: 1, // tweak bar thickness
      },
      {
        label: "Gain total en TND",
        data: summary.monthlyTotalGain || [],
        type: "line",
        borderColor: "#FF6347",
        borderWidth: 2,
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        fill: true,
        tension: 0.3,
        yAxisID: "y1",
        order: 2, // Line on top
      },
    ],
  };

  /**
   * ------------------------------------------------------
   * 2) SUPERPERFORMANCE LINE CHART (Taux d'exécution vs Taux interbancaire)
   * ------------------------------------------------------
   */

  // Dynamically compute min & max for a bit of padding so lines aren’t too close.
  const superPerfValues =
    Array.isArray(superperformanceTrend) && superperformanceTrend.length
      ? superperformanceTrend.flatMap((item) => [
          item.execution_rate,
          item.interbank_rate,
        ])
      : [0];

  const superPerfMin = Math.min(...superPerfValues);
  const superPerfMax = Math.max(...superPerfValues);

  // Here we give some extra headroom: 0.98 to 1.02
  const optionsLine = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1.5,
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

  const superperformanceChartData = {
    labels: Array.isArray(superperformanceTrend)
      ? superperformanceTrend.map((item) => item.date)
      : [],
    datasets: [
      {
        label: "Taux d'exécution",
        data: Array.isArray(superperformanceTrend)
          ? superperformanceTrend.map((item) => item.execution_rate)
          : [],
        borderColor: "#007bff",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 3,
      },
      {
        label: "Taux interbancaire",
        data: Array.isArray(superperformanceTrend)
          ? superperformanceTrend.map((item) => item.interbank_rate)
          : [],
        borderColor: "#ff7f50",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 3,
      },
    ],
  };

  /**
   * ---------------------------------------------------
   * 3) FORWARD RATE LINE CHART (Secured vs Market Rates)
   * ---------------------------------------------------
   */

  // Grab the min & max from all 4 lines:
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

  const forwardRateChartData = {
    labels: forwardRate.map((item) => item.transaction_date),
    datasets: [
      {
        label: "Secured Forward Rate - Export",
        data: forwardRate.map((item) => item.secured_forward_rate_export),
        borderColor: "#007bff",
        borderWidth: 2,
        backgroundColor: "rgba(0, 123, 255, 0.1)",
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 3,
        spanGaps: true,
        order: 1,
      },
      {
        label: "Market Forward Rate - Export",
        data: forwardRate.map((item) => item.market_forward_rate_export),
        borderColor: "#ffc107",
        borderWidth: 2,
        backgroundColor: "rgba(255, 193, 7, 0.1)",
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 3,
        spanGaps: true,
        order: 2,
      },
      {
        label: "Secured Forward Rate - Import",
        data: forwardRate.map((item) => item.secured_forward_rate_import),
        borderColor: "#28a745",
        borderWidth: 2,
        backgroundColor: "rgba(40, 167, 69, 0.1)",
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 3,
        spanGaps: true,
        order: 3,
      },
      {
        label: "Market Forward Rate - Import",
        data: forwardRate.map((item) => item.market_forward_rate_import),
        borderColor: "#dc3545",
        borderWidth: 2,
        backgroundColor: "rgba(220, 53, 69, 0.1)",
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 3,
        spanGaps: true,
        order: 4,
      },
    ],
  };

  const optionsLineDynamic = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index", // or 'nearest'
      intersect: false,
    },
    plugins: {
      tooltip: {
        enabled: true,
        mode: "index",
        intersect: false,
        // You can customize display callbacks if needed:
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
  // Tooltip renderer
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
                          useGrouping: true, // Adds spaces as thousand separators
                          maximumFractionDigits: 0, // Removes decimals
                        }).format(item.value)
                      : "Loading..."}
                  </Card.Text>
                </Card.Body>
              </Card>
            </OverlayTrigger>
          </Col>
        ))}
      </Row>

      {/* Monthly Gain and Superperformance Charts */}
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
              <div style={{ height: "350px" /* ensure enough space */ }}>
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
                <Line
                  data={forwardRateChartData}
                  options={optionsLineDynamic}
                />
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
              {/* Wrap the Table in a scroll container */}
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
