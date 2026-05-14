import { useEffect, useState } from "react";
import "./AddressesPage.scss";
import { TransactionsStorage, useTxs } from "../../hooks/useTxs";
import { AddressStateObject, useAddresses } from "../../hooks/useAddresses";
import Kpi from "../../components/kpis/Kpi";
import _flatMap from "lodash/flatMap";
import HoldingsDistributionChart from "./components/holdings-distribution-chart/HoldingsDistributionChart";
import AddressesTable from "./components/addresses-table/AddressesTable";
import { BTCFormatter, USDFormatter } from "../../hooks/useFormatter";
import { useLatestPricingContext } from "../../context/LatestPriceContext";

const AddressesPage = ({}) => {
  const { getAllTxs } = useTxs();
  const { getAddresses, sumBalances } = useAddresses();

  const [isLoading, setLoading] = useState(true);

  const [addrCount, setAddrCount] = useState(0);
  const [txsCount, setTxsCount] = useState(0);

  const [txStore, setTxStore] = useState<TransactionsStorage>();
  const [addrStore, setAddrStore] = useState<AddressStateObject>();
  const [spendableBalance, setSpendableBalance] = useState(0);
  const [spendableBalanceUSD, setSpendableBalanceUSD] = useState(0);
  const { latestPrice } = useLatestPricingContext();

  const init = async () => {
    const [_txStore, _addrStore] = await Promise.all([
      getAllTxs(),
      getAddresses(),
    ]);
    const flattenTxs = _flatMap(_txStore);
    if (flattenTxs.length !== 0) {
      setTxsCount(flattenTxs.filter((tx) => tx?.status?.confirmed).length);
    }
    setAddrCount(Object.keys(_addrStore).length);

    const spendableBalance = sumBalances(_addrStore);

    setSpendableBalance(spendableBalance);
    setSpendableBalanceUSD((spendableBalance / 1e8) * latestPrice);

    setTxStore(_txStore);
    setAddrStore(_addrStore);

    setLoading(false);
  };

  const refresh = () => init();

  useEffect(() => {
    init();
  }, [addrCount, latestPrice]);

  return (
    <div className="AddressesPage">
      <Kpi loading={isLoading} value={addrCount} title="Addresses" />
      <Kpi loading={isLoading} value={txsCount} title="Confirmed Tx" />
      <Kpi
        loading={isLoading}
        value={spendableBalance}
        formatter={BTCFormatter}
        title="BTC Balance"
      />
      <Kpi
        loading={isLoading}
        value={spendableBalanceUSD}
        formatter={USDFormatter}
        title="USD Balance"
      />
      <HoldingsDistributionChart loading={isLoading} addrStore={addrStore} />
      <AddressesTable
        loading={isLoading}
        addrStore={addrStore}
        txStore={txStore}
        refresh={refresh}
      />
    </div>
  );
};

export default AddressesPage;
