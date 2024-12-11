import React from "react";
import { Modal, Button, Form } from "react-bootstrap";

const EditOrderModal = ({
  show,
  onClose,
  status,
  setStatus,
  executionRate,
  setExecutionRate,
  bankName,
  setBankName,
  historicalLoss,
  setHistoricalLoss,
  onSaveChanges,
  activeTab,
}) => {
  const isMatchedOrders = activeTab === "MatchedOrders";

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Order</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {!isMatchedOrders && ( // Only show status for tabs other than MatchedOrders
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="Executed">Executed</option>
                <option value="Cancelled">Cancelled</option>
              </Form.Select>
            </Form.Group>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Execution Rate</Form.Label>
            <Form.Control
              type="number"
              value={executionRate}
              onChange={(e) => setExecutionRate(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Bank Name</Form.Label>
            <Form.Control
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Historical Loss</Form.Label>
            <Form.Control
              type="number"
              value={historicalLoss}
              onChange={(e) => setHistoricalLoss(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" onClick={onSaveChanges}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditOrderModal;
