import React from "react";
import { SVGICON } from "../../constant/theme";
import { useLocation } from "react-router-dom";

// let path = window.location.pathname;
// path = path.split("/");
// path = path[path.length - 1];

const SidebarExtraContent = () => {
  const location = useLocation();
  const { pathname } = location;
  const compare = ["/dashboard", "/index-2"];

  return (
    <>
      <div>
        <div className="wallet-box">
          <div className="ms-3"> </div>
        </div>

        <div className="d-flex justify-content-center align-items-center">
          <div className="item-1">
            <h4 className="mb-0 text-white"></h4>
          </div>
          <div className="item-1">
            <h4 className="mb-0 text-white"></h4>
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarExtraContent;
