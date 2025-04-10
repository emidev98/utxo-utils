import { useEffect } from "react";
import "./UTXOs.scss";
import { useTxs } from "../../hooks/useTxs";
import { usePricing } from "../../hooks/usePricing";

const UTXOsPage = ({}) => {
  const { getAllTxs } = useTxs();
  const { getBitcoinHistoricalData } = usePricing();
  useEffect(() => {
    const init = async () => {
      let [txsRes, historicalPrices] = await Promise.all([
        getAllTxs(),
        getBitcoinHistoricalData(),
      ]);

      if (historicalPrices instanceof Error) {
        throw historicalPrices;
      }

      console.log("txsRes", txsRes);
      console.log("historicalPrices", historicalPrices);
    };
    init();
  }, []);

  return <div className="UTXOsPage">UTXOsPage</div>;
};

export default UTXOsPage;
