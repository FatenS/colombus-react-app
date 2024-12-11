import React, { useState, useEffect } from "react";
import { Tab, Nav, Button, Dropdown, Form, Pagination } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { FaEdit, FaTrash, FaArrowUp, FaArrowDown } from "react-icons/fa";
import EditOrderModal from "./EditOrderModal";

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
} from "../../../store/actions/OrderActions";

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
  } = useSelector((state) => state.orderReducer || {});
  const { roles = [] } = useSelector((state) => state.auth.auth || {});
  const isAdmin = roles.includes("Admin");

  const [activeTab, setActiveTab] = useState("Order");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [status, setStatus] = useState("");
  const [executionRate, setExecutionRate] = useState("");
  const [bankName, setBankName] = useState("");
  const [historicalLoss, setHistoricalLoss] = useState("");
  const [amount, setAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [transactionType, setTransactionType] = useState("buy");
  const [valueDate, setValueDate] = useState("");
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    if (activeTab === "Order") {
      dispatch(fetchOrdersAction(isAdmin));
    } else if (activeTab === "MarketOrders") {
      dispatch(fetchMarketOrdersAction());
    } else if (activeTab === "MatchedOrders") {
      dispatch(fetchMatchedOrdersAction());
    }
  }, [dispatch, activeTab, isAdmin]);

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

  const handleUpdateOrder = () => {
    if (!editingOrder) return;

    const updatedOrderData = {
      amount: parseFloat(amount),
      bank_account: bankAccount,
      transaction_type: transactionType,
      value_date: valueDate,
      currency: currency,
    };

    dispatch(updateOrderClientAction(editingOrder.id, updatedOrderData))
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "Order Updated",
          text: "Your order has been updated successfully.",
        });
        setIsEditMode(false);
        setEditingOrder(null);
        resetForm();
        dispatch(fetchOrdersAction(isAdmin));
      })
      .catch(() => {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: "There was an issue updating your order. Please try again.",
        });
      });
  };
  const handleSaveChanges = () => {
    console.log("Active Tab:", activeTab);
    console.log("Saving changes for:", editingOrder);

    // Validate required fields
    if (!status || !executionRate || !bankName || !historicalLoss) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "All fields are required.",
      });
      return;
    }

    // Prepare data
    const updatedOrder = {
      status,
      execution_rate: parseFloat(executionRate),
      bank_name: bankName,
      historical_loss: parseFloat(historicalLoss),
    };

    console.log(
      "Dispatching updateOrderAction with:",
      editingOrder.id,
      updatedOrder
    );

    dispatch(updateOrderAction(editingOrder.id, updatedOrder))
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "Order Updated!",
          text: `The order in ${activeTab} has been updated successfully.`,
        });
        setShowEditModal(false);
        setEditingOrder(null);

        // Refetch data for the active tab
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

  const handleEditOrderClick = (order) => {
    setEditingOrder(order); // Set the order being edited
    setAmount(order.amount); // Populate the form fields
    setTransactionType(order.transaction_type);
    setValueDate(order.value_date);
    setCurrency(order.currency);
    setBankAccount(order.bank_account);
    setIsEditMode(true); // Enable edit mode
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

  const handleDeleteOrder = (orderId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteOrderAction(orderId))
          .then(() => {
            Swal.fire("Deleted!", "Your order has been deleted.", "success");
            dispatch(fetchOrdersAction(isAdmin));
          })
          .catch(() => {
            Swal.fire("Error!", "Failed to delete the order.", "error");
          });
      }
    });
  };

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
      .catch(() => {
        Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text: "There was an issue submitting your order. Please try again.",
        });
      });
  };
  const handleEditClick = (order, tab) => {
    setEditingOrder(order);
    setStatus(order.status || "");
    setExecutionRate(order.execution_rate || "");
    setBankName(order.bank_name || "");
    setHistoricalLoss(order.historical_loss || "");
    setActiveTab(tab);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setAmount("");
    setBankAccount("");
    setTransactionType("buy");
    setValueDate("");
    setCurrency("USD");
    setIsEditMode(false);
    setEditingOrder(null);
  };

  const handlePageChange = (page) => {
    setActivePage(page);
  };

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
          <h4 className="card-title mb-0">
            {isEditMode ? "Edit Order" : "Submit Future Trade"}
          </h4>
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
                {isEditMode ? "Update Order" : "Submit Order"}
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
  const OrderTable = ({
    orders,
    isAdmin,
    onEditClick,
    handleDeleteOrder, // Accept delete handler
    showRateAndBank,
    additionalAttributes = [],
    activeTab, // To differentiate between Orders, MarketOrders, and MatchedOrders
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
                {/* Dynamically add additional attributes */}
                {additionalAttributes.map((attr, i) => (
                  <th key={i}>{attr.label}</th>
                ))}
                {/* Conditionally render Execution Rate and Bank Name */}
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
                        <FaArrowDown
                          style={{ color: "green", marginRight: "5px" }}
                        />
                        Buy
                      </>
                    ) : (
                      <>
                        <FaArrowUp
                          style={{ color: "red", marginRight: "5px" }}
                        />
                        Sell
                      </>
                    )}
                  </td>
                  <td>{order.amount}</td>
                  <td>{order.currency}</td>
                  <td>{order.status}</td>
                  <td>{order.value_date}</td>
                  {/* Dynamically render values for additional attributes */}
                  {additionalAttributes.map((attr, j) => (
                    <td key={j}>{order[attr.key] || "N/A"}</td>
                  ))}
                  {/* Conditionally render Execution Rate and Bank Name */}
                  {showRateAndBank && (
                    <td>
                      {order.execution_rate ? order.execution_rate : "N/A"}
                    </td>
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
                  <td>
                    {order.status === "Pending" && (
                      <>
                        <FaEdit
                          style={{
                            cursor: "pointer",
                            marginRight: "10px",
                          }}
                          onClick={() => handleEditOrderClick(order)}
                          size={15}
                        />
                        <FaTrash
                          style={{ cursor: "pointer" }}
                          onClick={() => handleDeleteOrder(order.id)}
                          size={15}
                        />
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination className="justify-content-center mt-3">
          <Pagination.First
            onClick={() => handlePageChange(1)}
            disabled={activePage === 1}
          />
          <Pagination.Prev
            onClick={() => handlePageChange(activePage - 1)}
            disabled={activePage === 1}
          />
          {[...Array(Math.ceil(orders.length / itemsPerPage)).keys()].map(
            (number) => (
              <Pagination.Item
                key={number + 1}
                active={number + 1 === activePage}
                onClick={() => handlePageChange(number + 1)}
              >
                {number + 1}
              </Pagination.Item>
            )
          )}
          <Pagination.Next
            onClick={() => handlePageChange(activePage + 1)}
            disabled={activePage === Math.ceil(orders.length / itemsPerPage)}
          />
          <Pagination.Last
            onClick={() =>
              handlePageChange(Math.ceil(orders.length / itemsPerPage))
            }
            disabled={activePage === Math.ceil(orders.length / itemsPerPage)}
          />
        </Pagination>
      </div>
    );
  };

  return (
    <div className="container-fluid">
      <div className="row">
        {!isAdmin && (
          <div className="col-12 mb-3">
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

        <div className="col-12">
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
                        {!isEditMode && !isAdmin && (
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
                        )}
                        {isEditMode && (
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
                            onSubmit={handleUpdateOrder}
                          />
                        )}
                      </div>
                    </div>
                  </Tab.Pane>

                  <Tab.Pane eventKey="MarketOrders">
                    <OrderTable
                      orders={marketOrders}
                      isAdmin={isAdmin}
                      onEditClick={(order) =>
                        handleEditClick(order, "MarketOrders")
                      }
                      showRateAndBank={true}
                    />
                  </Tab.Pane>

                  <Tab.Pane eventKey="MatchedOrders">
                    <OrderTable
                      orders={matchedOrders}
                      isAdmin={isAdmin}
                      onEditClick={(order) =>
                        handleEditClick(order, "MatchedOrders")
                      }
                      showRateAndBank={true} // Include Execution Rate and Bank Name
                      additionalAttributes={[
                        { key: "buyer", label: "Buyer" },
                        { key: "seller", label: "Seller" },
                        { key: "matched_amount", label: "Matched Amount" },
                      ]}
                    />
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
        activeTab={activeTab} // Pass activeTab to the modal
      />
    </div>
  );
};

export default FutureTrading;
