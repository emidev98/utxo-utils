import * as _ from "lodash";
import { ApexOptions } from "apexcharts";
import DEFAULT_OPTIONS from "../../../../charts.global.options";
import { VoutWithBlockTime } from "../../../../models/MempoolAddressTxs";
import { USDFormatter } from "../../../../hooks/useFormatter";
import dayjs from "dayjs";

export interface UTXOSPrices {
  price: number;
  utxos: VoutWithBlockTime[];
}

export interface ChartSeries extends Array<[number, number]> {}

const utxoTimelineChartOptions: ApexOptions = _.merge(
  {
    stroke: {
      curve: "smooth",
      lineCap: "square",
      width: 3,
      colors: ["#428cff"],
    },
    title: {
      text: "UTXO Timeline",
      align: "center",
    },
    xaxis: {
      type: "datetime",
      tooltip: {
        enabled: false,
      },
      labels: {
        formatter: (value: string) => {
          return dayjs(value).format("DD MMM, YYYY");
        },
        hideOverlappingLabels: true,
        showDuplicates: false,
        trim: true,
      },
    },
    yaxis: {
      labels: {
        formatter: USDFormatter,
      },
    },
    annotations: {
      xaxis: [
        {
          x: dayjs().subtract(1, "year").toDate().getTime(),
          label: {
            text: "1 year old",
            position: "bottom",
            orientation: "horizontal",
            borderRadius: 2,
            style: {
              color: "#fff",
              background: "#428cff",
            },
          },
        },
      ],
    },
  } satisfies ApexOptions,
  DEFAULT_OPTIONS,
);

export const utxoTimelineChartAnnotation: PointAnnotations = {
  marker: {
    size: 8,
    fillColor: "#fff",
  },
  label: {
    borderColor: "#fff",
    borderRadius: 1,
    offsetY: -14,
    style: {
      padding: {
        left: 4,
        right: 4,
        top: 4,
        bottom: 4,
      },
      color: "#fff",
      background: "##1e1e1e",
    },
  },
};

export default utxoTimelineChartOptions;
