import _merge from "lodash/merge";
import { ApexOptions } from "apexcharts";
import DEFAULT_OPTIONS from "../../../../charts.global.options";

export interface ChartSeries
  extends Array<{
    x: string;
    y: number;
  }> {}

const holdingsDistributionChartOptions: ApexOptions = _merge(
  {
    chart: {
      animations: {
        enabled: false,
        speed: 0,
      },
    },
    title: {
      text: "Aggregated coins by address",
    },
    plotOptions: {
      treemap: {
        borderRadius: 4,
        enableShades: false,
        distributed: true,
        colorScale: {
          ranges: [
            {
              from: 0,
              to: 1_000,
              color: "#cce6ff",
            },
            {
              from: 1_000,
              to: 100_000,
              color: "#99bfff",
            },
            {
              from: 100_000,
              to: 100_000_000,
              color: "#66a3ff",
            },
            {
              from: 100_000_000,
              to: 100_00_000_000,
              color: "#428cff",
            },
          ],
        },
      },
    },
    yaxis: {},
    xaxis: {},
  } satisfies ApexOptions,
  DEFAULT_OPTIONS,
);

export default holdingsDistributionChartOptions;
