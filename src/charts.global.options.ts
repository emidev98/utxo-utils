import { ApexOptions } from "apexcharts";

const DEFAULT_OPTIONS: ApexOptions = {
  grid: {
    borderColor: "#2a2a2a",
  },
  title: {
    align: "center",
    style: {
      fontSize: "20px",
      fontWeight: 500,
      fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
      color: "#dbdbdb",
    },
  },
  xaxis: {
    title: {
      style: {
        fontSize: "14px",
        fontWeight: 500,
        fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
        color: "#dbdbdb",
      },
    },
    labels: {
      style: {
        colors: "#dbdbdb",
        fontWeight: 500,
        fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
      },
    },
    axisBorder: {
      color: "2a2a2a",
    },
  },
  yaxis: {
    title: {
      style: {
        fontSize: "14px",
        fontWeight: 500,
        fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
        color: "#dbdbdb",
      },
    },
    labels: {
      style: {
        colors: "#dbdbdb",
        fontWeight: 500,
        fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
      },
    },
  },
};
export default DEFAULT_OPTIONS;
