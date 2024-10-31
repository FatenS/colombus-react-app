import React, { useState, useEffect } from "react";
import { Tab, Nav, Button, Dropdown, Form } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { FaArrowUp, FaArrowDown } from "react-icons/fa"; // Importing icons for buy/sell
import EditOrderModal from "./EditOrderModal";
import {
  fetchOrdersAction,
  fetchMatchedOrdersAction,
  fetchMarketOrdersAction,
  runMatchingAction,
  updateMarketOrderAction,
  submitOrderAction,
  uploadOrdersAction,
} from "../../../store/actions/OrderActions";

const FutureTrading = () => {
  const dispatch = useDispatch();
  const [selectedFile, setSelectedFile] = useState(null); // File upload state
  const [uploadStatus, setUploadStatus] = useState(""); // Upload feedback

  const {
    orders = [], // All orders fetched
    matchedOrders = [], // Matched Orders (kept unchanged)
    marketOrders = [], // Market Orders
  } = useSelector((state) => state.orderReducer || {});
  const { roles = [] } = useSelector((state) => state.auth.auth || {});
  const isAdmin = roles.includes("Admin");

  const [activeTab, setActiveTab] = useState("Order");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [executionRate, setExecutionRate] = useState("");
  const [bankName, setBankName] = useState("");

  // Form state for submitting new orders
  const [amount, setAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [transactionType, setTransactionType] = useState("buy");
  const [valueDate, setValueDate] = useState("");
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    if (activeTab === "Order") {
      dispatch(fetchOrdersAction(isAdmin)); // Fetch all orders for the client or admin
    } else if (activeTab === "MarketOrders") {
      dispatch(fetchMarketOrdersAction()); // Fetch market orders
    } else if (activeTab === "MatchedOrders") {
      dispatch(fetchMatchedOrdersAction()); // Fetch matched orders
    }
  }, [dispatch, activeTab, isAdmin]);

  // Upload file handler for clients
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Upload file handler for clients
  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadStatus("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // Dispatch the uploadOrdersAction
      await dispatch(uploadOrdersAction(formData));
      setUploadStatus("File uploaded successfully.");
    } catch (error) {
      setUploadStatus(
        "Error uploading file: " +
          (error.response?.data?.error || "Unknown error")
      );
    }
  };

  // Editing Market Orders
  const handleEditMarketOrderClick = (order) => {
    setEditingOrder(order);
    setStatus(order.status);
    setExecutionRate(order.execution_rate || "");
    setBankName(order.bank_name || "");
    setShowEditModal(true);
  };

  // Saving updated market orders
  const handleSaveMarketOrderChanges = () => {
    const updatedOrder = {
      status,
      execution_rate: executionRate,
      bank_name: bankName,
    };

    dispatch(updateMarketOrderAction(editingOrder.id, updatedOrder))
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "Market Order Updated!",
          text: "The market order has been successfully updated.",
        });
        setShowEditModal(false);
        setEditingOrder(null);
      })
      .catch(() => {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: "Something went wrong, please try again.",
        });
      });
  };

  // Submitting new orders
  const handleSubmitOrder = () => {
    if (
      !amount ||
      !transactionType ||
      !bankAccount ||
      !valueDate ||
      !currency
    ) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fill in all fields before submitting.",
      });
      return;
    }

    const orderData = {
      amount: parseFloat(amount),
      transaction_type: transactionType,
      value_date: valueDate,
      currency,
      bank_account: bankAccount,
    };

    dispatch(submitOrderAction(orderData))
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "Order Submitted",
          text: "Your order has been submitted successfully.",
        });
        resetForm();
      })
      .catch((error) => {
        Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text: "There was an issue submitting your order. Please try again.",
        });
      });
  };

  const resetForm = () => {
    setAmount("");
    setBankAccount("");
    setTransactionType("buy");
    setValueDate("");
    setCurrency("USD");
  };

  // SubmitOrderForm component
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
    onSubmit,
  }) => {
    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit();
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
                onClick={resetForm}
              >
                Cancel
              </a>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // OrderTable component with icons for buy/sell
  const OrderTable = ({ orders, isAdmin, onEditClick, showRateAndBank }) => {
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
              {showRateAndBank && <th>Execution Rate </th>}
              {showRateAndBank && <th>Bank Name</th>}
              {showRateAndBank && isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {orders.map((order, i) => (
              <tr key={i}>
                <td>{order.id}</td>
                <td>
                  {order.transaction_type === "buy" ? (
                    <>
                      <FaArrowDown
                        style={{ color: "green", marginRight: "5px" }}
                      />
                      Buy
                    </>
                  ) : (
                    <>
                      <FaArrowUp style={{ color: "red", marginRight: "5px" }} />
                      Sell
                    </>
                  )}
                </td>
                <td>{order.amount}</td>
                <td>{order.currency}</td>
                <td>{order.status}</td>
                <td>{order.value_date}</td>
                {showRateAndBank && (
                  <td>{order.execution_rate ? order.execution_rate : "N/A"}</td>
                )}
                {showRateAndBank && (
                  <td>{order.bank_name ? order.bank_name : "N/A"}</td>
                )}
                {showRateAndBank && isAdmin && (
                  <td>
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => onEditClick(order)}
                    >
                      Edit
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="row">
      {/* File upload functionality for the client */}
      {!isAdmin && (
        <div className="col-12 mt-3">
          <div className="file-upload">
            <Form.Group>
              <Form.Label>Upload Excel File for Orders</Form.Label>
              <Form.Control type="file" onChange={handleFileChange} />
              <Button
                className="mt-2"
                variant="primary"
                onClick={handleFileUpload}
              >
                Upload Orders
              </Button>
              {uploadStatus && <p>{uploadStatus}</p>}
            </Form.Group>
          </div>
        </div>
      )}

      {!isAdmin && (
        <div className="col-xl-4">
          <SubmitOrderForm
            amount={amount}
            setAmount={setAmount}
            bankAccount={bankAccount}
            setBankAccount={setBankAccount}
            transactionType={transactionType}
            setTransactionType={setTransactionType}
            valueDate={valueDate}
            setValueDate={setValueDate}
            currency={currency}
            setCurrency={setCurrency}
            onSubmit={handleSubmitOrder}
          />
        </div>
      )}

      <div className={isAdmin ? "col-xl-12" : "col-xl-8"}>
        <div className="card">
          <Tab.Container
            activeKey={activeTab}
            onSelect={(key) => setActiveTab(key)}
          >
            <div className="card-header border-0 pb-3 flex-wrap">
              <h4 className="card-title">Trade Status</h4>
              <Nav as="div" className="nav-pills light">
                <Nav.Link as="button" eventKey="Order">
                  Orders
                </Nav.Link>
                {isAdmin && (
                  <>
                    <Nav.Link as="button" eventKey="MarketOrders">
                      Market Orders
                    </Nav.Link>
                    <Nav.Link as="button" eventKey="MatchedOrders">
                      Matched Orders
                    </Nav.Link>
                  </>
                )}
              </Nav>
            </div>
            <div className="card-body pt-0">
              <Tab.Content>
                <Tab.Pane eventKey="Order">
                  <OrderTable
                    orders={orders}
                    isAdmin={isAdmin}
                    showRateAndBank={false}
                  />
                </Tab.Pane>

                <Tab.Pane eventKey="MarketOrders">
                  <OrderTable
                    orders={marketOrders}
                    isAdmin={isAdmin}
                    onEditClick={handleEditMarketOrderClick}
                    showRateAndBank={true}
                  />
                </Tab.Pane>

                <Tab.Pane eventKey="MatchedOrders">
                  <div className="table-responsive">
                    <table className="table shadow-hover orderbookTable">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Buyer</th>
                          <th>Seller</th>
                          <th>Amount</th>
                          <th>Currency</th>
                          <th>Value Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchedOrders.map((order, i) => (
                          <tr key={i}>
                            <td>{order.id}</td>
                            <td>{order.buyer}</td>
                            <td>{order.seller}</td>
                            <td>{order.matched_amount}</td>
                            <td>{order.currency}</td>
                            <td>{order.value_date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Tab.Pane>
              </Tab.Content>
            </div>
          </Tab.Container>
        </div>
      </div>

      {isAdmin && (
        <div className="col-12 mt-3">
          <Button
            onClick={() => dispatch(runMatchingAction())}
            className="btn btn-primary"
          >
            Run Matching
          </Button>
        </div>
      )}

      <EditOrderModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        status={status}
        setStatus={setStatus}
        executionRate={executionRate}
        setExecutionRate={setExecutionRate}
        bankName={bankName}
        setBankName={setBankName}
        onSaveChanges={handleSaveMarketOrderChanges}
      />
    </div>
  );
};

export default FutureTrading;
