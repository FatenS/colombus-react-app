import React, { useState } from "react";
import { Dropdown } from "react-bootstrap";
import axios from "axios";
import { Link } from "react-router-dom";

const FutureTrade = () => {
  // State for the form fields
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [bankAccount, setBankAccount] = useState("USDT");
  const [transactionType, setTransactionType] = useState("buy");
  const [valueDate, setValueDate] = useState("");
  const [currency, setCurrency] = useState("USD");

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const orderData = {
      price: parseFloat(price),
      size: parseFloat(size),
      transaction_type: transactionType,
      amount: parseFloat(size * price), // Adjust amount if needed
      currency: currency,
      value_date: valueDate, // Ensure correct date format (e.g., "2024-10-10")
      bank_account: bankAccount,
    };

    try {
      // Make a POST request to submit the order
      const response = await axios.post(
        "http://localhost:5001/orders",
        orderData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Assuming JWT token is stored in localStorage
          },
        }
      );
      console.log(response.data.message);
      alert("Order submitted successfully!");
    } catch (error) {
      console.error("Error submitting order", error);
      alert("Error submitting order.");
    }
  };

  return (
    <div className="card">
      <div className="card-header border-0 pb-0">
        <h4 className="card-title mb-0">Submit Future Trade</h4>
      </div>
      <div className="card-body pt-2">
        <form onSubmit={handleSubmit}>
          {/* Price Input */}
          <div className="input-group mb-3">
            <span className="input-group-text">Price</span>
            <input
              type="number"
              className="form-control"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <span className="input-group-text">USDT</span>
          </div>

          {/* Size Input */}
          <div className="input-group mb-3">
            <span className="input-group-text">Size</span>
            <input
              type="number"
              className="form-control"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              required
            />
            <Dropdown className="drop-future">
              <Dropdown.Toggle className="btn btn-primary btn-outline-primary left-radius">
                {bankAccount}
              </Dropdown.Toggle>
              <Dropdown.Menu as="ul" className="dropdown-menu-end">
                <li>
                  <Link
                    to={"#"}
                    className="dropdown-item"
                    onClick={() => setBankAccount("USDT")}
                  >
                    USDT
                  </Link>
                </li>
                <li>
                  <Link
                    to={"#"}
                    className="dropdown-item"
                    onClick={() => setBankAccount("BTC")}
                  >
                    BTC
                  </Link>
                </li>
              </Dropdown.Menu>
            </Dropdown>
          </div>

          {/* Transaction Type (Buy/Sell) */}
          <div className="input-group mb-3">
            <label className="form-label me-2">Transaction Type</label>
            <Dropdown className="drop-future">
              <Dropdown.Toggle className="btn btn-primary btn-outline-primary left-radius">
                {transactionType}
              </Dropdown.Toggle>
              <Dropdown.Menu as="ul" className="dropdown-menu-end">
                <li>
                  <Link
                    to={"#"}
                    className="dropdown-item"
                    onClick={() => setTransactionType("buy")}
                  >
                    Buy
                  </Link>
                </li>
                <li>
                  <Link
                    to={"#"}
                    className="dropdown-item"
                    onClick={() => setTransactionType("sell")}
                  >
                    Sell
                  </Link>
                </li>
              </Dropdown.Menu>
            </Dropdown>
          </div>

          {/* Value Date Input */}
          <div className="input-group mb-3">
            <span className="input-group-text">Value Date</span>
            <input
              type="date"
              className="form-control"
              value={valueDate}
              onChange={(e) => setValueDate(e.target.value)}
              required
            />
          </div>

          {/* Currency Input */}
          <div className="input-group mb-3">
            <span className="input-group-text">Currency</span>
            <Dropdown className="drop-future">
              <Dropdown.Toggle className="btn btn-primary btn-outline-primary left-radius">
                {currency}
              </Dropdown.Toggle>
              <Dropdown.Menu as="ul" className="dropdown-menu-end">
                <li>
                  <Link
                    to={"#"}
                    className="dropdown-item"
                    onClick={() => setCurrency("USD")}
                  >
                    USD
                  </Link>
                </li>
                <li>
                  <Link
                    to={"#"}
                    className="dropdown-item"
                    onClick={() => setCurrency("EUR")}
                  >
                    EUR
                  </Link>
                </li>
              </Dropdown.Menu>
            </Dropdown>
          </div>

          {/* Submit and Cancel Buttons */}
          <div className="mt-3 d-flex justify-content-between">
            <button
              type="submit"
              className="btn btn-success btn-sm light text-uppercase me-3 btn-block"
            >
              Submit Order
            </button>
            <Link
              to={"#"}
              className="btn btn-danger btn-sm light text-uppercase btn-block"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FutureTrade;
