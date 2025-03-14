import React, { useContext, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Col, Row } from "react-bootstrap";

//Import
import { SVGICON } from "../../constant/theme";
import Market from "../../pages/dashboard/Market";
import { ThemeContext } from "../../../context/ThemeContext";

//Charts
// const SurveyChart = loadable(() =>
//  	pMinDelay(import("../../elements/dashboard/SurveyChart"), 500)
// );

export function MainComponent() {
  return (
    <Row>
      <Col xl={12}>
        <Row>
          <div className="col-xl-12">
            <Market />
          </div>
        </Row>
        <Col lg={12}></Col>
      </Col>
    </Row>
  );
}

const Home = () => {
  // const { changeBackground } = useContext(ThemeContext);
  // useEffect(() => {
  // 	changeBackground({ value: "light", label: "Light" });
  // }, []);

  const locact = useLocation();

  const {
    changeBackground,
    changeNavigationHader,
    chnageHaderColor,
    changePrimaryColor,
    changeSideBarStyle,
    changeSideBarLayout,
    chnageSidebarColor,
  } = useContext(ThemeContext);
  useEffect(() => {
    switch (locact.search) {
      case "?theme=1":
        changeBackground({ value: "light", label: "Light" });
        changeNavigationHader("color_3");
        chnageHaderColor("color_3");
        changePrimaryColor("color_1");
        break;
      case "?theme=2":
        changeBackground({ value: "light", label: "Light" });
        changeSideBarStyle({ value: "mini", label: "Mini" });
        changeNavigationHader("color_13");
        chnageHaderColor("color_13");
        changePrimaryColor("color_13");
        break;
      case "?theme=4":
        changeBackground({ value: "light", label: "Light" });
        changeSideBarLayout({ value: "horizontal", label: "Horizontal" });
        changeSideBarStyle({ value: "full", label: "Full" });
        changeNavigationHader("color_1");
        chnageHaderColor("color_1");
        chnageSidebarColor("color_7");
        changePrimaryColor("color_7");
        break;

      case "?theme=5":
        changeBackground({ value: "light", label: "Light" });
        changeSideBarLayout({ value: "horizontal", label: "Horizontal" });
        changeSideBarStyle({ value: "full", label: "Full" });
        changeNavigationHader("color_3");
        chnageHaderColor("color_3");
        chnageSidebarColor("color_1");
        changePrimaryColor("color_1");
        break;
      case "?theme=6":
        changeBackground({ value: "light", label: "Light" });
        changeNavigationHader("color_10");
        chnageHaderColor("color_13");
        chnageSidebarColor("color_10");
        changePrimaryColor("color_13");
        break;
      default:
        changeBackground({ value: "light", label: "Light" });
        changeNavigationHader("color_3");
        chnageHaderColor("color_3");
        changePrimaryColor("color_1");
        break;
    }
  }, [locact.pathname]);
  return (
    <>
      <MainComponent />
    </>
  );
};

export default Home;
