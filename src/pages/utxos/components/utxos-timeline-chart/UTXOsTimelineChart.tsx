import { IonCard, IonCardContent, IonSkeletonText } from "@ionic/react";
import { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { BTCFormatter } from "../../../../hooks/useFormatter";
import { BitcoinHistoricalData } from "../../../../models/BitcoinHistoricalData";
import { UTXO } from "../../../../models/MempoolAddressTxs";
import utxoTimelineChartOptions, {
  ChartSeries,
  UTXOSPrices,
  utxoTimelineChartAnnotation,
} from "./UTXOsTimelineChart.options";
import "./UTXOsTimelineChart.scss";

interface UTXOTimelineChartProps {
  historicalPrices: BitcoinHistoricalData[];
  utxos: UTXO[];
  firstUtxo?: UTXO;
  lastUtxo?: UTXO;
  loading: boolean;

  onClickChartAnnotation: (
    pointAnnotations: PointAnnotations,
    event: Event,
    utxos: UTXO[],
  ) => void;
}

const UTXOsTimelineChart = (props: UTXOTimelineChartProps) => {
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

    const startFocus = props.firstUtxo?.block_time.add(-10, "days");
    const endFocus = props.lastUtxo?.block_time.add(10, "days");

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

    const allUtoxs = utxos.reduce(
      (acc, utxo) => {
        const date = utxo.block_time
          .set("hour", 0)
          .set("minute", 0)
          .set("second", 0)
          .set("millisecond", 0)
          .toDate()
          .getTime();
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(utxo);
        return acc;
      },
      {} as Record<number, UTXO[]>,
    );

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
    <IonCard className="UTXOsTimelineChart">
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

export default UTXOsTimelineChart;
