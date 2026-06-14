import { IonButton, IonCard, IonSkeletonText } from "@ionic/react";
import dayjs from "dayjs";
import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import { useEffect, useState } from "react";
import { useLatestPricingContext } from "../../../../context/LatestPriceContext";
import { useToastContext } from "../../../../context/ToastContext";
import { AddressStateObject } from "../../../../hooks/useAddresses";
import { TransactionsStorage, useTxs } from "../../../../hooks/useTxs";
import "./AddressesTable.scss";
import {
  AddressesTableColumn,
  useAddressesTableColumns,
} from "./AddressesTableColumns";

interface AddressesTableProps {
  addrStore?: AddressStateObject;
  txStore?: TransactionsStorage;
  loading?: boolean;
  onAddAddress: () => void;
  onEditAddress: (address: string) => void;
  onDeleteAddress: (address: string) => Promise<void> | void;
}

const AddressesTable = ({
  addrStore,
  txStore,
  loading,
  onAddAddress,
  onEditAddress,
  onDeleteAddress,
}: AddressesTableProps) => {
  const [tableData, setTableData] = useState(new Array<AddressesTableColumn>());
  const { getFirstInAndLastOut } = useTxs();
  const { setOpenToast } = useToastContext();
  const { latestPrice } = useLatestPricingContext();
  const ADDRESSES_TABLE_COLUMNS = useAddressesTableColumns({
    onEditAddress,
    onDeleteAddress,
    onCopyValueFromCell,
  });

  useEffect(() => {
    if (addrStore === undefined) return;
    if (txStore === undefined) return;

    const _tableData = new Array<AddressesTableColumn>();
    for (const addr of Object.values(addrStore)) {
      const _filo = getFirstInAndLastOut(txStore, addr.address);
      const txCount = txStore[addr.address].filter(
        (tx) => tx.status.confirmed,
      ).length;
      _tableData.push({
        label: addr.label,
        address: addr.address,
        currentPrice:
          ((addr.chain_stats.funded_txo_sum - addr.chain_stats.spent_txo_sum) /
            1e8) *
          latestPrice,
        balance:
          addr.chain_stats.funded_txo_sum - addr.chain_stats.spent_txo_sum,
        txCount: txCount,
        type: addr.type,
        firstTxIn: _filo.firstIn?.status.block_time
          ? dayjs
              .unix(_filo.firstIn.status.block_time)
              .format("YYYY-MM-DD HH:mm:ss")
          : "-",
        lastTxOut: _filo.lastOut?.status.block_time
          ? dayjs
              .unix(_filo.lastOut.status.block_time)
              .format("YYYY-MM-DD HH:mm:ss")
          : "-",
      });
    }

    setTableData(_tableData.sort((a, b) => b.balance - a.balance));
  }, [addrStore, txStore, latestPrice, loading]);

  const table = useMaterialReactTable({
    columns: ADDRESSES_TABLE_COLUMNS,
    data: tableData,
    enableFullScreenToggle: false,
    initialState: {
      pagination: { pageSize: 25, pageIndex: 0 },
      density: "compact",
    },
    muiPaginationProps: {
      rowsPerPageOptions: [25, 50, 100],
    },
    filterFromLeafRows: true, //apply filtering to all rows instead of just parent rows
    paginateExpandedRows: false, //When rows are expanded, do not count sub-rows as number of rows on the page towards pagination
    renderTopToolbarCustomActions: () => (
      <IonButton fill="clear" color="dark" onClick={onAddAddress}>
        + Add New Address
      </IonButton>
    ),
  });

  function onCopyValueFromCell(value: string) {
    navigator.clipboard.writeText(value);
    setOpenToast({
      message: `Address ${value} copied to clipboard!`,
      color: "success",
    });
  }

  return (
    <IonCard className="AddressesTable TableData">
      {loading ? (
        <div className="AddressesTableLoading">
          <IonSkeletonText animated={true} className="AddressesTableSkeleton" />
          <IonSkeletonText animated={true} className="AddressesTableSkeleton" />
          <IonSkeletonText animated={true} className="AddressesTableSkeleton" />
          <IonSkeletonText animated={true} className="AddressesTableSkeleton" />
          <IonSkeletonText animated={true} className="AddressesTableSkeleton" />
          <IonSkeletonText animated={true} className="AddressesTableSkeleton" />
          <IonSkeletonText animated={true} className="AddressesTableSkeleton" />
          <IonSkeletonText animated={true} className="AddressesTableSkeleton" />
        </div>
      ) : (
        <MaterialReactTable table={table} />
      )}
    </IonCard>
  );
};

export default AddressesTable;
