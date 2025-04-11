import { ApexOptions } from "apexcharts";
import { DEFAULT_CHART_TITLE } from "../../../../charts.global.options";

const options: ApexOptions = {
  stroke: {
    curve: "smooth",
    colors: ["#428cff"],
  },
  title: {
    ...DEFAULT_CHART_TITLE,
    text: "UTXO Timeline",
  },
  xaxis: {
    title: {
      text: "Date",
    },
    tooltip: {
      enabled: false,
    },
    type: "datetime",
  },
  yaxis: {
    title: {
      text: "Price",
    },
  },
  annotations: {
    points: [],
  },
};

export default options;
