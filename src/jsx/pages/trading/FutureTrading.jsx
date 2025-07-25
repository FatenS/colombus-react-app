import React, { useEffect, useState, useCallback, useMemo,          //  ← NEW
 } from "react";
import {
  selectOrders,
  selectMarketOrders,
  selectMatchedOrders,
} from '../../../store/selectors/OrderSelectors';
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
  InputGroup,
  FormControl,
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { FaEdit, FaTrash, FaArrowUp, FaArrowDown, FaEye } from "react-icons/fa";
import EditOrderModal from "./EditOrderModal";
import BulkOrdersUpload from "./BulkOrdersUpload";
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
import axiosInstance from "../../../services/AxiosInstance";

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
    optionType,
    setOptionType,
    strike,
    setStrike,
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

            {/* Transaction Type (Buy/Sell) */}
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

            {/* Option-specific Fields */}
            {tradeType === "option" && (
              <>
                <div className="input-group mb-3">
                  <span className="input-group-text">Option Type</span>
                  <select
                    className="form-control"
                    value={optionType}
                    onChange={(e) => setOptionType(e.target.value)}
                  >
                    <option value="CALL">CALL</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>
                <div className="input-group mb-3">
                  <span className="input-group-text">Strike (optional)</span>
                  <input
                    type="number"
                    className="form-control"
                    value={strike}
                    onChange={(e) => setStrike(e.target.value)}
                    placeholder="Leave empty for ATM"
                  />
                </div>
              </>
            )}

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

