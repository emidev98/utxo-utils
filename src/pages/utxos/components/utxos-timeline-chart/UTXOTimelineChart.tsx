import { useEffect, useState } from "react";
import "./UTXOTimelineChart.scss";
import { AddressStateObject } from "../../../../hooks/useAddresses";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import _ from "lodash";
import useFormatter from "../../../../hooks/useFormatter";
import { IonCard, IonCardContent, IonSkeletonText } from "@ionic/react";
import { BitcoinHistoricalData } from "../../../../models/BitcoinHistoricalData";
import { VoutWithBlockTime } from "../../../../models/MempoolAddressTxs";
import baseChartOptions from "./UTXOTimelineChart.options";

interface UTXOTimelineChartProps {
  historicalPrices: BitcoinHistoricalData[];
  utxos: VoutWithBlockTime[];
  loading?: boolean;
}

interface ChartSeries
  extends Array<{
    x: any;
    y: any;
  }> {}

const UTXOTimelineChart = ({
  historicalPrices,
  utxos,
  loading,
}: UTXOTimelineChartProps) => {
  const { addressFormatter, BTCFormatter } = useFormatter();
  const [options, setOptions] = useState<ApexOptions | undefined>({});
  const [series, setSeries] = useState<ApexOptions["series"]>([]);

  useEffect(() => {
    console.log(utxos);
    baseChartOptions.annotations!.points = generatePointsInChart();
    setSeries([{ data: getChartSeriesData() }]);
    setOptions(baseChartOptions);
  }, [historicalPrices, utxos]);

  const generatePointsInChart = (): PointAnnotations[] => {
    const points: PointAnnotations[] = [];

    for (const utxo of utxos) {
      points.push({
        x: utxo.block_time.format("YYYY-MM-DD"),
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

  const getChartSeriesData = (): ChartSeries => {
    const seriesData: ChartSeries = [];
    const firstUtxo = utxos[0];
    const lastUtxo = utxos[utxos.length - 1];

    const firstDateToConsiderInChart = firstUtxo
      ? firstUtxo.block_time.add(-7, "day")
      : null;
    const lastDateToConsiderInChart = lastUtxo
      ? lastUtxo.block_time.add(7, "day")
      : null;

    for (const { date, price } of historicalPrices) {
      if (
        firstDateToConsiderInChart === null &&
        lastDateToConsiderInChart === null
      ) {
        seriesData.push({
          x: date.format("YYYY-MM-DD"),
          y: price,
        });
      }

      if (
        date.isAfter(firstDateToConsiderInChart) &&
        date.isBefore(lastDateToConsiderInChart)
      ) {
        seriesData.push({
          x: date.format("YYYY-MM-DD"),
          y: price,
        });
      }

      if (date.isAfter(lastDateToConsiderInChart)) {
        break;
      }
    }

    return seriesData;
  };

  return (
    <IonCard className="UTXOTimelineChart">
      <IonCardContent>
        {loading ? (
          <>
            <IonSkeletonText animated={true} className="ChartSkeletonHeader" />
            <IonSkeletonText animated={true} className="ChartSkeletonBody" />
          </>
        ) : (
          <ReactApexChart
            options={options}
            series={series}
            height={500}
            type="line"
          />
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default UTXOTimelineChart;
