//FutureOrderTable.jsx

import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const FutureOrderTable = () => {
  const [orders, setOrders] = useState([]);
  const sort = 7;
  const [data, setData] = useState(
    document.querySelectorAll("#order_table tbody tr")
  );
  const activePag = useRef(0);
  const [test, settest] = useState(0);

  // Fetch orders from the backend
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get("http://localhost:5001/orders", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Assuming you're using localStorage for JWT token storage
          },
        });
        setOrders(response.data);
      } catch (error) {
        console.error("Error fetching orders", error);
      }
    };
    fetchOrders();
  }, []);

  const chageData = (frist, sec) => {
    for (let i = 0; i < data.length; ++i) {
      if (i >= frist && i < sec) {
        data[i].classList.remove("d-none");
      } else {
        data[i].classList.add("d-none");
      }
    }
  };

  useEffect(() => {
    setData(document.querySelectorAll("#order_table tbody tr"));
  }, [test]);

  activePag.current === 0 && chageData(0, sort);

  let paggination = Array(Math.ceil(data.length / sort))
    .fill()
    .map((_, i) => i + 1);

  const onClick = (i) => {
    activePag.current = i;
    chageData(activePag.current * sort, (activePag.current + 1) * sort);
    settest(i);
  };

  return (
    <>
      <div className="table-responsive dataTabletrade">
        <div id="order_table" className="dataTables_wrapper no-footer">
          <table
            className="table display orderbookTable"
            style={{ minWidth: "845px" }}
          >
            <thead>
              <tr>
                <th>Order ID</th>
                <th>User</th>
                <th>Transaction Type</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Value Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr key={i}>
                  <td>{order.id}</td>
                  <td>{order.user}</td>
                  <td>{order.transaction_type}</td>
                  <td>{order.amount}</td>
                  <td>{order.currency}</td>
                  <td>{order.value_date}</td>
                  <td>{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="d-flex justify-content-end align-items-center">
            <div
              className="dataTables_paginate paging_simple_numbers"
              id="example-history_paginate"
            >
              <Link
                className="paginate_button text-center previous disabled"
                to="#"
                onClick={() =>
                  activePag.current > 0 && onClick(activePag.current - 1)
                }
              >
                <i className="fa fa-angle-double-left" />
              </Link>
              <span>
                {paggination.map((number, i) => (
                  <Link
                    key={i}
                    to="#"
                    className={`paginate_button  ${
                      activePag.current === i ? "current" : ""
                    }`}
                    onClick={() => onClick(i)}
                  >
                    {number}
                  </Link>
                ))}
              </span>
              <Link
                className="paginate_button next text-center"
                to="#"
                onClick={() =>
                  activePag.current + 1 < paggination.length &&
                  onClick(activePag.current + 1)
                }
              >
                <i className="fa fa-angle-double-right" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FutureOrderTable;
