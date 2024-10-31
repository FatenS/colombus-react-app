import React from "react";
import { Dropdown } from "react-bootstrap";

const SubmitOrderForm = ({
  amount,
  setAmount,
  bankAccount,
  setBankAccount,
  transactionType,
  setTransactionType,
  valueDate,
  setValueDate,
  currency,
  setCurrency,
  onSubmit, // This is the submit function from the parent component
}) => {
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    // Create an object with the form data
    const orderData = {
      amount: parseFloat(amount),
      transaction_type: transactionType,
      value_date: valueDate,
      currency: currency,
      bank_account: bankAccount, // Correctly named 'bank_account' to match the backend
    };

    // Call the onSubmit handler passed from the parent, passing the form data
    onSubmit(orderData);
  };

  return (
    <div className="card">
      <div className="card-header border-0 pb-0">
        <h4 className="card-title mb-0">Submit Future Trade</h4>
      </div>
      <div className="card-body pt-2">
        <form onSubmit={handleSubmit}>
          <div className="input-group mb-3">
            <span className="input-group-text">Amount</span>
            <input
              type="number"
              className="form-control"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="input-group mb-3">
            <Dropdown>
              <Dropdown.Toggle>{transactionType}</Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setTransactionType("buy")}>
                  Buy
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setTransactionType("sell")}>
                  Sell
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
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
          <div className="input-group mb-3">
            <Dropdown>
              <Dropdown.Toggle>{currency}</Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setCurrency("USD")}>
                  USD
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setCurrency("EUR")}>
                  EUR
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
          <div className="input-group mb-3">
            <span className="input-group-text">Bank Account</span>
            <input
              type="text"
              className="form-control"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              required
            />
          </div>
          <div className="mt-3 d-flex justify-content-between">
            <button
              type="submit"
              className="btn btn-success btn-sm light text-uppercase me-3 btn-block"
            >
              Submit Order
            </button>
            <a
              href="#!"
              className="btn btn-danger btn-sm light text-uppercase btn-block"
              onClick={() => {
                setAmount("");
                setBankAccount("");
                setTransactionType("buy");
                setValueDate("");
                setCurrency("USD");
              }}
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitOrderForm;
