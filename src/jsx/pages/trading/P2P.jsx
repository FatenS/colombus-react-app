import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axiosInstance from "../../../services/AxiosInstance"; 
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  Label,
} from "recharts";
const API_ROOT = axiosInstance.defaults.baseURL?.replace(/\/$/, "") || "";

// Utility to format date to YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = `0${d.getMonth() + 1}`.slice(-2);
  const day = `0${d.getDate()}`.slice(-2);
  return `${year}-${month}-${day}`;
};

const currencyOptions = [
  { label: "EUR", value: "EUR" },
  { label: "USD", value: "USD" },
];

const ExposureSummary = () => {
  // ------------------------------------------------
  // 1) Local states for open positions, forward & var
  // ------------------------------------------------
  const [openPositions, setOpenPositions] = useState([]);
  const [forwardData, setForwardData] = useState([]);
  const [varData, setVarData] = useState([]);

  // ------------------------------------------------
  // 2) Local states for filters
  // ------------------------------------------------
  const [selectedCurrency, setSelectedCurrency] = useState({
    label: "EUR",
    value: "EUR",
  });
  const [selectedDate, setSelectedDate] = useState(null);

  // ------------------------------------------------
  // 3) Upload state (only for open positions)
  // ------------------------------------------------
  const [fileOpenPos, setFileOpenPos] = useState(null);
  const [uploadMessageOpenPos, setUploadMessageOpenPos] = useState("");

  function downloadOpenPosTemplate() {
    window.location.href = API_ROOT + "/download-open-positions-template";
  }

  // ------------------------------------------------
  // 4) Functions to fetch data from backend
  // ------------------------------------------------
  const fetchOpenPositions = async () => {
    try {
      const response = await axiosInstance.get("/open-positions");
      setOpenPositions(response.data);
    } catch (error) {
      console.error("Error fetching open positions", error);
    }
  };

  const fetchForwardData = async () => {
    try {
      const response = await axiosInstance.get("/api/calculate-forward-rate");
      setForwardData(response.data);
    } catch (error) {
      console.error("Error fetching forward rate data", error);
    }
  };

  const fetchVarData = async () => {
    try {
      const response = await axiosInstance.get("/api/calculate-var");
      setVarData(response.data);
    } catch (error) {
      console.error("Error fetching VaR data", error);
    }
  };

  // ------------------------------------------------
  // 5) useEffect to fetch data on load & on changes
  // ------------------------------------------------
  useEffect(() => {
    fetchOpenPositions();
    fetchForwardData();
    fetchVarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCurrency, selectedDate, uploadMessageOpenPos]);

  // ------------------------------------------------
  // 6) File handlers - Open Positions
  // ------------------------------------------------
  const handleOpenPosFileChange = (e) => {
    setFileOpenPos(e.target.files[0]);
  };

  const handleUploadOpenPos = async () => {
    if (!fileOpenPos) {
      setUploadMessageOpenPos("Please select a file first.");
      return;
    }
    const formData = new FormData();
    formData.append("file", fileOpenPos);

    try {
      await axiosInstance.post("/upload-open-positions", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadMessageOpenPos("Open Positions file uploaded successfully.");
      fetchOpenPositions();
    } catch (error) {
      setUploadMessageOpenPos("Error uploading file. Please try again.");
      console.error("Error uploading open positions file", error);
    }
  };

  // ------------------------------------------------
  // 7) Convert function for open positions
  // ------------------------------------------------
// ——— 7) Convert function for open positions ———
const handleConvert = async (openPositionId) => {
  try {
    // axiosInstance already handles cookies & CSRF headers
    await axiosInstance.post(`/convert-open-position/${openPositionId}`);

    alert("Open position converted successfully!");
    setOpenPositions(prev =>
      prev.filter(pos => pos.id !== openPositionId)
    );
  } catch (error) {
    console.error("Error converting open position:", error);
    alert("Could not convert open position. Check console for details.");
  }
};
  // ------------------------------------------------
  // 8) Process open positions for the summary table
  // ------------------------------------------------
  const formatValue = (val) =>
    selectedCurrency.value === "EUR" ? `${val} €` : `$${val}`;

  const processedData = useMemo(() => {
    let filteredPositions = openPositions.filter(
      (pos) => pos.currency === selectedCurrency.value
    );

    if (selectedDate) {
      const formattedSelectedDate = formatDate(selectedDate);
      filteredPositions = filteredPositions.filter(
        (pos) => pos.value_date === formattedSelectedDate
      );
    }

    const dataByDate = {};
    let totalExportSum = 0;
    let totalImportSum = 0;

    filteredPositions.forEach((pos) => {
      const dateKey = pos.value_date;
      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = { export: 0, import: 0 };
      }

      const type = pos.transaction_type.trim().toLowerCase();
      if (type === "sell") {
        dataByDate[dateKey].export += pos.amount;
        totalExportSum += pos.amount;
      } else if (type === "buy") {
        dataByDate[dateKey].import += pos.amount;
        totalImportSum += pos.amount;
      }
    });

    const dates = Object.keys(dataByDate).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    const netExposureRow = ["Net Exposure"];
    const exportRow = ["Export"];
    const importRow = ["Import"];

    dates.forEach((date) => {
      const { export: totalExport, import: totalImport } = dataByDate[date];
      netExposureRow.push((totalExport - totalImport).toFixed(2));
      exportRow.push(totalExport.toFixed(2));
      importRow.push(totalImport.toFixed(2));
    });

    const totalNetExposure = (totalExportSum - totalImportSum).toFixed(2);
    netExposureRow.splice(1, 0, totalNetExposure);
    exportRow.splice(1, 0, totalExportSum.toFixed(2));
    importRow.splice(1, 0, totalImportSum.toFixed(2));

    return {
      headers: ["Value Date", "Total", ...dates],
      rows: [netExposureRow, exportRow, importRow],
      dates,
      netExposureRow,
    };
  }, [openPositions, selectedCurrency, selectedDate]);

  // ------------------------------------------------
  // 9) Build chart data with netExposure + VaR
  // ------------------------------------------------
  const chartData = processedData.dates.map((date, index) => ({
    valueDate: date,
    netExposure: parseFloat(processedData.netExposureRow[index + 2]) || 0,
    var1: varData.find((item) => item["Value Date"] === date)?.["VaR 1%"] || 0,
    var5: varData.find((item) => item["Value Date"] === date)?.["VaR 5%"] || 0,
    var10:
      varData.find((item) => item["Value Date"] === date)?.["VaR 10%"] || 0,
  }));

  return (
    <div className="container-fluid" style={{ maxWidth: "1200px" }}>
      {/* (Optional) Page Title */}
      {/* <div className="row mt-4 mb-3">
        <div className="col-12">
          <h3 className="text-center" style={{ fontWeight: 600 }}>
            Exposure Summary & VaR
          </h3>
        </div>
      </div> */}

      {/* (A) Filters & Upload in a single card */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-4" style={{ fontWeight: 500 }}>
                Filters & Upload
              </h5>
              <div className="row">
                {/* Left: Currency and Date */}
                <div className="col-lg-6 col-md-12 mb-3">
                  <label htmlFor="currencySelect" className="mb-1 text-muted">
                    Currency
                  </label>
                  <Select
                    id="currencySelect"
                    className="mb-3"
                    options={currencyOptions}
                    value={selectedCurrency}
                    onChange={setSelectedCurrency}
                    isSearchable={false}
                  />

                  <label htmlFor="datePicker" className="mb-1 text-muted">
                    Value Date
                  </label>
                  <DatePicker
                    id="datePicker"
                    selected={selectedDate}
                    onChange={setSelectedDate}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select a date"
                    className="form-control"
                  />
                </div>

                {/* Right: Upload Open Positions */}
                <div className="col-lg-6 col-md-12">
                    {/* download button */}
                    <button
                    onClick={downloadOpenPosTemplate}
                    className="btn btn-primary"

                  >
                    Download template
                  </button>
                  <p>download template fill it with your data, and upload file below</p>
                  <label htmlFor="fileOpenPos" className="mb-1 text-muted">
                    Open Positions File
                  </label>
                  <input
                    id="fileOpenPos"
                    type="file"
                    onChange={handleOpenPosFileChange}
                    className="form-control mb-2"
                  />
                  <button
                    onClick={handleUploadOpenPos}
                    className="btn btn-primary"
                  >
                    Upload
                  </button>
                  {uploadMessageOpenPos && (
                    <p className="mt-2 text-info">{uploadMessageOpenPos}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* (B) Exposure Summary Table */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h4 className="card-title mb-3" style={{ fontWeight: 500 }}>
                Exposure Summary
              </h4>
              <div className="table-responsive mt-3">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      {processedData.headers.map((header, idx) => (
                        <th key={idx}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {processedData.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>
                            {cellIndex === 0 ? (
                              <strong>{cell}</strong>
                            ) : (
                              <>{formatValue(cell)}</>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* (C) Net Exposure & VaR Chart */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3" style={{ fontWeight: 500 }}>
                Net Exposure & VaR
              </h5>
              <div style={{ width: "100%", height: 400 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />

                    {/* X-axis with label */}
                    <XAxis dataKey="valueDate">
                      <Label
                        offset={-5}
                        position="insideBottom"
                      />
                    </XAxis>

                    {/* Left axis for Net Exposure with label */}
                    <YAxis yAxisId="leftAxis">
                      <Label
                        value="Net Exposure"
                        angle={-90}
                        position="insideLeft"
                        style={{ textAnchor: "middle" }}
                      />
                    </YAxis>

                    {/* Right axis for VaR with label */}
                    <YAxis yAxisId="rightAxis" orientation="right">
                      <Label
                        value="VaR"
                        angle={90}
                        position="insideRight"
                        style={{ textAnchor: "middle" }}
                      />
                    </YAxis>

                    <Tooltip />
                    <Legend />

                    {/* Net Exposure on left axis */}
                    <Bar
                      dataKey="netExposure"
                      fill="#8884d8"
                      yAxisId="leftAxis"
                      name="Net Exposure"
                    />

                    {/* VaR bars stacked on the right axis */}
                    <Bar
                      dataKey="var1"
                      fill="#FF6666"
                      stackId="varStack"
                      yAxisId="rightAxis"
                      name="VaR 1%"
                    />
                    <Bar
                      dataKey="var5"
                      fill="#E60000"
                      stackId="varStack"
                      yAxisId="rightAxis"
                      name="VaR 5%"
                    />
                    <Bar
                      dataKey="var10"
                      fill="#990000"
                      stackId="varStack"
                      yAxisId="rightAxis"
                      name="VaR 10%"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* (D) Forward Rate + VaR + Convert Table */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3" style={{ fontWeight: 500 }}>
                Forward Rate & VaR
              </h5>
              <div className="table-responsive" style={{ overflowX: "scroll" }}>
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Value Date</th>
                      <th>Number of days</th>
                      <th>FWD Rate</th>
                      <th>Value at Risk 1%</th>
                      <th>Value at Risk 5%</th>
                      <th>Value at Risk 10%</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forwardData.map((item, idx) => {
                      const dateVal = item["Value Date"];
                      const days = item.Days || 0;
                      const fwdRate = item["Forward Rate"];
                      const openPosId = item["open_position_id"];

                      // match VaR item
                      const varItem = varData.find(
                        (v) => v["Value Date"] === dateVal
                      );

                      return (
                        <tr key={idx}>
                          <td>{dateVal}</td>
                          <td>{days}</td>
                          <td>
                            {fwdRate !== undefined
                              ? Number(fwdRate).toFixed(4)
                              : "N/A"}
                          </td>
                          <td>
                            {varItem?.["VaR 1%"] !== undefined
                              ? varItem["VaR 1%"].toFixed(2)
                              : "N/A"}
                          </td>
                          <td>
                            {varItem?.["VaR 5%"] !== undefined
                              ? varItem["VaR 5%"].toFixed(2)
                              : "N/A"}
                          </td>
                          <td>
                            {varItem?.["VaR 10%"] !== undefined
                              ? varItem["VaR 10%"].toFixed(2)
                              : "N/A"}
                          </td>
                          <td>
                            {openPosId ? (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleConvert(openPosId)}
                              >
                                Convert
                              </button>
                            ) : (
                              "N/A"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExposureSummary;
