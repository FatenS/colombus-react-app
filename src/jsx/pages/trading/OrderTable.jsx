import React from "react";
import { Button } from "react-bootstrap";

const OrderTable = ({ orders, isAdmin, onEditClick }) => {
  if (!Array.isArray(orders) || orders.length === 0) {
    return <div className="alert alert-warning">No orders found.</div>;
  }

  return (
    <div className="table-responsive">
      <table className="table shadow-hover orderbookTable">
        <thead>
          <tr>
            <th>ID</th>
            <th>Transaction Type</th>
            <th>Amount</th>
            <th>Currency</th>
            <th>Status</th>
            <th>Value Date</th>
            {isAdmin && <th>Execution Rate</th>}
            {isAdmin && <th>Bank Name</th>}
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {orders.map((order, i) => (
            <tr key={i}>
              <td>{order.id}</td>
              <td>{order.transaction_type}</td>
              <td>{order.amount}</td>
              <td>{order.currency}</td>
              <td>{order.status}</td>
              <td>{order.value_date}</td>
              {order.status === "Executed" && isAdmin && (
                <>
                  <td>{order.execution_rate || "N/A"}</td>
                  <td>{order.bank_name || "N/A"}</td>
                </>
              )}
              {isAdmin && (
                <td>
                  {order.status === "Market" && (
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => onEditClick(order)}
                    >
                      Edit
                    </Button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;
