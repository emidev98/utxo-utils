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
  utxoTimelineChartAnnotation,
  UTXOSPrices,
} from "./UTXOTimelineChart.options";
import { BTCFormatter } from "../../../../hooks/useFormatter";
import dayjs from "dayjs";

interface UTXOTimelineChartProps {
  historicalPrices: BitcoinHistoricalData[];
  utxos: VoutWithBlockTime[];
  loading: boolean;
  onClickChartAnnotation: (
    pointAnnotations: PointAnnotations,
    event: Event,
    utxos: VoutWithBlockTime[],
  ) => void;
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

    const startFocus = points.length
      ? dayjs(Number(points[0].x)).add(10, "days")
      : undefined;
    const endFocus = points.length
      ? dayjs(Number(points[points.length - 1].x)).add(10, "days")
      : undefined;

    setchartData({
      options: {
        ...utxoTimelineChartOptions,
        annotations: {
          ...utxoTimelineChartOptions.annotations,
          points,
        },
        xaxis: {
          ...utxoTimelineChartOptions.xaxis,
          min: startFocus?.toDate().getTime(),
          max: endFocus?.toDate().getTime(),
        },
      },
      series: [{ data: _seriesData, name: "Price" }],
    });
    setLoading(false);
  }, [props.historicalPrices]);

  const parseData = (): [ChartSeries, Record<number, UTXOSPrices>] => {
    const { utxos, historicalPrices } = props;

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

    for (const date in _pricesPoints) {
      const utxosPrice = _pricesPoints[date];
      const utxosValue = utxosPrice.utxos.reduce((acc, utxo) => {
        return acc + utxo.value;
      }, 0);

      points.push({
        x: date,
        y: utxosPrice.price,
        click: (point: PointAnnotations, event: Event) =>
          props.onClickChartAnnotation(point, event, utxosPrice.utxos),
        ...utxoTimelineChartAnnotation,
        label: {
          text: BTCFormatter(utxosValue),
          ...utxoTimelineChartAnnotation.label,
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
