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
  onSaveChanges,
}) => {
  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Order</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Status</Form.Label>
            <Form.Control
              as="select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="Executed">Executed</option>
              <option value="Market">Market</option>
            </Form.Control>
          </Form.Group>

          <Form.Group>
            <Form.Label>Execution Rate</Form.Label>
            <Form.Control
              type="text"
              value={executionRate}
              onChange={(e) => setExecutionRate(e.target.value)}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Bank Name</Form.Label>
            <Form.Control
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
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
