import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

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
  // 3) Upload states
  //    A) For uploading exchange data
  //    B) For uploading open positions
  // ------------------------------------------------
  const [fileExchange, setFileExchange] = useState(null);
  const [uploadMessageExchange, setUploadMessageExchange] = useState("");

  const [fileOpenPos, setFileOpenPos] = useState(null);
  const [uploadMessageOpenPos, setUploadMessageOpenPos] = useState("");

  // ------------------------------------------------
  // Helper: get token from localStorage
  // ------------------------------------------------
  const getAuthHeaders = () => {
    const token = localStorage.getItem("accessToken"); // or "token", etc.
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // ------------------------------------------------
  // 4) Functions to fetch data from backend
  // ------------------------------------------------
  const fetchOpenPositions = async () => {
    try {
      const response = await axios.get("http://localhost:5001/open-positions", {
        headers: getAuthHeaders(),
      });
      setOpenPositions(response.data);
    } catch (error) {
      console.error("Error fetching open positions", error);
    }
  };

  const fetchForwardData = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/calculate-forward-rate",
        { headers: getAuthHeaders() }
      );
      setForwardData(response.data);
    } catch (error) {
      console.error("Error fetching forward rate data", error);
    }
  };

  const fetchVarData = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/calculate-var",
        { headers: getAuthHeaders() }
      );
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
  }, [
    selectedCurrency,
    selectedDate,
    uploadMessageExchange,
    uploadMessageOpenPos,
  ]);

  // ------------------------------------------------
  // 6) File handlers - Exchange Data
  // ------------------------------------------------
  const handleExchangeFileChange = (e) => {
    setFileExchange(e.target.files[0]);
  };

  const handleUploadExchange = async () => {
    if (!fileExchange) {
      setUploadMessageExchange("Please select an Exchange Data file first.");
      return;
    }
    const formData = new FormData();
    formData.append("file", fileExchange);

    try {
      await axios.post("http://localhost:5001/admin/upload-file", formData, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadMessageExchange("Exchange Data file uploaded successfully.");
      // Optionally re-fetch forward & var data
      fetchForwardData();
      fetchVarData();
    } catch (error) {
      setUploadMessageExchange(
        "Error uploading exchange data file. Please try again."
      );
      console.error("Error uploading exchange data file", error);
    }
  };

  // ------------------------------------------------
  // 7) File handlers - Open Positions
  // ------------------------------------------------
  const handleOpenPosFileChange = (e) => {
    setFileOpenPos(e.target.files[0]);
  };

  const handleUploadOpenPos = async () => {
    if (!fileOpenPos) {
      setUploadMessageOpenPos("Please select a file for open positions.");
      return;
    }
    const formData = new FormData();
    formData.append("file", fileOpenPos);

    try {
      await axios.post(
        "http://localhost:5001/upload-open-positions",
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadMessageOpenPos("Open Positions file uploaded successfully.");
      // Refresh the open positions table
      fetchOpenPositions();
    } catch (error) {
      setUploadMessageOpenPos(
        "Error uploading open positions file. Please try again."
      );
      console.error("Error uploading open positions file", error);
    }
  };

  // ------------------------------------------------
  // 8) Convert function
  // ------------------------------------------------
  const handleConvert = async (openPositionId) => {
    try {
      await axios.post(
        `http://localhost:5001/convert-open-position/${openPositionId}`,
        {},
        {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
        }
      );
      alert("Open position converted successfully!");
      setOpenPositions((prev) =>
        prev.filter((pos) => pos.id !== openPositionId)
      );
    } catch (error) {
      console.error("Error converting open position:", error);
      alert("Could not convert open position. See console for details.");
    }
  };

  // ------------------------------------------------
  // 9) Process open positions for the summary table
  // ------------------------------------------------
  const processedData = useMemo(() => {
    // Filter by currency
    let filteredPositions = openPositions.filter(
      (pos) => pos.currency === selectedCurrency.value
    );

    // Filter by date if selected
    if (selectedDate) {
      const formattedSelectedDate = formatDate(selectedDate);
      filteredPositions = filteredPositions.filter(
        (pos) => pos.value_date === formattedSelectedDate
      );
    }

    // Summarize
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

    // Sort by ascending date
    const dates = Object.keys(dataByDate).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    // Build rows
    const netExposureRow = ["Net Exposure"];
    const exportRow = ["Export"];
    const importRow = ["Import"];

    dates.forEach((date) => {
      const { export: totalExport, import: totalImport } = dataByDate[date];
      netExposureRow.push((totalExport - totalImport).toFixed(2));
      exportRow.push(totalExport.toFixed(2));
      importRow.push(totalImport.toFixed(2));
    });

    // Insert total sums after the first cell
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
  // 10) Build chart data with netExposure + VaR
  // ------------------------------------------------
  const chartData = processedData.dates.map((date, index) => ({
    valueDate: date,
    netExposure: parseFloat(processedData.netExposureRow[index + 2]) || 0,
    var1: varData.find((item) => item["Value Date"] === date)?.["VaR 1%"] || 0,
    var5: varData.find((item) => item["Value Date"] === date)?.["VaR 5%"] || 0,
    var10:
      varData.find((item) => item["Value Date"] === date)?.["VaR 10%"] || 0,
  }));

  // ------------------------------------------------
  // 11) Render
  // ------------------------------------------------
  return (
    <div className="row">
      {/* -------------------------------------------------- */}
      {/* A) Upload EXCHANGE DATA Section                    */}
      {/* -------------------------------------------------- */}
      <div className="col-xl-6">
        <div className="card mt-4">
          <div className="card-body">
            <h5 className="card-title">Upload Exchange Data</h5>
            <input
              type="file"
              onChange={handleExchangeFileChange}
              className="form-control mb-3"
            />
            <button onClick={handleUploadExchange} className="btn btn-primary">
              Upload Exchange Data
            </button>
            {uploadMessageExchange && (
              <p className="mt-2">{uploadMessageExchange}</p>
            )}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* B) Upload OPEN POSITIONS Section                  */}
      {/* -------------------------------------------------- */}
      <div className="col-xl-6">
        <div className="card mt-4">
          <div className="card-body">
            <h5 className="card-title">Upload Open Positions</h5>
            <input
              type="file"
              onChange={handleOpenPosFileChange}
              className="form-control mb-3"
            />
            <button onClick={handleUploadOpenPos} className="btn btn-primary">
              Upload Open Positions
            </button>
            {uploadMessageOpenPos && (
              <p className="mt-2">{uploadMessageOpenPos}</p>
            )}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* C) Currency & Date Filters                         */}
      {/* -------------------------------------------------- */}
      <div className="col-xl-12">
        <div className="card">
          <div className="card-header border-0">
            <div className="d-flex flex-wrap">
              <Select
                className="custom-react-select p2p-select width-100 mb-2"
                options={currencyOptions}
                value={selectedCurrency}
                onChange={setSelectedCurrency}
                isSearchable={false}
              />
              <div className="ml-2 mb-2">
                <DatePicker
                  selected={selectedDate}
                  onChange={setSelectedDate}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select a date"
                  className="form-control"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* D) Exposure Summary Table                          */}
      {/* -------------------------------------------------- */}
      <div className="col-xl-12">
        <div className="card">
          <div className="card-body">
            <h4 className="card-title">Exposure Summary</h4>
            <div className="table-responsive mt-4">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    {processedData.headers.map((header, index) => (
                      <th key={index}>{header}</th>
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
                            <>
                              {selectedCurrency.value === "EUR"
                                ? `${cell} €`
                                : `$${cell}`}
                            </>
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

      {/* -------------------------------------------------- */}
      {/* E) Net Exposure & VaR Chart                        */}
      {/* -------------------------------------------------- */}
      <div className="col-xl-12">
        <div className="card mt-4">
          <div className="card-body">
            <h5 className="card-title">Net Exposure and VaR Over Time</h5>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="valueDate" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="netExposure"
                  fill="#8884d8"
                  stackId="a"
                  name="Net Exposure"
                />
                <Bar dataKey="var1" fill="#FF6666" stackId="a" name="VaR 1%" />
                <Bar dataKey="var5" fill="#E60000" stackId="a" name="VaR 5%" />
                <Bar
                  dataKey="var10"
                  fill="#990000"
                  stackId="a"
                  name="VaR 10%"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* F) Additional Table: Forward Rate + VaR + Convert  */}
      {/* -------------------------------------------------- */}
      <div className="col-xl-12">
        <div className="card mt-4">
          <div className="card-body">
            <h5 className="card-title">Forward Rate and Value at Risk</h5>
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
                    <th>Action</th> {/* NEW: Convert button column */}
                  </tr>
                </thead>
                <tbody>
                  {forwardData.map((item, idx) => {
                    const dateVal = item["Value Date"];
                    const days = item.Days || 0;
                    const fwdRate = item["Forward Rate"];
                    const openPosId = item["open_position_id"]; // from backend

                    // For VaR, see if there's a matching var record
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
  );
};

export default ExposureSummary;
