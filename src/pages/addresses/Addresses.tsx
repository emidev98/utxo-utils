import { useEffect, useState } from "react";
import "./Addresses.scss";
import { TransactionsStorage, useTxs } from "../../hooks/useTxs";
import { AddressStateObject, useAddresses } from "../../hooks/useAddresses";
import SimpleKpi from "../../components/kpis/counter/SimpleKpi";
import * as _ from "lodash";
import useFormatter from "../../hooks/useFormatter";
import HoldingsDistributionChart from "./components/holdings-distribution-chart/HoldingsDistributionChart";
import AddressesTable from "./components/addresses-table/AddressesTable";
import { useModalContext } from "../../context/ModalContext";

const AddressesPage = ({}) => {
  const { getAllTxs } = useTxs();
  const { getAddresses, sumBalances, sumTxsFeesPaid } = useAddresses();
  const { BTCFormatter } = useFormatter();

  const [isLoading, setLoading] = useState(true);

  const [addrCount, setAddrCount] = useState(0);
  const [txsCount, setTxsCount] = useState(0);

  const [txStore, setTxStore] = useState<TransactionsStorage>();
  const [addrStore, setAddrStore] = useState<AddressStateObject>();
  const [spendableBalance, setSpendableBalance] = useState(0);
  const [feesPaid, setFeesPaid] = useState(0);

  const { isOpen } = useModalContext();

  const init = async () => {
    const [_txStore, _addrStore] = await Promise.all([
      getAllTxs(),
      getAddresses(),
    ]);
    const flattenTxs = _.flatMap(_txStore);

    setAddrCount(Object.keys(_addrStore).length);
    setTxsCount(flattenTxs.filter((tx) => tx.status.confirmed).length);
    setFeesPaid(sumTxsFeesPaid(_txStore, _addrStore));
    setSpendableBalance(sumBalances(_addrStore));

    setTxStore(_txStore);
    setAddrStore(_addrStore);

    setLoading(false);
  };

  useEffect(() => {
    init();
  }, [addrCount]);

  useEffect(() => {
    if (!isOpen) {
      init();
    }
  }, [isOpen]);

  return (
    <div className="AddressesPage">
      <SimpleKpi loading={isLoading} amount={addrCount} message="Addresses" />
      <SimpleKpi
        loading={isLoading}
        amount={txsCount}
        message="Confirmed Tx "
      />
      <SimpleKpi
        loading={isLoading}
        amount={BTCFormatter(spendableBalance)}
        message="Spendable balance"
      />
      <SimpleKpi
        loading={isLoading}
        amount={BTCFormatter(feesPaid)}
        message="Fees paid"
      />
      <HoldingsDistributionChart loading={isLoading} addrStore={addrStore} />
      <AddressesTable
        loading={isLoading}
        addrStore={addrStore}
        txStore={txStore}
      />
    </div>
  );
};

export default AddressesPage;
