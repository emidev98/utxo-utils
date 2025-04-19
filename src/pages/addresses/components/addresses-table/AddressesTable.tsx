import { useEffect, useMemo, useState } from "react";
import "./AddressesTable.scss";
import { TransactionsStorage, useTxs } from "../../../../hooks/useTxs";
import { AddressStateObject } from "../../../../hooks/useAddresses";
import * as _ from "lodash";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { copy } from "ionicons/icons";
import { Button } from "@mui/material";
import { IonCard, IonIcon, IonSkeletonText } from "@ionic/react";
import { sortFirstNumericElement } from "../../../../utils/tables";
import {
  addressFormatter,
  BTCFormatter,
  USDFormatter,
} from "../../../../hooks/useFormatter";
import { useToastContext } from "../../../../context/ToastContext";
import dayjs from "dayjs";
import { usePricing } from "../../../../hooks/usePricing";

interface TableColumn {
  label: string;
  type: string;
  address: string;
  balance: number;
  currentPrice: number;
  txCount: number;
  firstTxIn: string;
  lastTxOut: string;
}

interface AddressesTableProps {
  addrStore?: AddressStateObject;
  txStore?: TransactionsStorage;
  loading?: boolean;
}

const AddressesTable = ({
  addrStore,
  txStore,
  loading,
}: AddressesTableProps) => {
  const { pollLatestPrice } = usePricing();
  const [latestPrice, setLatestPrice] = useState<number>(0);
  const columns = useMemo<MRT_ColumnDef<TableColumn>[]>(
    () => [
      {
        accessorKey: "label",
        header: "Label",
        size: 0,
      },
      {
        accessorKey: "address",
        header: "Address",
        size: 0,
        Cell: (props) => {
          return (
            <div className="CopyCell">
              <Button
                className="CopyCellButton"
                onClick={() =>
                  onCopyValueFromCell(props.renderedCellValue as string)
                }
              >
                <IonIcon size="medium-large" icon={copy}></IonIcon>
              </Button>
              <span>{addressFormatter(props.renderedCellValue as string)}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "balance",
        header: "Spendable Balance",
        size: 0,
        sortingFn: sortFirstNumericElement,
        Cell: (props) => {
          const value = props.cell.getValue<number>();
          return <span>{BTCFormatter(value)}</span>;
        },
      },
      {
        accessorKey: "currentPrice",
        header: "Current Price",
        sortingFn: sortFirstNumericElement,
        Cell: (props) => {
          const value = props.cell.getValue<number>();
          return <span>{USDFormatter(value)}</span>;
        },
      },
      {
        accessorKey: "lastTxOut",
        header: "Last tx sent",
        size: 162,
      },
      {
        accessorKey: "firstTxIn",
        header: "First tx received",
        size: 162,
      },
      {
        accessorKey: "txCount",
        header: "Txs",
        size: 0,
      },
      {
        accessorKey: "type",
        header: "Type",
        size: 0,
      },
    ],
    new Array<MRT_ColumnDef<TableColumn>>(),
  );
  const [tableData, setTableData] = useState(new Array<TableColumn>());
  const { getFirstInAndLastOut } = useTxs();
  const { setOpenToast } = useToastContext();

  useEffect(pollLatestPrice(setLatestPrice), []);

  useEffect(() => {
    if (addrStore === undefined) return;
    if (txStore === undefined) return;

    const _tableData = new Array<TableColumn>();

    _.forEach(addrStore, (addr) => {
      const _filo = getFirstInAndLastOut(txStore, addr.address);
      const txCount = txStore[addr.address].filter(
        (tx) => tx.status.confirmed,
      ).length;
      _tableData.push({
        label: addr.label,
        address: addr.address,
        currentPrice: (addr.chain_stats.funded_txo_sum / 1e8) * latestPrice,
        balance:
          addr.chain_stats.funded_txo_sum - addr.chain_stats.spent_txo_sum,
        txCount: txCount,
        type: addr.type,
        firstTxIn: _filo.firstIn.status.block_time
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
    });

    setTableData(_tableData.sort((a, b) => b.balance - a.balance));
  }, [addrStore, txStore, latestPrice, loading]);

  const table = useMaterialReactTable({
    columns: columns as any,
    data: tableData,
    enableFullScreenToggle: false,
    initialState: { pagination: { pageSize: 25, pageIndex: 0 } },
    muiPaginationProps: {
      rowsPerPageOptions: [25, 50, 100],
    },
    filterFromLeafRows: true, //apply filtering to all rows instead of just parent rows
    paginateExpandedRows: false, //When rows are expanded, do not count sub-rows as number of rows on the page towards pagination
  });

  const onCopyValueFromCell = (value: string) => {
    navigator.clipboard.writeText(value);
    setOpenToast({
      message: `Address ${value} copied to clipboard!`,
      color: "success",
    });
  };

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
