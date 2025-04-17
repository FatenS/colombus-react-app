import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ThemeContext } from "../../../context/ThemeContext";
import { navtoggle } from "../../../store/actions/AuthActions";
import { useDispatch, useSelector } from "react-redux";

const NavHader = () => {
  const { openMenuToggle } = useContext(ThemeContext);
  const dispatch = useDispatch();
  const sideMenu = useSelector((state) => state.sideMenu);

  const handleToogle = () => {
    dispatch(navtoggle());
    openMenuToggle();
  };

  return (
    // 1) Add a custom “pinned-menu” class to let you pin the sidebar via CSS
    <div className="nav-header pinned-menu d-flex flex-column align-items-center p-3">
      {/* Hamburger Menu */}
      <div className="nav-control mb-2" onClick={handleToogle}>
        <div className={`hamburger ${sideMenu ? "is-active" : ""}`}>
          <span className="line" />
          <span className="line" />
          <span className="line" />
        </div>
      </div>

      {/* Logo below the menu control */}
      
    </div>
  );
};

export default NavHader;
