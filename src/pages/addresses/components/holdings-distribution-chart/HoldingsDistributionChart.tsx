import { useEffect, useState } from "react";
import "./HoldingsDistributionChart.scss";
import { AddressStateObject } from "../../../../hooks/useAddresses";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import _forEach from "lodash/forEach";
import { IonCard, IonCardContent, IonSkeletonText } from "@ionic/react";
import { ChartSeries } from "./HoldingsDistributionChart.options";
import holdingsDistributionChartOptions from "./HoldingsDistributionChart.options";
import { addressFormatter, BTCFormatter } from "../../../../hooks/useFormatter";

interface HoldingsDistributionChartProps {
  addrStore?: AddressStateObject;
  loading?: boolean;
}

const HoldingsDistributionChart = ({
  addrStore,
  loading,
}: HoldingsDistributionChartProps) => {
  const [totalSpendableBalance, setTotalSpendableBalance] = useState<number>(0);
  const [options, setOptions] = useState<ApexOptions | undefined>({});
  const [series, setSeries] = useState<ApexOptions["series"]>([]);

  useEffect(() => {
    if (!addrStore) {
      return;
    }
    const [_totalSpendableBalance, _seriesData] = parseData();

    holdingsDistributionChartOptions!.yaxis = {
      labels: {
        formatter: (val) => {
          const avg = ((val / _totalSpendableBalance) * 100).toFixed(2);
          return BTCFormatter(val) + ` (${avg}%)`;
        },
      },
    } satisfies ApexYAxis;

    holdingsDistributionChartOptions!.xaxis = {
      labels: {
        formatter: (val) => {
          return addressFormatter(val);
        },
      },
    } satisfies ApexXAxis;

    setOptions(holdingsDistributionChartOptions);
    setTotalSpendableBalance(_totalSpendableBalance);
    setSeries([{ data: _seriesData }]);
  }, [addrStore]);

  useEffect(() => {
    setTotalSpendableBalance(totalSpendableBalance);
  }, [totalSpendableBalance]);

  const parseData = (): [number, ChartSeries] => {
    const seriesData: ChartSeries = [];
    let _totalSpendableBalance = 0;

    _forEach(addrStore, (addr) => {
      const spendableBalance =
        addr.chain_stats.funded_txo_sum - addr.chain_stats.spent_txo_sum;
      _totalSpendableBalance += spendableBalance;
      if (spendableBalance !== 0) {
        seriesData.push({
          x: addr.label,
          y: spendableBalance,
        });
      }
    });

    return [_totalSpendableBalance, seriesData.sort((a, b) => b.y - a.y)];
  };

  return (
    <IonCard className="HoldingsDistributionChart">
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
            height={180}
            type="treemap"
          />
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default HoldingsDistributionChart;
