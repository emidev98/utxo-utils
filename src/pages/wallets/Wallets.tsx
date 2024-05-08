import { useEffect, useMemo, useState } from 'react';
import './Wallets.scss';
import { TransactionsStorage, useTxs } from '../../hooks/useTxs';
import { AddressStateObject, useAddresses } from '../../hooks/useAddresses';
import SimpleKpi from '../../components/kpis/counter/SimpleKpi';
import * as _ from 'lodash';
import useFormatter from '../../hooks/useFormatter';
import WalletsTable from './components/wallets-table/WalletsTable';
import HoldingsDistributionChart from './components/holdings-distribution-chart/HoldingsDistributionChart';

const WalletsPage = ({ }) => {
  const { getAllTxs, calculatePaidTxsFees } = useTxs();
  const { getAddresses, sumBalances } = useAddresses();
  const { BTCFormatter } = useFormatter();

  const [isLoading, setLoading] = useState(true);

  const [addrCount, setAddrCount] = useState(0);
  const [txsCount, setTxsCount] = useState(0);

  const [txStore, setTxStore] = useState<TransactionsStorage>();
  const [addrStore, setAddrStore] = useState<AddressStateObject>();
  const [spendableBalance, setSpendableBalance] = useState(0);
  const [feesPaid, setFeesPaid] = useState(0);

  useEffect(() => {
    const init = async () => {
      const [_txStore, _addrStore] = await Promise.all([getAllTxs(), getAddresses()]);
      const flattenTxs = _.flatMap(_txStore);

      setAddrCount( Object.keys(_addrStore).length);
      setTxsCount(flattenTxs.filter((tx) => tx.status.confirmed).length);
      setFeesPaid(0);
      setSpendableBalance(sumBalances(_addrStore));

      setTxStore(_txStore);
      setAddrStore(_addrStore);

      setLoading(false);
    };
    init();
  }, [addrCount])

  return (
    <div className='WalletsPage'>
      <SimpleKpi loading={isLoading} amount={addrCount} message='Addresses' />
      <SimpleKpi loading={isLoading} amount={txsCount} message='Total Tx ' />
      <SimpleKpi loading={isLoading} amount={BTCFormatter(spendableBalance)} message='Spendable balance' />
      <SimpleKpi loading={isLoading} amount={BTCFormatter(feesPaid)} message='Fees paid' />
      <HoldingsDistributionChart loading={isLoading} addrStore={addrStore}  />
      <WalletsTable loading={isLoading} addrStore={addrStore} txStore={txStore} />
    </div>
  );
};

export default WalletsPage;
