import { useEffect, useMemo, useState } from 'react';
import './AddressesTable.scss';
import { TransactionsStorage, useTxs } from '../../../../hooks/useTxs';
import { AddressStateObject } from '../../../../hooks/useAddresses';
import * as _ from 'lodash';
import moment from 'moment';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import useFormatter from '../../../../hooks/useFormatter';
import { copy } from 'ionicons/icons';
import { Button } from '@mui/material';
import { IonCard, IonIcon, IonSkeletonText } from '@ionic/react';
import AppToast from '../../../../components/toast/Toast';

interface TableColumn {
  label: string;
  type: string;
  address: string;
  balance: string;
  feesPaid: string;
  txCount: number;
  firstTxIn: string;
  lastTxOut: string;
}

interface AddressesTableProps {
  addrStore?: AddressStateObject,
  txStore?: TransactionsStorage,
  loading?: boolean,
}

const AddressesTable = ({ addrStore, txStore, loading }: AddressesTableProps) => {
  const columns = useMemo<MRT_ColumnDef<TableColumn>[]>(
    () => [
      {
        accessorKey: 'label',
        header: 'Label',
        size: 0,
      },
      {
        accessorKey: 'address',
        header: 'Address',
        size: 0,
        Cell: (props) => {
          return <div className='CopyCell'>
            <Button className='CopyCellButton' onClick={() => onCopyValueFromCell(props.renderedCellValue as string)}>
              <IonIcon size='medium-large' icon={copy}></IonIcon>
            </Button>
            <span>{addressFormatter(props.renderedCellValue as string)}</span>
          </div>
        }
      },
      {
        accessorKey: 'balance',
        header: 'Spendable Balance',
        size: 0,
      },
      {
        accessorKey : 'feesPaid',
        header: 'Fees Paid',
        size: 0,
      },
      {
        accessorKey: 'lastTxOut',
        header: 'Last tx sent',
        size: 162,
      },
      {
        accessorKey: 'firstTxIn',
        header: 'First tx received',
        size: 162,
      },
      {
        accessorKey: 'txCount',
        header: 'Txs',
        size: 0,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        size: 0,
      },
    ],
    new Array<MRT_ColumnDef<TableColumn>>(),
  );
  const { BTCFormatter, addressFormatter } = useFormatter();
  const [tableData, setTableData] = useState(new Array<TableColumn>());
  const { getFirstInAndLastOut, getFeesPaid} = useTxs();
  const [toast, setToastData] = useState({
    isOpen: false,
    message: "",
    color: "",
});
  useEffect(() => {
    if (addrStore === undefined) return;
    if (txStore === undefined) return;

    const _tableData = new Array<TableColumn>();

    _.forEach(addrStore, (addr) => {
      const _filo = getFirstInAndLastOut(txStore, addr.address);
      const txCount = txStore[addr.address].filter((tx) => tx.status.confirmed).length;
      const feesPaid = getFeesPaid(txStore, addr.address)

      _tableData.push({
        label: addr.label,
        address: addr.address,
        feesPaid: BTCFormatter(feesPaid),
        balance: BTCFormatter(addr.chain_stats.funded_txo_sum - addr.chain_stats.spent_txo_sum),
        txCount: txCount,
        type: addr.type,
        firstTxIn: _filo.firstIn.status.block_time ? moment.unix(_filo.firstIn.status.block_time).format('YYYY-MM-DD HH:mm:ss') : "-",
        lastTxOut: _filo.lastOut?.status.block_time ? moment.unix(_filo.lastOut.status.block_time).format('YYYY-MM-DD HH:mm:ss') : "-",
      });
    });

    setTableData(_tableData.sort((a, b) => a.balance > b.balance ? -1 : 1));
  }, [addrStore, txStore, loading])
  const table = useMaterialReactTable({
    columns: (columns as any),
    data: tableData,
    enableFullScreenToggle: false,
    filterFromLeafRows: true, //apply filtering to all rows instead of just parent rows
    paginateExpandedRows: false, //When rows are expanded, do not count sub-rows as number of rows on the page towards pagination
  });

  const onCopyValueFromCell = (value: string) => {
    navigator.clipboard.writeText(value);
    setToastData({
      isOpen: true,
      message: `Address ${value} copied to clipboard!`,
      color: "success"
    });
    setTimeout(()=>{
      setToastData({ isOpen: false, message: "", color: "" })
    }, 3000)
  }

  return (
    <IonCard className="AddressesTable TableData">
    {loading 
      ? <div className='AddressesTableLoading'>
        <IonSkeletonText animated={true} className='AddressesTableSkeleton'></IonSkeletonText>
        <IonSkeletonText animated={true} className='AddressesTableSkeleton'></IonSkeletonText>
        <IonSkeletonText animated={true} className='AddressesTableSkeleton'></IonSkeletonText>
        <IonSkeletonText animated={true} className='AddressesTableSkeleton'></IonSkeletonText>
        <IonSkeletonText animated={true} className='AddressesTableSkeleton'></IonSkeletonText>
        <IonSkeletonText animated={true} className='AddressesTableSkeleton'></IonSkeletonText>
        <IonSkeletonText animated={true} className='AddressesTableSkeleton'></IonSkeletonText>
        <IonSkeletonText animated={true} className='AddressesTableSkeleton'></IonSkeletonText>
      </div>
      : <MaterialReactTable table={table} /> }

      <AppToast isOpen={toast.isOpen}
          onClick={() => setToastData({ isOpen: false, message: "", color: "" })}
          message={toast.message}
          color={toast.color} />
    </IonCard>
  );
};

export default AddressesTable;
