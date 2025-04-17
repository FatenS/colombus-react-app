import React from "react";
import { PopupWidget } from "react-calendly";

const CalendlyPopup = () => {
  return (
    <div>
      <PopupWidget
        url="https://calendly.com/sidhom-faaten/30min"
        rootElement={document.getElementById("root")}
        text="Schedule a Meeting"
        textColor="#ffffff"
        color="    #002155"
      />
    </div>
  );
};

export default CalendlyPopup;
