import React, { useContext, useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { Link } from "react-router-dom";

// Images
import profile from "../../../assets/images/user.jpg";

import { ThemeContext } from "../../../context/ThemeContext";
import Logout from "../nav/Logout"; // Keep the logout functionality
import { SVGICON } from "../../constant/theme";

const Header = () => {
  const [headerFix, setheaderFix] = useState(false);

  function CommanScroll() {
    setheaderFix(window.scrollY > 50);
  }

  useEffect(() => {
    window.addEventListener("scroll", CommanScroll);
    return () => {
      window.removeEventListener("scroll", CommanScroll);
    };
  }, []);

  const { background, changeBackground } = useContext(ThemeContext);
  const handleThemeMode = () => {
    if (background.value === "dark") {
      changeBackground({ value: "light", label: "Light" });
    } else {
      changeBackground({ value: "dark", label: "Dark" });
    }
  };

  let path = window.location.pathname;
  path = path.split("/");
  path = path[path.length - 1];

  const pathtitle = window.location.pathname.split("/");
  const name = pathtitle[pathtitle.length - 1].split("-");
  const filterName = name.length >= 3 ? name.filter((n, i) => i > 0) : name;
  const finalName = filterName.includes("app")
    ? filterName.filter((f) => f !== "app")
    : filterName.includes("ui")
    ? filterName.filter((f) => f !== "ui")
    : filterName.includes("uc")
    ? filterName.filter((f) => f !== "uc")
    : filterName.includes("basic")
    ? filterName.filter((f) => f !== "basic")
    : filterName.includes("jquery")
    ? filterName.filter((f) => f !== "jquery")
    : filterName.includes("table")
    ? filterName.filter((f) => f !== "table")
    : filterName.includes("page")
    ? filterName.filter((f) => f !== "page")
    : filterName.includes("email")
    ? filterName.filter((f) => f !== "email")
    : filterName.includes("ecom")
    ? filterName.filter((f) => f !== "ecom")
    : filterName.includes("chart")
    ? filterName.filter((f) => f !== "chart")
    : filterName.includes("editor")
    ? filterName.filter((f) => f !== "editor")
    : filterName;

  return (
    <>
      <div
        className={`header ${
          path === "dashboard" || path === "index-2" ? "home" : ""
        } ${headerFix ? "is-fixed" : ""}`}
      >
        <div className="header-content">
          <nav className="navbar navbar-expand">
            <div className="collapse navbar-collapse justify-content-between">
              <div className="header-left">
                {/* Intentionally left blank, previously search area was here */}
              </div>
              <ul className="navbar-nav header-right">
                {/* Dark/Light mode toggle */}
                <li className="nav-item dropdown notification_dropdown">
                  <Link
                    to={"#"}
                    className={`nav-link bell dz-theme-mode ${
                      background.value === "dark" ? "active" : ""
                    }`}
                    onClick={handleThemeMode}
                  >
                    {SVGICON.LightSvgIcon}
                    {SVGICON.DarkSvgIcon}
                  </Link>
                </li>

                {/* Profile dropdown with Logout */}
                <Dropdown as="li" className="nav-item header-profile2">
                  <Dropdown.Toggle
                    to={"#"}
                    className="nav-link i-false"
                    as="div"
                  >
                    <div className="header-info2 d-flex align-items-center">
                      <img src={profile} alt="profile" />
                    </div>
                  </Dropdown.Toggle>
                  <Dropdown.Menu
                    align="end"
                    className="mt-3 dropdown-menu dropdown-menu-right"
                  >
                    <Link to={"/app-profile"} className="dropdown-item ai-icon">
                      <span className="ms-2">Profile</span>
                    </Link>
                    <Logout />
                  </Dropdown.Menu>
                </Dropdown>
              </ul>
            </div>
          </nav>
        </div>

        {/* Page titles section restored for consistent styling. 
           If you'd like to show page titles, you can uncomment or customize. */}
        {path === "dashboard" || path === "index-2" ? (
          <div className="page-titles">
            <div className="sub-dz-head">
              <div className="d-flex align-items-center dz-head-title">
                <h2 className="text-white m-0">Dashboard</h2>
              </div>
            </div>
          </div>
        ) : (
          <div className="page-titles">
            <ol className="breadcrumb">
              <li className="breadcrumb-item active ms-auto">
                <Link to={"/"} className="d-flex align-self-center">
                  Home
                </Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={"#"} style={{ textTransform: "capitalize" }}>
                  {finalName.join(" ")}
                </Link>
              </li>
            </ol>
          </div>
        )}
      </div>
    </>
  );
};

export default Header;
