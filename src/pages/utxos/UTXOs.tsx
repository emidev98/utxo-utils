import { useEffect, useState } from "react";
import "./UTXOs.scss";
import { usePricing } from "../../hooks/usePricing";
import UTXOTimelineChart from "./components/utxos-timeline-chart/UTXOTimelineChart";
import { BitcoinHistoricalData } from "../../models/BitcoinHistoricalData";
import * as _ from "lodash";
import { useUTXOs } from "../../hooks/useUTXOs";
import { VoutWithBlockTime } from "../../models/MempoolAddressTxs";

const UTXOsPage = ({}) => {
  const { getAllUTXOs } = useUTXOs();
  const { getBitcoinHistoricalData } = usePricing();
  const [chartData, setChartData] = useState<{
    historicalPrices: BitcoinHistoricalData[];
    utxos: VoutWithBlockTime[];
  }>({ historicalPrices: [], utxos: [] });
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const [utxos, historicalPrices] = await Promise.all([
        getAllUTXOs(),
        getBitcoinHistoricalData(),
      ]);

      if (historicalPrices instanceof Error) {
        throw historicalPrices;
      }

      setChartData({
        utxos,
        historicalPrices,
      });
      setLoading(false);
    };
    init();
  }, []);

  return (
    <div className="UTXOsPage">
      <UTXOTimelineChart data={chartData} loading={isLoading} />
    </div>
  );
};

export default UTXOsPage;
