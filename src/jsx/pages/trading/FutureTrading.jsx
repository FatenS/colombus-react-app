import React, { useEffect, useState, useCallback } from "react";
import {
  Tab,
  Nav,
  Button,
  Dropdown,
  Form,
  Pagination,
  ToggleButton,
  ToggleButtonGroup,
  OverlayTrigger,
  Popover,
  Row,
  Col,
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { FaEdit, FaTrash, FaArrowUp, FaArrowDown, FaEye } from "react-icons/fa";
import EditOrderModal from "./EditOrderModal";
import PremiumRateForm from "./PremiumRateForm";

import {
  fetchOrdersAction,
  fetchMatchedOrdersAction,
  fetchMarketOrdersAction,
  runMatchingAction,
  updateMarketOrderAction,
  submitOrderAction,
  uploadOrdersAction,
  updateOrderClientAction,
  deleteOrderAction,
  updateOrderAction,
  fetchPremiumRatesAction,
  createPremiumRateAction,
  updatePremiumRateAction,
  deletePremiumRateAction,
} from "../../../store/actions/OrderActions";

/* ===========================
   SubmitOrderForm Component
   =========================== */
// Memoized to preserve focus in the inputs.
const SubmitOrderForm = React.memo(
  ({
    isEditMode,
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
    tradeType,
    setTradeType,
    onSubmit,
    onCancel,
  }) => {
    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit();
    };

    return (
      <div className="card shadow-sm">
        <div className="card-header border-0 pb-0">
          <h4 className="card-title mb-0">
            {isEditMode ? "Edit Order" : "Submit New Trade"}
          </h4>
        </div>
        <div className="card-body pt-2">
          <form onSubmit={handleSubmit}>
            {/* Trade Type Toggle */}
            <div className="mb-3 d-flex align-items-center">
              <span className="me-2">Trade Type:</span>
              <ToggleButtonGroup
                type="radio"
                name="tradeType"
                value={tradeType}
                onChange={(val) => setTradeType(val)}
              >
                <ToggleButton
                  id="tbg-radio-spot"
                  value="spot"
                  variant={tradeType === "spot" ? "primary" : "outline-primary"}
                >
                  Spot
                </ToggleButton>
                <ToggleButton
                  id="tbg-radio-forward"
                  value="forward"
                  variant={tradeType === "forward" ? "primary" : "outline-primary"}
                >
                  Forward
                </ToggleButton>
                <ToggleButton
                  id="tbg-radio-option"
                  value="option"
                  variant={tradeType === "option" ? "primary" : "outline-primary"}
                >
                  Option
                </ToggleButton>
              </ToggleButtonGroup>
            </div>

            {/* Amount */}
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

            {/* Transaction Type */}
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

            {/* Value Date */}
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

            {/* Currency */}
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

            {/* Bank Account */}
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

            {/* Action Buttons */}
            <div className="mt-3 d-flex justify-content-between">
              <button
                type="submit"
                className="btn btn-success btn-sm text-uppercase w-50 me-2"
              >
                {isEditMode ? "Update Order" : "Submit Order"}
              </button>
              <Button
                variant="danger"
                size="sm"
                className="text-uppercase w-50"
                onClick={(e) => {
                  e.preventDefault();
                  onCancel();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }
);

/* ===========================
   FutureTrading Component
   =========================== */
const FutureTrading = () => {
  const dispatch = useDispatch();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 10;

  const {
    orders = [],
    matchedOrders = [],
    marketOrders = [],
    premiumRates = [],
  } = useSelector((state) => state.orderReducer || {});
  const { roles = [] } = useSelector((state) => state.auth.auth || {});
  const isAdmin = roles.includes("Admin");

  // For admin view, use original tab names; for client view, use two tabs: "My Orders" and "New Trade"
  const initialClientTab = isAdmin ? "Order" : "MyOrders";
  const [activeTab, setActiveTab] = useState(initialClientTab);

  // Admin edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Admin fields (for Market/Matched orders)
  const [status, setStatus] = useState("");
  const [executionRate, setExecutionRate] = useState("");
  const [bankName, setBankName] = useState("");
  const [historicalLoss, setHistoricalLoss] = useState("");

  // Shared client form fields for create/edit
  const [amount, setAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [transactionType, setTransactionType] = useState("buy");
  const [valueDate, setValueDate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [tradeType, setTradeType] = useState("spot");

  // Reset active page if orders length changes
  useEffect(() => {
    const totalPages = Math.ceil(orders.length / itemsPerPage);
    if (activePage > totalPages && totalPages > 0) {
      setActivePage(1);
    }
  }, [orders, activePage, itemsPerPage]);

  // Fetch orders based on tab and role
  useEffect(() => {
    if (isAdmin) {
      if (activeTab === "Order") {
        dispatch(fetchOrdersAction(isAdmin));
      } else if (activeTab === "MarketOrders") {
        dispatch(fetchMarketOrdersAction());
      } else if (activeTab === "MatchedOrders") {
        dispatch(fetchMatchedOrdersAction());
      } else if (activeTab === "PremiumRates") {
        dispatch(fetchPremiumRatesAction());
      }
    } else {
      // Clients fetch only their own orders
      dispatch(fetchOrdersAction(isAdmin));
    }
  }, [dispatch, activeTab, isAdmin]);

  // --- File Upload (Client) ---
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadStatus("Please select a file first.");
      return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      await dispatch(uploadOrdersAction(formData));
      setUploadStatus("File uploaded successfully.");
      dispatch(fetchOrdersAction(isAdmin));
    } catch (error) {
      setUploadStatus(
        "Error uploading file: " +
          (error.response?.data?.error || "Unknown error")
      );
    }
  };

  // --- Handler Functions (using useCallback) ---
  const handleSubmitOrder = useCallback(() => {
    if (!amount || !transactionType || !bankAccount || !valueDate || !currency) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fill in all required fields before submitting.",
      });
      return;
    }
    const isOption = tradeType === "option";
    const orderData = {
      amount: parseFloat(amount),
      transaction_type: transactionType,
      value_date: valueDate,
      currency,
      bank_account: bankAccount,
      is_option: isOption,
    };
    dispatch(submitOrderAction(orderData))
      .then(() => {
        Swal.fire({
          icon: "success",
          title: isOption ? "Option Submitted" : "Order Submitted",
        });
        resetForm();
        // For clients, switch back to the "My Orders" tab after submit.
        if (!isAdmin) setActiveTab("MyOrders");
        dispatch(fetchOrdersAction(isAdmin));
      })
      .catch((error) => {
        console.error("Submission error:", error);
        Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text:
            "There was an issue submitting your order. Please see console for details.",
        });
      });
  }, [amount, transactionType, bankAccount, valueDate, currency, tradeType, dispatch, isAdmin]);

  const handleUpdateOrder = useCallback(() => {
    if (!editingOrder) return;
    const isOption = tradeType === "option";
    const updatedOrderData = {
      amount: parseFloat(amount),
      bank_account: bankAccount,
      transaction_type: transactionType,
      value_date: valueDate,
      currency,
      is_option: isOption,
    };
    dispatch(updateOrderClientAction(editingOrder.id, updatedOrderData))
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "Order Updated",
        });
        setIsEditMode(false);
        setEditingOrder(null);
        resetForm();
        if (!isAdmin) setActiveTab("MyOrders");
      })
      .catch(() => {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: "There was an issue updating your order. Please try again.",
        });
      });
  }, [editingOrder, amount, bankAccount, transactionType, valueDate, currency, tradeType, dispatch, isAdmin]);

  // --- Delete Order ---
  const handleDeleteOrder = (orderId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteOrderAction(orderId))
          .then(() => {
            Swal.fire("Deleted!", "Your order has been deleted.", "success");
          })
          .catch(() => {
            Swal.fire("Error!", "Failed to delete the order.", "error");
          });
      }
    });
  };

  // --- When editing an order (client) ---
  const handleEditOrderClick = (order) => {
    setEditingOrder(order);
    setAmount(order.amount);
    setTransactionType(order.transaction_type);
    setValueDate(order.value_date);
    setCurrency(order.currency);
    setBankAccount(order.bank_account);
    setIsEditMode(true);
    // In client view, switch to the New Trade tab when editing.
    setTradeType(order.is_option ? "option" : "spot");
    if (!isAdmin) setActiveTab("NewTrade");
  };

  // --- Reset Form ---
  const resetForm = () => {
    setAmount("");
    setBankAccount("");
    setTransactionType("buy");
    setValueDate("");
    setCurrency("USD");
    setTradeType("spot");
    setIsEditMode(false);
    setEditingOrder(null);
  };

  // --- Admin Actions for Market/Matched Orders ---
  const handleEditClick = (order, tab) => {
    setEditingOrder(order);
    setStatus(order.status || "");
    setExecutionRate(order.execution_rate || "");
    setBankName(order.bank_name || "");
    setHistoricalLoss(order.historical_loss || "");
    setActiveTab(tab);
    setShowEditModal(true);
  };

  const handleSaveChanges = () => {
    if (!status || !executionRate || !bankName || !historicalLoss) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "All fields are required.",
      });
      return;
    }
    const updatedOrder = {
      status,
      execution_rate: parseFloat(executionRate),
      bank_name: bankName,
      historical_loss: parseFloat(historicalLoss),
    };
    dispatch(updateOrderAction(editingOrder.id, updatedOrder))
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "Order Updated!",
          text: `The order in ${activeTab} has been updated successfully.`,
        });
        setShowEditModal(false);
        setEditingOrder(null);
        if (activeTab === "MarketOrders") {
          dispatch(fetchMarketOrdersAction());
        } else if (activeTab === "MatchedOrders") {
          dispatch(fetchMatchedOrdersAction());
        }
      })
      .catch((error) => {
        console.error("Error updating order:", error);
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: error.response?.data?.message || "An error occurred.",
        });
      });
  };

  const handleSaveMarketOrderChanges = () => {
    const updatedOrder = {
      status,
      execution_rate: parseFloat(executionRate),
      historical_loss: parseFloat(historicalLoss),
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
        dispatch(fetchMarketOrdersAction());
      })
      .catch(() => {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: "Something went wrong, please try again.",
        });
      });
  };

  // --- Pagination ---
  const handlePageChange = (page) => {
    setActivePage(page);
  };

  // --- OrderTable Component ---
  const OrderTable = ({
    orders,
    isAdmin,
    onEditClick,
    handleDeleteOrder,
    showRateAndBank,
    additionalAttributes = [],
  }) => {
    const currentOrders = orders.slice(
      (activePage - 1) * itemsPerPage,
      activePage * itemsPerPage
    );
    return (
      <div>
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
                {additionalAttributes.map((attr, i) => (
                  <th key={i}>{attr.label}</th>
                ))}
                <th>Premium</th>
                {showRateAndBank && <th>Execution Rate</th>}
                {showRateAndBank && <th>Bank Name</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map((order, i) => (
                <tr key={i}>
                  <td>{order.id}</td>
                  <td>
                    {order.transaction_type === "buy" ? (
                      <>
                        <FaArrowUp style={{ color: "green", marginRight: "5px" }} />
                        Buy
                      </>
                    ) : (
                      <>
                        <FaArrowDown style={{ color: "red", marginRight: "5px" }} />
                        Sell
                      </>
                    )}
                  </td>
                  <td>{order.amount}</td>
                  <td>{order.currency}</td>
                  <td>{order.status}</td>
                  <td>{order.value_date}</td>
                  {additionalAttributes.map((attr, j) => (
                    <td key={j}>{order[attr.key] || "N/A"}</td>
                  ))}
                  <td>
                    {order.is_option && order.premium ? (
                      <OverlayTrigger
                        trigger="click"
                        placement="top"
                        overlay={
                          <Popover>
                            <Popover.Body>
                              <strong>Premium:</strong> {order.premium}
                            </Popover.Body>
                          </Popover>
                        }
                      >
                        <Button variant="light" size="sm">
                          <FaEye />
                        </Button>
                      </OverlayTrigger>
                    ) : (
                      "—"
                    )}
                  </td>
                  {showRateAndBank && <td>{order.execution_rate ?? "N/A"}</td>}
                  {showRateAndBank && <td>{order.bank_name ?? "N/A"}</td>}
                  <td>
                    {showRateAndBank && isAdmin ? (
                      <Button variant="warning" size="sm" onClick={() => onEditClick(order)}>
                        Edit
                      </Button>
                    ) : order.status === "Pending" ? (
                      <>
                        <FaEdit
                          style={{ cursor: "pointer", marginRight: "10px" }}
                          onClick={() => onEditClick(order)}
                          size={15}
                        />
                        <FaTrash
                          style={{ cursor: "pointer" }}
                          onClick={() => handleDeleteOrder(order.id)}
                          size={15}
                        />
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination className="justify-content-center mt-3">
          <Pagination.First onClick={() => handlePageChange(1)} disabled={activePage === 1} />
          <Pagination.Prev onClick={() => handlePageChange(activePage - 1)} disabled={activePage === 1} />
          {[...Array(Math.ceil(orders.length / itemsPerPage)).keys()].map((number) => (
            <Pagination.Item
              key={number + 1}
              active={number + 1 === activePage}
              onClick={() => handlePageChange(number + 1)}
            >
              {number + 1}
            </Pagination.Item>
          ))}
          <Pagination.Next onClick={() => handlePageChange(activePage + 1)} disabled={activePage === Math.ceil(orders.length / itemsPerPage)} />
          <Pagination.Last onClick={() => handlePageChange(Math.ceil(orders.length / itemsPerPage))} disabled={activePage === Math.ceil(orders.length / itemsPerPage)} />
        </Pagination>
      </div>
    );
  };

  // --- Rendering Layout ---
  return (
    <div className="container-fluid">
      <div className="row">
        {/* File Upload (Clients) */}
        {!isAdmin && (
          <div className="col-12 mb-3">
            <Form.Group>
              <Form.Label>Upload Excel File for Orders</Form.Label>
              <Form.Control type="file" onChange={handleFileChange} />
              <Button className="mt-2" variant="primary" onClick={handleFileUpload}>
                Upload Orders
              </Button>
              {uploadStatus && <p>{uploadStatus}</p>}
            </Form.Group>
          </div>
        )}

        {isAdmin ? (
          // --- Admin View (Unchanged) ---
          <div className="col-12">
            <div className="card shadow-sm">
              <Tab.Container activeKey={activeTab} onSelect={(key) => setActiveTab(key)}>
                <div className="card-header border-0 pb-3 flex-wrap">
                  <h4 className="card-title">Trade Status</h4>
                  <Nav as="div" className="nav-pills light">
                    <Nav.Link as="button" eventKey="Order">
                      Orders
                    </Nav.Link>
                    <Nav.Link as="button" eventKey="MarketOrders">
                      Market Orders
                    </Nav.Link>
                    <Nav.Link as="button" eventKey="MatchedOrders">
                      Matched Orders
                    </Nav.Link>
                    <Nav.Link as="button" eventKey="PremiumRates">
                      Premium Rates
                    </Nav.Link>
                  </Nav>
                </div>
                <div className="card-body pt-0">
                  <Tab.Content>
                    <Tab.Pane eventKey="Order">
                      <div className="d-flex flex-wrap">
                        <div className="col-lg-8 col-md-12 col-12">
                          <OrderTable
                            orders={orders}
                            isAdmin={isAdmin}
                            onEditClick={handleEditOrderClick}
                            handleDeleteOrder={handleDeleteOrder}
                            showRateAndBank={false}
                          />
                        </div>
                        <div className="col-lg-4 col-md-12 col-12 mt-3 mt-lg-0">
                          <SubmitOrderForm
                            isEditMode={isEditMode}
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
                            tradeType={tradeType}
                            setTradeType={setTradeType}
                            onSubmit={isEditMode ? handleUpdateOrder : handleSubmitOrder}
                            onCancel={() => {
                              resetForm();
                              // In admin view, the form remains visible.
                            }}
                          />
                        </div>
                      </div>
                    </Tab.Pane>
                    <Tab.Pane eventKey="MarketOrders">
                      <OrderTable
                        orders={marketOrders}
                        isAdmin={isAdmin}
                        onEditClick={(order) => handleEditClick(order, "MarketOrders")}
                        showRateAndBank={true}
                      />
                    </Tab.Pane>
                    <Tab.Pane eventKey="MatchedOrders">
                      <OrderTable
                        orders={matchedOrders}
                        isAdmin={isAdmin}
                        onEditClick={(order) => handleEditClick(order, "MatchedOrders")}
                        showRateAndBank={true}
                        additionalAttributes={[
                          { key: "buyer", label: "Buyer" },
                          { key: "seller", label: "Seller" },
                          { key: "matched_amount", label: "Matched Amount" },
                        ]}
                      />
                    </Tab.Pane>
                    <Tab.Pane eventKey="PremiumRates">
                      <PremiumRateForm
                        premiumRates={premiumRates}
                        onCreate={(rate) => dispatch(createPremiumRateAction(rate))}
                        onUpdate={(rate) => dispatch(updatePremiumRateAction(rate))}
                        onDelete={(rateId) => dispatch(deletePremiumRateAction(rateId))}
                      />
                    </Tab.Pane>
                  </Tab.Content>
                </div>
              </Tab.Container>
            </div>
          </div>
        ) : (
          // --- Client View: Two Tabs – "My Orders" and "New Trade" ---
          <div className="col-12">
            <Tab.Container activeKey={activeTab} onSelect={(key) => setActiveTab(key)}>
              <div className="card shadow-sm mb-3">
                <div className="card-header border-0 pb-0">
                  <Nav variant="tabs" className="mb-2">
                    <Nav.Item>
                      <Nav.Link eventKey="MyOrders">My Orders</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="NewTrade">New Trade</Nav.Link>
                    </Nav.Item>
                  </Nav>
                </div>
                <div className="card-body pt-0">
                  <Tab.Content>
                    <Tab.Pane eventKey="MyOrders">
                      <OrderTable
                        orders={orders}
                        isAdmin={isAdmin}
                        onEditClick={handleEditOrderClick}
                        handleDeleteOrder={handleDeleteOrder}
                        showRateAndBank={false}
                      />
                    </Tab.Pane>
                    <Tab.Pane eventKey="NewTrade">
                      <SubmitOrderForm
                        isEditMode={isEditMode}
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
                        tradeType={tradeType}
                        setTradeType={setTradeType}
                        onSubmit={isEditMode ? handleUpdateOrder : handleSubmitOrder}
                        onCancel={() => {
                          resetForm();
                          setActiveTab("MyOrders");
                        }}
                      />
                    </Tab.Pane>
                  </Tab.Content>
                </div>
              </div>
            </Tab.Container>
          </div>
        )}

        {isAdmin && (
          <div className="col-12 mt-3">
            <Button onClick={() => dispatch(runMatchingAction())} className="btn btn-primary">
              Run Matching
            </Button>
          </div>
        )}
      </div>
      <EditOrderModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        status={status}
        setStatus={setStatus}
        executionRate={executionRate}
        setExecutionRate={setExecutionRate}
        bankName={bankName}
        setBankName={setBankName}
        historicalLoss={historicalLoss}
        setHistoricalLoss={setHistoricalLoss}
        onSaveChanges={handleSaveChanges}
        activeTab={activeTab}
      />
    </div>
  );
};

export default FutureTrading;
