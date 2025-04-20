import { useEffect, useState } from "react";
import "./UTXOsPage.scss";
import { usePricing } from "../../hooks/usePricing";
import UTXOsTimelineChart from "./components/utxos-timeline-chart/UTXOsTimelineChart";
import { BitcoinHistoricalData } from "../../models/BitcoinHistoricalData";
import _first from "lodash/first";
import _last from "lodash/last";
import { useUTXOs } from "../../hooks/useUTXOs";
import { VoutWithBlockTime } from "../../models/MempoolAddressTxs";
import SimpleKpi from "../../components/kpis/counter/SimpleKpi";
import UTXOsTable from "./components/utxos-table/UTXOsTable";
import { AddressStateObject, useAddresses } from "../../hooks/useAddresses";

const UTXOsPage = ({}) => {
  const { getAllUTXOs } = useUTXOs();
  const { getBitcoinHistoricalData } = usePricing();
  const [firstUtxo, setFirstUtxo] = useState<VoutWithBlockTime>();
  const [lastUtxo, setLastUtxo] = useState<VoutWithBlockTime>();
  const [addresses, setAddresses] = useState<AddressStateObject>({});
  const [utxos, setUtxos] = useState<VoutWithBlockTime[]>([]);
  const [historicalPrices, setHistoricalPrices] = useState<
    BitcoinHistoricalData[]
  >([]);
  const [isLoading, setLoading] = useState(true);
  const [utxosCount, setUtxosCount] = useState(0);
  const { getAddresses } = useAddresses();

  useEffect(() => {
    const init = async () => {
      const [_utxos, _historicalPrices, _addresses] = await Promise.all([
        getAllUTXOs(),
        getBitcoinHistoricalData(),
        getAddresses(),
      ]);

      if (_historicalPrices instanceof Error) {
        throw _historicalPrices;
      }

      setUtxosCount(_utxos.length);
      setFirstUtxo(_first(_utxos));
      setLastUtxo(_last(_utxos));

      setAddresses(_addresses);
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
      <UTXOsTimelineChart
        firstUtxo={firstUtxo}
        lastUtxo={lastUtxo}
        utxos={utxos}
        historicalPrices={historicalPrices}
        loading={isLoading}
        onClickChartAnnotation={onClickChartAnnotation}
      />

      <UTXOsTable
        loading={isLoading}
        firstUtxo={firstUtxo}
        lastUtxo={lastUtxo}
        utxos={utxos}
        addresses={addresses}
        historicalPrices={historicalPrices}
      />
    </div>
  );
};

export default UTXOsPage;
