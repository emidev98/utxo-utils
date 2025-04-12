import { useEffect, useState } from "react";
import "./UTXOTimelineChart.scss";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import _ from "lodash";
import { IonCard, IonCardContent, IonSkeletonText } from "@ionic/react";
import { BitcoinHistoricalData } from "../../../../models/BitcoinHistoricalData";
import { VoutWithBlockTime } from "../../../../models/MempoolAddressTxs";
import utxoTimelineChartOptions, {
  ChartSeries,
  UTXOSPrices,
} from "./UTXOTimelineChart.options";

interface UTXOTimelineChartProps {
  data: {
    historicalPrices: BitcoinHistoricalData[];
    utxos: VoutWithBlockTime[];
  };
  loading: boolean;
}

const UTXOTimelineChart = (props: UTXOTimelineChartProps) => {
  const [isLoading, setLoading] = useState(props.loading ? true : false);
  const [chartData, setchartData] = useState<{
    options: ApexOptions;
    series: ApexOptions["series"];
  }>({
    options: utxoTimelineChartOptions,
    series: [],
  });

  useEffect(() => {
    setLoading(true);
    const [_seriesData, _pricesPoints] = parseData();
    const points = getPointsAnnotations(_pricesPoints);
    setchartData({
      options: {
        ...utxoTimelineChartOptions,
        annotations: {
          ...utxoTimelineChartOptions.annotations,
          points,
        },
      },
      series: [{ data: _seriesData, name: "Price" }],
    });
    setLoading(false);
  }, [props.data.historicalPrices]);

  const parseData = (): [ChartSeries, Record<number, UTXOSPrices>] => {
    const {
      data: { utxos, historicalPrices },
    } = props;

    const _series: ChartSeries = [];
    const _pricesPoints: Record<number, UTXOSPrices> = {};

    const allUtoxs = _.groupBy(utxos, (value) => {
      return value.block_time
        .set("hour", 0)
        .set("minute", 0)
        .set("second", 0)
        .set("millisecond", 0)
        .toDate()
        .getTime();
    });
    for (const { date, price } of historicalPrices) {
      _series.push([date.toDate().getTime(), price]);

      const formattedDate = date.toDate().getTime();
      const utxos = allUtoxs[formattedDate];
      if (utxos !== undefined) {
        _pricesPoints[formattedDate] = {
          price,
          utxos,
        };
      }
    }

    return [_series, _pricesPoints];
  };

  const getPointsAnnotations = (
    _pricesPoints: Record<number, UTXOSPrices>,
  ): PointAnnotations[] => {
    const points: PointAnnotations[] = [];
    console.log(_pricesPoints);
    for (const date in _pricesPoints) {
      const utxosPrice = _pricesPoints[date];

      points.push({
        x: date,
        y: utxosPrice.price,
        marker: {
          size: 8,
          fillColor: "#fff",
          strokeColor: "red",
          cssClass: "apexcharts-custom-class",
        },
        label: {
          borderColor: "#FF4560",
          offsetY: 0,
          style: {
            color: "#fff",
            background: "#FF4560",
          },
          text: "Point Annotation",
        },
      });
    }

    return points;
  };

  return (
    <IonCard className="UTXOTimelineChart">
      <IonCardContent>
        {isLoading ? (
          <>
            <IonSkeletonText animated={true} className="ChartSkeletonHeader" />
            <IonSkeletonText animated={true} className="ChartSkeletonBody" />
          </>
        ) : (
          <ReactApexChart
            type="line"
            height={336}
            options={chartData.options}
            series={chartData.series}
          />
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default UTXOTimelineChart;