const FutureTrading = () => {
  const dispatch = useDispatch();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 10;
  // FutureTrading.jsx
const orders         = useSelector(selectOrders);
const marketOrders   = useSelector(selectMarketOrders);
const matchedOrders  = useSelector(selectMatchedOrders);
console.log("useSelector values:", { orders, marketOrders, matchedOrders });

const {premiumRates = [],
} = useSelector((state) => state.orderReducer || {});

  const safeOrders = Array.isArray(orders) ? orders : [];

  const { roles = [] } = useSelector((state) => state.auth.auth || {});
  const isAdmin = roles.includes("Admin");

  // For admin view, use original tab names; for client view, use two tabs: "My Orders" and "New Trade"
  const initialClientTab = isAdmin ? "Order" : "MyOrders";
  const [activeTab, setActiveTab] = useState(() => (
     roles.includes("Admin") ? "Order" : "MyOrders"
    ));
  // New filter states:
  const [adminClientSearch, setAdminClientSearch] = useState("");
  const [clientCategoryFilter, setClientCategoryFilter] = useState("All");

  // Admin edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Admin fields for Market/Matched orders
  const [status, setStatus] = useState("");
  const [executionRate, setExecutionRate] = useState("");
  const [bankName, setBankName] = useState("");
  const [historicalLoss, setHistoricalLoss] = useState("");

  // Shared client form fields
  const [amount, setAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [transactionType, setTransactionType] = useState("buy");
  const [valueDate, setValueDate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [tradeType, setTradeType] = useState("spot");

  // NEW state variables for Option orders
  const [optionType, setOptionType] = useState("CALL");
  const [strike, setStrike] = useState("");
  useEffect(() => {
     console.log("orders in Redux:", orders);   // 👈 should print an array of objects
    }, [orders]);
  
    useEffect(() => {
    if (roles.includes("Admin") && activeTab === "MyOrders") {
      setActiveTab("Order");          // jump to the correct admin tab
    }
  }, [roles, activeTab]);
  // FutureTrading.jsx – just after the other effects
useEffect(() => {
  if (isAdmin && activeTab === "Order") {
    setAdminClientSearch("");         
  }
}, [isAdmin, activeTab]);

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

  // --- Generate Data Button ---
  const handleGenerateData = async () => {
    // choose the correct path; axiosInstance already adds the baseURL
    const endpoint = isAdmin
      ? "/admin/generate-excel-data"
      : "/admin/generate-my-excel";
  
    try {
      // axiosInstance automatically sends cookies + CSRF header
      const response = await axiosInstance.get(endpoint, {
        responseType: "blob",          // we want a file stream
      });
  
      // create a temporary link to download the generated Excel file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "OrdersReport.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error generating Excel file", error);
      Swal.fire({
        icon: "error",
        title: "Download Failed",
        text: "Unable to generate Excel data. Please try again.",
      });
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
      trade_type: tradeType, // includes "spot", "forward", or "option"
    };
    if (isOption) {
      orderData.option_type = optionType;
      if (strike) {
        orderData.strike = parseFloat(strike);
      }
    }
    dispatch(submitOrderAction(orderData))
      .then(() => {
        Swal.fire({
          icon: "success",
          title: isOption ? "Option Submitted" : "Order Submitted",
        });
        resetForm();
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
  }, [amount, transactionType, bankAccount, valueDate, currency, tradeType, optionType, strike, dispatch, isAdmin]);

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
      trade_type: tradeType,
    };
    if (isOption) {
      updatedOrderData.option_type = optionType;
      if (strike) {
        updatedOrderData.strike = parseFloat(strike);
      }
    }
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
  }, [editingOrder, amount, bankAccount, transactionType, valueDate, currency, tradeType, optionType, strike, dispatch, isAdmin]);

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

  const handleEditOrderClick = (order) => {
    setEditingOrder(order);
    setAmount(order.amount);
    setTransactionType(order.transaction_type);
    setValueDate(order.value_date);
    setCurrency(order.currency);
    setBankAccount(order.bank_account);
    setIsEditMode(true);
    setTradeType(order.trade_type || (order.is_option ? "option" : "spot"));
    if (order.is_option) {
      setOptionType(order.option_type || "CALL");
      setStrike(order.strike ? order.strike.toString() : "");
    }
    if (!isAdmin) setActiveTab("NewTrade");
  };

  const resetForm = () => {
    setAmount("");
    setBankAccount("");
    setTransactionType("buy");
    setValueDate("");
    setCurrency("USD");
    setTradeType("spot");
    setOptionType("CALL");
    setStrike("");
    setIsEditMode(false);
    setEditingOrder(null);
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

  const handlePageChange = (page) => {
    setActivePage(page);
  };

  // OrderTable Component
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
    
console.log('rows handed to <OrderTable>: ', orders.length);        // should be 9
console.log('rows rendered *this page* : ', currentOrders.length);  // 1-10

    return (
      <div>
        
        <div className="table-responsive">
          <table className="table orderbookTable">
            <thead>
              <tr>
                <th>ID</th>
                <th>Transaction Type</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Trade Type</th>
                <th>Status</th>
                <th>Value Date</th>
                {additionalAttributes.map((attr, i) => (
                  <th key={i}>{attr.label}</th>
                ))}
                <th>Moneyness</th>
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
                  <td>
                    {order.trade_type
                      ? order.trade_type.toUpperCase()
                      : "N/A"}
                  </td>
                  <td>{order.status}</td>
                  <td>{order.value_date}</td>
                  {additionalAttributes.map((attr, j) => (
                    <td key={j}>{order[attr.key] || "N/A"}</td>
                  ))}
                  <td>{order.is_option ? order.moneyness || "N/A" : "—"}</td>
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
          <Pagination.Next
            onClick={() => handlePageChange(activePage + 1)}
            disabled={activePage === Math.ceil(orders.length / itemsPerPage)}
          />
          <Pagination.Last
            onClick={() => handlePageChange(Math.ceil(orders.length / itemsPerPage))}
            disabled={activePage === Math.ceil(orders.length / itemsPerPage)}
          />
        </Pagination>
      </div>
    );
  };

  const isSearchActive = adminClientSearch.replace(/\s/g, "") !== ""; // removes ALL whitespace

  const filteredAdminOrders = isSearchActive
    ? safeOrders.filter(o =>
        (o.client_name || "")
          .toLowerCase()
          .includes(adminClientSearch.toLowerCase().trim())
      )
    : safeOrders;
  

  const filteredClientOrders = !isAdmin && activeTab === "MyOrders"
  ? safeOrders.filter(o =>
       clientCategoryFilter === "All"
         ? true
         : o.trade_type?.toLowerCase() === clientCategoryFilter.toLowerCase()
     )
   : safeOrders;


/* ⭐️  PASTE visibleRows right here  ⭐️ */
const visibleRows = useMemo(() => {
  if (isAdmin) {
    switch (activeTab) {
      case "Order":
        return filteredAdminOrders.length;
      case "MarketOrders":
        return marketOrders.length;
      case "MatchedOrders":
        return matchedOrders.length;
      default:
        return 0;
    }
  }
  // client view
  return filteredClientOrders.length;
}, [
  isAdmin,
  activeTab,
  filteredAdminOrders.length,
  marketOrders.length,
  matchedOrders.length,
  filteredClientOrders.length,
]);

// page-bounding effect can stay just below
useEffect(() => {
  const pages = Math.max(1, Math.ceil(visibleRows / itemsPerPage));
  if (activePage > pages) setActivePage(1);
}, [visibleRows, activePage, itemsPerPage]);
   /* -----------------  GLOBAL PIPELINE DEBUG  ------------------- */
console.log(
  "ACTIVE-TAB:",           activeTab,
  "| search:",             JSON.stringify(adminClientSearch),
  "| isSearchActive:",     isSearchActive,
  "\n  safeOrders:",       safeOrders.length,
  "filteredAdminOrders:",  filteredAdminOrders.length
);
/* ------------------------------------------------------------- */




  return (
    <div className="container-fluid">
      <div className="row mb-3">
        {/* Generate Data Button */}
        <div className="col-12 d-flex justify-content-end">
          <Button className="mt-2" variant="primary" onClick={handleGenerateData}>
            Generate excel data
          </Button>
        </div>
      </div>

      <div className="row">
        {/* File Upload (Clients) */}
        {!isAdmin && (
          <div className="col-12 mb-3">
          <BulkOrdersUpload
              isAdmin={false}
              onSuccess={() => dispatch(fetchOrdersAction(false))}
            />
          </div>
        )}

        {isAdmin ? (
          // Admin View
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
                {isAdmin && (
                      <Row className="mb-3">
                        <Col md={6}>
                          <BulkOrdersUpload
                          isAdmin={true}
                          onSuccess={() => dispatch(fetchOrdersAction(true))}
                        />
                        </Col>                        
                        <Col md={6} className="d-flex justify-content-end">
                            </Col>
                      </Row>
                    )}
                  {activeTab === "Order" && (
                    <Row className="mb-3">
                      <Col md={4}>
                        <InputGroup>
                          <FormControl
                            placeholder="Search client by name"
                            value={adminClientSearch}
                            onChange={(e) => setAdminClientSearch(e.target.value)}
                          />
                        </InputGroup>
                      </Col>
                    </Row>
                  )}
                  <Tab.Content>
                    <Tab.Pane eventKey="Order">
                    {console.log("➡ Orders → handed to table:", filteredAdminOrders.length)}

                      <div className="d-flex flex-wrap">
                        <div className="col-lg-8 col-md-12 col-12">
                          <OrderTable
                            orders={filteredAdminOrders}
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
                            optionType={optionType}
                            setOptionType={setOptionType}
                            strike={strike}
                            setStrike={setStrike}
                            onSubmit={isEditMode ? handleUpdateOrder : handleSubmitOrder}
                            onCancel={() => {
                              resetForm();
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
          // Client View
          <div className="col-12">
            <Tab.Container activeKey={activeTab} onSelect={(key) => setActiveTab(key)}>
              <div className="card shadow-sm mb-3">
                <div className="card-header border-0 pb-0">
                  <Nav variant="tabs" className="mb-2">
                    <Nav.Item>
                      <Nav.Link eventKey="MyOrders">My Orders</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="NewTrade">Submit your Order</Nav.Link>
                    </Nav.Item>
                  </Nav>
                </div>
                <div className="card-body pt-0">
                  {activeTab === "MyOrders" && (
                    <Row className="mb-3">
                      <Col md={4}>
                        <Form.Select
                          value={clientCategoryFilter}
                          onChange={(e) => setClientCategoryFilter(e.target.value)}
                        >
                          <option value="All">All Categories</option>
                          <option value="spot">Spot</option>
                          <option value="forward">Forward</option>
                          <option value="option">Option</option>
                        </Form.Select>
                      </Col>
                    </Row>
                  )}
                  <Tab.Content>
                    <Tab.Pane eventKey="MyOrders">
                      <OrderTable
                        orders={filteredClientOrders}
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
                        optionType={optionType}
                        setOptionType={setOptionType}
                        strike={strike}
                        setStrike={setStrike}
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
