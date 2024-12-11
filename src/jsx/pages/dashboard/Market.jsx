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
    value: "usd",
  });
  const { summary, forwardRate, superperformanceTrend, bankGains } =
    useSelector((state) => state.dashboard);

  useEffect(() => {
    // Pass selected currency to API fetch actions
    dispatch(fetchSummary(selectedCurrency.value));
    dispatch(fetchForwardRate(selectedCurrency.value));
    dispatch(fetchSuperperformance(selectedCurrency.value));
    dispatch(fetchBankGains(selectedCurrency.value));
  }, [dispatch, selectedCurrency]);

  // Currency options for selection
  const currencyOptions = [
    { label: "USD", value: "USD" },
    { label: "EUR", value: "EUR" },
  ];

  // Chart options with animations
  const optionsBar = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    animation: {
      duration: 1000,
      easing: "easeInOutQuart",
    },
  };

  const optionsLine = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    tension: 0.4,
    animation: {
      duration: 1000,
      easing: "easeInOutQuart",
    },
  };

  // Chart Data
  const monthlyBarChartData = {
    labels: summary.months || [], // Month labels from value_date
    datasets: [
      {
        label: "Total transigé en TND",
        data: summary.monthlyTotalTransacted || [], // Monthly transacted amounts
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
      {
        label: "Gain total en TND",
        data: summary.monthlyTotalGain || [], // Monthly gains
        type: "line", // Render as a line graph
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: true,
        tension: 0.4, // Smooth curve
      },
    ],
  };
  const superperformanceChartData = {
    labels: Array.isArray(superperformanceTrend)
      ? superperformanceTrend.map((item) => item.date)
      : [], // Fallback to an empty array if it's not valid
    datasets: [
      {
        label: "Execution Rate",
        data: Array.isArray(superperformanceTrend)
          ? superperformanceTrend.map((item) => item.execution_rate)
          : [],
        borderColor: "#28a745",
        fill: false,
      },
      {
        label: "Interbank Rate",
        data: Array.isArray(superperformanceTrend)
          ? superperformanceTrend.map((item) => item.interbank_rate)
          : [],
        borderColor: "#dc3545",
        fill: false,
      },
    ],
  };

  const forwardRateChartData = {
    labels: [...new Set(forwardRate.map((item) => item.transaction_date))], // Ensures unique dates on x-axis
    datasets: [
      {
        label: "Secured Forward Rate (Export)",
        data: forwardRate.map((item) => item.secured_forward_rate_export),
        borderColor: "#007bff",
        backgroundColor: "rgba(0, 123, 255, 0.2)",
        fill: false, // No area fill
        tension: 0.4, // Smooth curves
        pointRadius: 0, // Removes dots
        spanGaps: true, // Connects lines over `null` values
      },
      {
        label: "Market Forward Rate (Export)",
        data: forwardRate.map((item) => item.market_forward_rate_export),
        borderColor: "#ffc107",
        backgroundColor: "rgba(255, 193, 7, 0.2)",
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        spanGaps: true,
      },
      {
        label: "Secured Forward Rate (Import)",
        data: forwardRate.map((item) => item.secured_forward_rate_import),
        borderColor: "#28a745",
        backgroundColor: "rgba(40, 167, 69, 0.2)",
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        spanGaps: true,
      },
      {
        label: "Market Forward Rate (Import)",
        data: forwardRate.map((item) => item.market_forward_rate_import),
        borderColor: "#dc3545",
        backgroundColor: "rgba(220, 53, 69, 0.2)",
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        spanGaps: true,
      },
    ],
  };

  // Tooltip renderer
  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      Detailed Information
    </Tooltip>
  );

  return (
    <div
      className="container mt-4"
      style={{
        backgroundColor: "#f8f9fa",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      }}
    >
      {/* Currency Selector */}
      <Row className="mb-4">
        <Col md={12}>
          <Select
            className="custom-react-select"
            options={currencyOptions}
            value={selectedCurrency}
            onChange={setSelectedCurrency}
          />
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row className="mb-4">
        {[
          {
            title: `Total Traded (${selectedCurrency.value})`,
            value: summary.total_traded,
          },
          {
            title: `Total Covered (${selectedCurrency.value})`,
            value: summary.total_covered,
          },
          {
            title: `Economies Total (${selectedCurrency.value})`,
            value: summary.economies_totales,
          },
          {
            title: `Economies Covered (${selectedCurrency.value})`,
            value: summary.economies_totales_couverture,
          },
        ].map((item, index) => (
          <Col md={3} key={index}>
            <OverlayTrigger placement="top" overlay={renderTooltip}>
              <Card
                className="shadow-sm text-center p-3 mb-3 animate__animated animate__fadeIn"
                style={{
                  backgroundImage: "linear-gradient(135deg, #ffffff, #f8f9fa)",
                  border: "1px solid #dee2e6",
                  transition: "transform 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.transform = "scale(1.05)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <Card.Body>
                  <Card.Title className="text-secondary">
                    {item.title}
                  </Card.Title>
                  <Card.Text className="fs-4 fw-bold text-dark">
                    {item.value || "Loading..."}
                  </Card.Text>
                </Card.Body>
              </Card>
            </OverlayTrigger>
          </Col>
        ))}
      </Row>

      {/* Charts */}
      <Row>
        <Col md={6} className="mb-4">
          <Card className="shadow-sm animate__animated animate__fadeIn">
            <Card.Body>
              <Card.Title className="text-center text-dark">
                Monthly Gain & Total Transacted
              </Card.Title>
              <Bar data={monthlyBarChartData} options={optionsBar} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="mb-4">
          <Card className="shadow-sm animate__animated animate__fadeIn">
            <Card.Body>
              <Card.Title className="text-center text-dark">
                Superperformance Trend
              </Card.Title>
              <Line data={superperformanceChartData} options={optionsLine} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Forward Rate Comparison */}
      <Row>
        <Col md={12}>
          <Card className="shadow-sm animate__animated animate__fadeIn">
            <Card.Body>
              <Card.Title className="text-center text-dark">
                Forward Rate Comparison
              </Card.Title>
              <Line data={forwardRateChartData} options={optionsLine} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Bank Gains Table */}
      <Row>
        <Col md={12}>
          <Card className="shadow-sm animate__animated animate__fadeIn">
            <Card.Body>
              <Card.Title className="text-center text-dark">
                Bank Gains
              </Card.Title>
              <Table striped bordered hover responsive>
                <thead>
                  <tr className="bg-light text-dark">
                    <th>Bank</th>
                    <th>Month</th>
                    <th>Total Traded</th>
                    <th>% Covered</th>
                    <th>Gain</th>
                  </tr>
                </thead>
                <tbody>
                  {bankGains.length ? (
                    bankGains.map((item, index) => (
                      <tr
                        key={index}
                        className="animate__animated animate__fadeIn"
                      >
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
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Market;
