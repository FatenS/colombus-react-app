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

  // Chart options with a cleaner style
  const optionsBar = {
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
    responsive: true,
    maintainAspectRatio: false,
  };

  const optionsLine = {
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
      },
    },
    tension: 0.3,
    animation: {
      duration: 800,
      easing: "easeInOutQuart",
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
    responsive: true,
    maintainAspectRatio: false,
  };

  // Chart Data
  const monthlyBarChartData = {
    labels: summary.months || [],
    datasets: [
      {
        label: "Total transigé en TND",
        data: summary.monthlyTotalTransacted || [],
        backgroundColor: "#4682B4",
        borderColor: "#315f82",
        borderWidth: 1,
      },
      {
        label: "Gain total en TND",
        data: summary.monthlyTotalGain || [],
        type: "line",
        borderColor: "#FF6347",
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
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
        fill: false,
      },
      {
        label: "Taux Interbancaire",
        data: Array.isArray(superperformanceTrend)
          ? superperformanceTrend.map((item) => item.interbank_rate)
          : [],
        borderColor: "#ff7f50",
        fill: false,
      },
    ],
  };

  const forwardRateChartData = {
    labels: [...new Set(forwardRate.map((item) => item.transaction_date))],
    datasets: [
      {
        label: "Taux à terme sécurisé (Export)",
        data: forwardRate.map((item) =>
          item.secured_forward_rate_export === null
            ? null
            : item.secured_forward_rate_export
        ),
        borderColor: "#007bff",
        backgroundColor: "rgba(0, 123, 255, 0.1)",
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        spanGaps: false,
      },
      {
        label: "Taux à terme marché (Export)",
        data: forwardRate.map((item) =>
          item.market_forward_rate_export === null
            ? null
            : item.market_forward_rate_export
        ),
        borderColor: "#ffc107",
        backgroundColor: "rgba(255, 193, 7, 0.1)",
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        spanGaps: false,
      },
      {
        label: "Taux à terme sécurisé (Import)",
        data: forwardRate.map((item) =>
          item.secured_forward_rate_import === null
            ? null
            : item.secured_forward_rate_import
        ),
        borderColor: "#28a745",
        backgroundColor: "rgba(40, 167, 69, 0.1)",
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        spanGaps: false,
      },
      {
        label: "Taux à terme marché (Import)",
        data: forwardRate.map((item) =>
          item.market_forward_rate_import === null
            ? null
            : item.market_forward_rate_import
        ),
        borderColor: "#dc3545",
        backgroundColor: "rgba(220, 53, 69, 0.1)",
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        spanGaps: false,
      },
    ],
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
            Résumé des gains sur transaction -{" "}
            {new Date().toLocaleDateString("fr-FR")}
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
                    {item.value !== undefined ? item.value : "Loading..."}
                  </Card.Text>
                </Card.Body>
              </Card>
            </OverlayTrigger>
          </Col>
        ))}
      </Row>

      {/* Monthly Gain and Superperformance Charts */}
      <Row>
        <Col md={6} className="mb-4" style={{ height: "350px" }}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title
                className="text-center text-dark"
                style={{ fontSize: "1rem", fontWeight: 500 }}
              >
                Total Transigé & Gain Total par Mois
              </Card.Title>
              <div>
                <Bar data={monthlyBarChartData} options={optionsBar} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="mb-4" style={{ height: "350px" }}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title
                className="text-center text-dark"
                style={{ fontSize: "1rem", fontWeight: 500 }}
              >
                Superformance Interbancaire : Taux d'exécution vs Taux
                Interbancaire
              </Card.Title>
              <div>
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
      <Row className="mb-4" style={{ height: "350px" }}>
        <Col md={12}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title
                className="text-center text-dark"
                style={{ fontSize: "1rem", fontWeight: 500 }}
              >
                Taux à terme sécurisés vs taux à terme du marché au moment de la
                transaction
              </Card.Title>
              <div>
                <Line data={forwardRateChartData} options={optionsLine} />
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
                style={{ fontSize: "1rem", fontWeight: 500 }}
              >
                Tableau des Gains par Banque
              </Card.Title>
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
