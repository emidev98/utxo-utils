import { useEffect, useState } from "react";
import "./UTXOsPage.scss";
import { usePricing } from "../../hooks/usePricing";
import UTXOsTimelineChart from "./components/utxos-timeline-chart/UTXOsTimelineChart";
import { BitcoinHistoricalData } from "../../models/BitcoinHistoricalData";
import _first from "lodash/first";
import _last from "lodash/last";
import { useUTXOs } from "../../hooks/useUTXOs";
import { UTXO, VoutWithBlockTime } from "../../models/MempoolAddressTxs";
import UTXOsTable from "./components/utxos-table/UTXOsTable";
import { AddressStateObject, useAddresses } from "../../hooks/useAddresses";
import Kpi from "../../components/kpis/Kpi";
import dayjs, { Dayjs } from "dayjs";

const UTXOsPage = ({}) => {
  const { getAllUTXOs, getUtxoFirstSyncDate } = useUTXOs();
  const { getBitcoinHistoricalData } = usePricing();
  const [firstUtxo, setFirstUtxo] = useState<UTXO>();
  const [lastUtxo, setLastUtxo] = useState<UTXO>();
  const [withThreeKpis, setWithThreeKpis] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<number | undefined>();
  const [addresses, setAddresses] = useState<AddressStateObject>({});
  const [utxos, setUtxos] = useState<UTXO[]>([]);
  const [historicalPrices, setHistoricalPrices] = useState<
    BitcoinHistoricalData[]
  >([]);
  const [isLoading, setLoading] = useState(true);
  const [utxosCount, setUtxosCount] = useState(0);
  const { getAddresses } = useAddresses();

  useEffect(() => {
    const init = async () => {
      const [_utxos, _utxosFirstSyncDate, _historicalPrices, _addresses] =
        await Promise.all([
          getAllUTXOs(),
          getUtxoFirstSyncDate(),
          getBitcoinHistoricalData(),
          getAddresses(),
        ]);

      const _firstUtxo = _first(_utxos);
      const _lastUtxo = _last(_utxos);
      setUtxosCount(_utxos.length);
      setFirstUtxo(_firstUtxo);
      setLastUtxo(_lastUtxo);
      setWithThreeKpis(!!_firstUtxo?.block_time.isSame(_lastUtxo?.block_time));

      setLastSyncDate(_utxosFirstSyncDate);
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
    utxos: UTXO[],
  ) => {
    console.log("onClickChartAnnotation", pointAnnotations, event, utxos);
  };

  return (
    <div className={"UTXOsPage " + (withThreeKpis ? "WithThreeKpis" : "")}>
      <Kpi loading={isLoading} value={utxosCount} title="UTXOs" />

      {firstUtxo?.block_time.isSame(lastUtxo?.block_time) ? (
        <Kpi
          loading={isLoading}
          value={firstUtxo?.block_time.format("DD MMM YYYY H:m:s")}
          title="UTXO received date"
        />
      ) : (
        <>
          <Kpi
            loading={isLoading}
            value={firstUtxo?.block_time.format("DD MMM YYYY H:m:s")}
            title="First received UTXO date"
          />

          <Kpi
            loading={isLoading}
            value={lastUtxo?.block_time.format("DD MMM YYYY H:m:s")}
            title="Last received UTXO date"
          />
        </>
      )}
      <Kpi
        loading={isLoading}
        value={
          lastSyncDate
            ? dayjs.unix(lastSyncDate).format("DD MMM YYYY H:m:s")
            : "-"
        }
        title="Last full check date"
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
