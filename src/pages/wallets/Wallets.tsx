import { useEffect, useMemo, useState } from 'react';
import './Wallets.scss';
import { TransactionsStorage, useTxs } from '../../hooks/useTxs';
import { AddressStateObject, useAddresses } from '../../hooks/useAddresses';
import SimpleKpi from '../../components/kpis/counter/SimpleKpi';
import * as _ from 'lodash';
import useFormatter from '../../hooks/useFormatter';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';

interface TableColumn {
  address: string;
  balance: string;
  utxoNumber: number;
  stxoNumber: number;
  type: string;
}

const WalletsPage = ({ }) => {
  const columns = useMemo<MRT_ColumnDef<TableColumn>[]>(
    () => [
      {
        accessorKey: 'type',
        header: 'Type',
        size: 0,
      },
      {
        accessorKey: 'address',
        header: 'Address',
      },
      {
        accessorKey: 'balance',
        header: 'Balance',
        size: 40,
      },
      {
        accessorKey: 'utxoNumber',
        header: '#UTXO',
        size: 40,
      },
      {
        accessorKey: 'stxoNumber',
        header: '#STXO',
        size: 40,
      },
    ],
    new Array<MRT_ColumnDef<TableColumn>>(),
  );
  const { getAllTxs, calculatePaidTxsFees, splitSTXOandUTXO } = useTxs();
  const { getAddresses, countAddresses, sumUTXO } = useAddresses();
  const { BTCFormatter } = useFormatter();

  const [isLoading, setLoading] = useState(true);
  const [tableData, setTableData] = useState(new Array<TableColumn>());

  const [addrCount, setAddrCount] = useState(0);
  const [txsCount, setTxsCount] = useState(0);
  const [totalHoldings, setTotalHoldings] = useState(0);
  const [feesPaid, setFeesPaid] = useState(0);

  useEffect(() => {
    const init = async () => {
      const [txStore, addrStore] = await Promise.all([getAllTxs(), getAddresses()]);
      const flattenTxs = _.flatMap(txStore);

      setAddrCount(countAddresses(addrStore));
      setTxsCount(flattenTxs.length);
      setFeesPaid(calculatePaidTxsFees(txStore, addrStore));
      setTotalHoldings(sumUTXO(txStore, addrStore));

      parseTableData(txStore, addrStore);
      setLoading(false);
    };
    init();
  }, [addrCount])

  const parseTableData = (txStore: TransactionsStorage, addrStore: AddressStateObject) => {
    const _tableData = new Array<TableColumn>();
    const splitted = splitSTXOandUTXO(txStore, addrStore);

    _.forEach(addrStore, (addr) => {
      const txs = splitted[addr.address];
      const balance = _.sumBy(txs.utxo, (tx) => {
        return _.reduce(tx.vout, (acc, vout) => {
          if (vout.scriptpubkey_address === addr.address) {
            return acc + vout.value;
          }
          return acc;
        }, 0)
      });

      _tableData.push({
        address: addr.address,
        balance: BTCFormatter(balance),
        utxoNumber: txs.stxo.length,
        stxoNumber: txs.utxo.length,
        type: addr.type,
      });
    });

    setTableData(_tableData);
  }

  const table = useMaterialReactTable({
    columns: (columns as any),
    data: tableData,
    filterFromLeafRows: true, //apply filtering to all rows instead of just parent rows
    paginateExpandedRows: false, //When rows are expanded, do not count sub-rows as number of rows on the page towards pagination
  });

  return (
    <div className='WalletsPage'>
      <SimpleKpi loading={isLoading} amount={addrCount} message='Addresses' />
      <SimpleKpi loading={isLoading} amount={txsCount} message='Transactions' />
      <SimpleKpi loading={isLoading} amount={BTCFormatter(totalHoldings)} message='Balance' />
      <SimpleKpi loading={isLoading} amount={BTCFormatter(feesPaid)} message='Fees paid' />
      <div className="TableData">
        <MaterialReactTable table={table} />
      </div>
    </div>
  );
};

export default WalletsPage;
