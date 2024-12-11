import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import { Nav, Tab } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
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
  const dispatch = useDispatch();
  const orders = useSelector((state) => state.orderReducer.orders || []);
  const uploadSuccess = useSelector(
    (state) => state.orderReducer.uploadSuccess
  );
  const [forwardData, setForwardData] = useState([]);
  const [varData, setVarData] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState({
    label: "EUR",
    value: "EUR",
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    const fetchForwardData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5001/api/calculate-forward-rate"
        );
        setForwardData(response.data);
      } catch (error) {
        console.error("Error fetching forward rate data", error);
      }
    };

    const fetchVarData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5001/api/calculate-var"
        );
        setVarData(response.data);
      } catch (error) {
        console.error("Error fetching VaR data", error);
      }
    };

    fetchForwardData();
    fetchVarData();
  }, [selectedCurrency, selectedDate, uploadSuccess]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadMessage("Please select a file first.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post("http://localhost:5001/admin/upload-file", formData);
      setUploadMessage("File uploaded successfully.");
      const fetchForwardData = async () => {
        const response = await axios.get(
          "http://localhost:5001/api/calculate-forward-rate"
        );
        setForwardData(response.data);
      };
      const fetchVarData = async () => {
        const response = await axios.get(
          "http://localhost:5001/api/calculate-var"
        );
        setVarData(response.data);
      };
      fetchForwardData();
      fetchVarData();
    } catch (error) {
      setUploadMessage("Error uploading file. Please try again.");
      console.error("Error uploading file", error);
    }
  };

  const processedData = useMemo(() => {
    let filteredOrders = orders.filter(
      (order) => order.currency === selectedCurrency.value
    );
    if (selectedDate) {
      const formattedSelectedDate = formatDate(selectedDate);
      filteredOrders = filteredOrders.filter(
        (order) => order.value_date === formattedSelectedDate
      );
    }

    const dataByDate = {};
    let totalExportSum = 0;
    let totalImportSum = 0;
    filteredOrders.forEach((order) => {
      const dateKey = order.value_date;
      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = { export: 0, import: 0 };
      }
      if (order.transaction_type.trim().toLowerCase() === "sell") {
        dataByDate[dateKey].export += order.amount;
        totalExportSum += order.amount;
      } else if (order.transaction_type.trim().toLowerCase() === "buy") {
        dataByDate[dateKey].import += order.amount;
        totalImportSum += order.amount;
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
  }, [orders, selectedCurrency, selectedDate]);

  const chartData = processedData.dates.map((date, index) => ({
    valueDate: date,
    netExposure: parseFloat(processedData.netExposureRow[index + 2]),
    var1: varData.find((item) => item["Value Date"] === date)?.["VaR 1%"] || 0,
    var5: varData.find((item) => item["Value Date"] === date)?.["VaR 5%"] || 0,
    var10:
      varData.find((item) => item["Value Date"] === date)?.["VaR 10%"] || 0,
  }));

  return (
    <div className="row">
      {/* File Upload Section */}

      <div className="col-xl-12">
        <div className="card mt-4">
          <div className="card-body">
            <h5 className="card-title">Upload Exchange Data</h5>
            <input
              type="file"
              onChange={handleFileChange}
              className="form-control mb-3"
            />
            <button onClick={handleUpload} className="btn btn-primary">
              Upload File
            </button>
            {uploadMessage && <p className="mt-2">{uploadMessage}</p>}
          </div>
        </div>
      </div>

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

      {/* First Exposure Summary Table */}
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

      {/* Stacked Bar Chart for Value Date and Net Exposure */}
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

      {/* Second Table for Forward Rate and VaR Data */}
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
                  </tr>
                </thead>
                <tbody>
                  {processedData.dates.map((date, index) => {
                    const forwardItem = forwardData.find(
                      (item) => item["Value Date"] === date
                    );
                    const varItem = varData.find(
                      (item) => item["Value Date"] === date
                    );
                    return (
                      <tr key={index}>
                        <td>{date}</td>
                        <td>{forwardItem?.Days || "0"}</td>
                        <td>
                          {selectedCurrency.value === "EUR"
                            ? `${
                                forwardItem?.["Forward Rate"].toFixed(4) ||
                                "N/A"
                              } `
                            : `${
                                forwardItem?.["Forward Rate"].toFixed(4) ||
                                "N/A"
                              } `}
                        </td>
                        <td>{varItem?.["VaR 1%"]?.toFixed(2) || "N/A"}</td>
                        <td>{varItem?.["VaR 5%"]?.toFixed(2) || "N/A"}</td>
                        <td>{varItem?.["VaR 10%"]?.toFixed(2) || "N/A"}</td>
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
