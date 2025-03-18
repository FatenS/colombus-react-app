import React, { useState } from "react";
import { Button, Form, Table } from "react-bootstrap";
import Swal from "sweetalert2";

const PremiumRateForm = ({ premiumRates, onCreate, onUpdate, onDelete }) => {
  const [currency, setCurrency] = useState("");
  const [maturityDays, setMaturityDays] = useState("");
  const [premiumPercentage, setPremiumPercentage] = useState("");
  // NEW: Option type state with default value "CALL"
  const [optionType, setOptionType] = useState("CALL");
  // NEW: Transaction type state with default value "buy"
  const [transactionType, setTransactionType] = useState("buy");
  const [editingRate, setEditingRate] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    const rateData = {
      currency,
      maturity_days: parseInt(maturityDays),
      premium_percentage: parseFloat(premiumPercentage),
      // NEW: Include option_type and transaction_type in the payload
      option_type: optionType,
      transaction_type: transactionType,
    };

    if (editingRate) {
      onUpdate({ ...rateData, id: editingRate.id })
        .then(() => {
          Swal.fire({
            icon: "success",
            title: "Premium Rate Updated",
            text: "The premium rate has been updated successfully.",
          });
          setEditingRate(null);
          resetForm();
        })
        .catch(() => {
          Swal.fire({
            icon: "error",
            title: "Update Failed",
            text: "There was an issue updating the premium rate. Please try again.",
          });
        });
    } else {
      onCreate(rateData)
        .then(() => {
          Swal.fire({
            icon: "success",
            title: "Premium Rate Created",
            text: "The premium rate has been created successfully.",
          });
          resetForm();
        })
        .catch(() => {
          Swal.fire({
            icon: "error",
            title: "Creation Failed",
            text: "There was an issue creating the premium rate. Please try again.",
          });
        });
    }
  };

  const handleEdit = (rate) => {
    setEditingRate(rate);
    setCurrency(rate.currency);
    setMaturityDays(rate.maturity_days);
    setPremiumPercentage(rate.premium_percentage);
    // NEW: Set the option type and transaction type when editing
    setOptionType(rate.option_type || "CALL");
    setTransactionType(rate.transaction_type || "buy");
  };

  const handleDelete = (rateId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(rateId)
          .then(() => {
            Swal.fire("Deleted!", "The premium rate has been deleted.", "success");
          })
          .catch(() => {
            Swal.fire("Error!", "Failed to delete the premium rate.", "error");
          });
      }
    });
  };

  const resetForm = () => {
    setCurrency("");
    setMaturityDays("");
    setPremiumPercentage("");
    setOptionType("CALL"); // Reset option type to default
    setTransactionType("buy"); // NEW: Reset transaction type to default
    setEditingRate(null);
  };

  return (
    <div>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Currency</Form.Label>
          <Form.Control
            type="text"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Maturity Days</Form.Label>
          <Form.Control
            type="number"
            value={maturityDays}
            onChange={(e) => setMaturityDays(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Premium Percentage</Form.Label>
          <Form.Control
            type="number"
            step="0.01"
            value={premiumPercentage}
            onChange={(e) => setPremiumPercentage(e.target.value)}
            required
          />
        </Form.Group>
        {/* NEW: Option Type Field */}
        <Form.Group className="mb-3">
          <Form.Label>Option Type</Form.Label>
          <Form.Control
            as="select"
            value={optionType}
            onChange={(e) => setOptionType(e.target.value)}
            required
          >
            <option value="CALL">CALL</option>
            <option value="PUT">PUT</option>
          </Form.Control>
        </Form.Group>
        {/* NEW: Transaction Type Field */}
        <Form.Group className="mb-3">
          <Form.Label>Transaction Type</Form.Label>
          <Form.Control
            as="select"
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
            required
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </Form.Control>
        </Form.Group>
        <Button type="submit" variant="primary">
          {editingRate ? "Update Rate" : "Create Rate"}
        </Button>
        {editingRate && (
          <Button variant="secondary" onClick={resetForm} className="ms-2">
            Cancel
          </Button>
        )}
      </Form>

      <Table striped bordered hover className="mt-4">
        <thead>
          <tr>
            <th>Currency</th>
            <th>Maturity Days</th>
            <th>Premium Percentage</th>
            <th>Option Type</th>
            {/* NEW: Transaction Type Column */}
            <th>Transaction Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {premiumRates.map((rate) => (
            <tr key={rate.id}>
              <td>{rate.currency}</td>
              <td>{rate.maturity_days}</td>
              <td>{rate.premium_percentage}</td>
              <td>{rate.option_type}</td>
              {/* NEW: Display transaction type */}
              <td>{rate.transaction_type}</td>
              <td>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => handleEdit(rate)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(rate.id)}
                  className="ms-2"
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default PremiumRateForm;
