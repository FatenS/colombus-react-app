import React, { Fragment, useContext, useState } from "react";
/// React router dom
import { Link } from "react-router-dom";
import { ThemeContext } from "../../../context/ThemeContext";
import { navtoggle } from "../../../store/actions/AuthActions";
import { useDispatch, useSelector } from "react-redux";
import logoFull from "../../../assets/images/logo-full.svg";

const NavHader = () => {
  const { openMenuToggle } = useContext(ThemeContext);
  const dispatch = useDispatch();
  const sideMenu = useSelector((state) => state.sideMenu);
  const handleToogle = () => {
    dispatch(navtoggle());
  };
  return (
    <div className="nav-header">
      <Link
        to="/dashboard"
        className="brand-logo"
        style={{ backgroundColor: "white" }}
      >
        <img
  src={logoFull}
  alt=""
  style={{
    width: "150px",
    height: "auto",
    objectFit: "contain",
  }}
/>

      </Link>

      <div
        className="nav-control"
        onClick={() => {
          handleToogle();
          openMenuToggle();
        }}
      >
        <div className={`hamburger ${sideMenu ? "is-active" : ""}`}>
          <span className="line"></span>
          <span className="line"></span>
          <span className="line"></span>
        </div>
      </div>
    </div>
  );
};

export default NavHader;
