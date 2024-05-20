import { useEffect, useState } from 'react';
import './HoldingsDistributionChart.scss';
import { AddressStateObject } from '../../../../hooks/useAddresses';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import _ from 'lodash';
import useFormatter from '../../../../hooks/useFormatter';
import { IonCard, IonCardContent, IonSkeletonText } from '@ionic/react';

interface HoldingsDistributionChartProps {
  addrStore?: AddressStateObject,
  loading?: boolean,
}

interface ChartSeries extends Array<{
  x: any;
  y: any;
}> { };

const HoldingsDistributionChart = ({ addrStore, loading }: HoldingsDistributionChartProps) => {
  const { addressFormatter, BTCFormatter } = useFormatter();
  const [totalSpendableBalance, setTotalSpendableBalance] = useState<number>(0);
  const [options, setOptions] = useState<ApexOptions | undefined>({});
  const [series, setSeries] = useState<ApexOptions["series"]>([]);

  useEffect(() => {
    if (!addrStore) {
      return;
    }
    let seriesData: ChartSeries = [];
    let _totalSpendableBalance = 0;
    _.forEach(addrStore, (addr) => {
      const spendableBalance = addr.chain_stats.funded_txo_sum - addr.chain_stats.spent_txo_sum;
      _totalSpendableBalance += spendableBalance;
      if (spendableBalance !== 0) {
        seriesData.push({
          x: addr.label,
          y: spendableBalance,
        });
      }
    });
    setTotalSpendableBalance(_totalSpendableBalance);
    seriesData = seriesData.sort((a, b) => b.y - a.y);
    setSeries([{ data: seriesData }]);
    setOptions({
      chart: {
        animations: {
          enabled: false,
          speed: 0
        }
      },
      title: {
        text: 'Aggregated coins by address',
        align: 'center',
        style: {// TODO: when theming move this to a variable 
          fontSize: '20px',
          fontWeight: 500,
          fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
          color: '#dbdbdb'
        }
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
                color: '#cce6ff'
              },
              {
                from: 1_000,
                to: 100_000,
                color: '#99bfff'
              },
              {
                from: 100_000,
                to: 100_000_000,
                color: '#66a3ff'
              },
              {
                from: 100_000_000,
                to: 100_00_000_000,
                color: '#428cff'
              }]
          },

        }
      },
      yaxis: {
        labels: {
          formatter: (val) => {
            const avg = (val / totalSpendableBalance * 100).toFixed(2);
            return BTCFormatter(val) + ` (${avg}%)`;
          }
        }
      },
      xaxis: {
        labels: {
          formatter: (val) => {
            return addressFormatter(val);
          }
        }
      },
      tooltip: {
        cssClass: 'AppChartTooltip',
      }
    })
  }, [addrStore])

  useEffect(() => {
    setTotalSpendableBalance(totalSpendableBalance);
  }, [totalSpendableBalance])

  return (
    <IonCard className='HoldingsDistributionChart'>
      <IonCardContent>
        {loading
          ? <>
            <IonSkeletonText animated={true} className='ChartSkeletonHeader'></IonSkeletonText>
            <IonSkeletonText animated={true} className='ChartSkeletonBody'></IonSkeletonText>
          </>
          : <ReactApexChart options={options} series={series} height={180} type="treemap" />}
      </IonCardContent>
    </IonCard>
  );
}

export default HoldingsDistributionChart;