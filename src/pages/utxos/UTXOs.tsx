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
  const [historicalPrices, setHistoricalPrices] = useState<
    BitcoinHistoricalData[]
  >([]);
  const [utxos, setUTXOs] = useState<VoutWithBlockTime[]>([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const [_utxos, _historicalPrices] = await Promise.all([
        getAllUTXOs(),
        getBitcoinHistoricalData(),
      ]);

      if (_historicalPrices instanceof Error) {
        throw _historicalPrices;
      }

      setHistoricalPrices(_historicalPrices);
      setUTXOs(_utxos);
      setLoading(false);
    };
    init();
  }, []);

  return (
    <div className="UTXOsPage">
      <UTXOTimelineChart historicalPrices={historicalPrices} utxos={utxos} />
    </div>
  );
};

export default UTXOsPage;
