import { ApexOptions } from "apexcharts";

const DEFAULT_OPTIONS: ApexOptions = {
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
