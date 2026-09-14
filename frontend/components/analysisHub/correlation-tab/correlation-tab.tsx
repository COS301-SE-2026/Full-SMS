import React from "react";
import CorrelationTabToolbar from "./correlation-tab-toolbar";
import Plot from "react-plotly.js";
import { Card } from "@/components/ui";
import CorrelationChart from "./correlation-chart";

function CorrelationTab() {
  return (
    <div >
      <CorrelationTabToolbar />
      <CorrelationChart/>
    </div>
  );
}

export default CorrelationTab;
