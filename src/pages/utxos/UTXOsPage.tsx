import { useEffect, useState } from "react";
import "./UTXOsPage.scss";
import { usePricing } from "../../hooks/usePricing";
import UTXOTimelineChart from "./components/utxos-timeline-chart/UTXOTimelineChart";
import { BitcoinHistoricalData } from "../../models/BitcoinHistoricalData";
import * as _ from "lodash";
import { useUTXOs } from "../../hooks/useUTXOs";
import { VoutWithBlockTime } from "../../models/MempoolAddressTxs";
import SimpleKpi from "../../components/kpis/counter/SimpleKpi";

const UTXOsPage = ({}) => {
  const { getAllUTXOs } = useUTXOs();
  const { getBitcoinHistoricalData } = usePricing();
  const [firstUtxo, setFirstUtxo] = useState<VoutWithBlockTime>();
  const [lastUtxo, setLastUtxo] = useState<VoutWithBlockTime>();
  const [utxos, setUtxos] = useState<VoutWithBlockTime[]>([]);
  const [historicalPrices, setHistoricalPrices] = useState<
    BitcoinHistoricalData[]
  >([]);
  const [isLoading, setLoading] = useState(true);
  const [utxosCount, setUtxosCount] = useState(0);

  useEffect(() => {
    const init = async () => {
      const [_utxos, _historicalPrices] = await Promise.all([
        getAllUTXOs(),
        getBitcoinHistoricalData(),
      ]);

      if (_historicalPrices instanceof Error) {
        throw _historicalPrices;
      }

      setUtxosCount(_utxos.length);
      setFirstUtxo(_.first(_utxos));
      setLastUtxo(_.last(_utxos));

      setUtxos(_utxos);
      setHistoricalPrices(_historicalPrices);
      setLoading(false);
    };
    init();
  }, []);

  const onClickChartAnnotation = (
    pointAnnotations: PointAnnotations,
    event: Event,
    utxos: VoutWithBlockTime[],
  ) => {
    console.log("onClickChartAnnotation", pointAnnotations, event, utxos);
  };

  return (
    <div className="UTXOsPage">
      <SimpleKpi loading={isLoading} value={utxosCount} title="UTXOs" />

      <SimpleKpi
        loading={isLoading}
        value={firstUtxo?.block_time.format("DD MMM YYYY H:m:s")}
        title="First UTXO date"
      />

      <SimpleKpi
        loading={isLoading}
        value={lastUtxo?.block_time.format("DD MMM YYYY H:m:s")}
        title="Last UTXO date"
      />
      <UTXOTimelineChart
        utxos={utxos}
        historicalPrices={historicalPrices}
        loading={isLoading}
        onClickChartAnnotation={onClickChartAnnotation}
      />
    </div>
  );
};

export default UTXOsPage;
