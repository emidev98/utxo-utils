import { useEffect, useMemo, useState } from "react";
import "./AddressesTable.scss";
import { TransactionsStorage, useTxs } from "../../../../hooks/useTxs";
import {
  AddressStateObject,
  AddressInfoExtended,
  useAddresses,
} from "../../../../hooks/useAddresses";
import {
  MaterialReactTable,
  MRT_Row,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { copy, copySharp, pencil, trash } from "ionicons/icons";
import { IonButton, IonCard, IonIcon, IonSkeletonText } from "@ionic/react";
import { sortFirstNumericElement } from "../../../../utils/tables";
import {
  addressFormatter,
  BTCFormatter,
  USDFormatter,
} from "../../../../hooks/useFormatter";
import { useToastContext } from "../../../../context/ToastContext";
import dayjs from "dayjs";
import { useLatestPricingContext } from "../../../../context/LatestPriceContext";
import ConfirmModal from "../../../../components/confirm-modal/ConfirmModal";
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
  const columns = useMemo<MRT_ColumnDef<TableColumn>[]>(
    () => [
      {
        accessorKey: "remove",
        header: "",
        size: 0,
        Cell: (props) => {
          return (
            <div className="LabelCell">
              <IonButton
                className="RemoveButton"
                fill="clear"
                color="danger"
                onClick={() => onDeleteAddress(props.row.original.address)}
              >
                <IonIcon size="small" icon={trash}></IonIcon>
              </IonButton>
            </div>
          );
        },
      },
      {
        accessorKey: "edit",
        header: "",
        size: 0,
        Cell: (props) => {
          return (
            <div className="LabelCell">
              <IonButton
                className="EditButton"
                fill="clear"
                onClick={() => onEditAddress(props.row.original.address)}
              >
                <IonIcon size="small" icon={pencil}></IonIcon>
              </IonButton>
            </div>
          );
        },
      },
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
              <IonButton
                fill="clear"
                className="CopyCellButton"
                onClick={() =>
                  onCopyValueFromCell(String(props.renderedCellValue))
                }
              >
                <IonIcon size="small" icon={copySharp}></IonIcon>
              </IonButton>
              <span>{addressFormatter(String(props.renderedCellValue))}</span>
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
    [onEditAddress, onDeleteAddress],
  );
  const [tableData, setTableData] = useState(new Array<TableColumn>());
  const { getFirstInAndLastOut } = useTxs();
  const { setOpenToast } = useToastContext();
  const { latestPrice } = useLatestPricingContext();

  useEffect(() => {
    if (addrStore === undefined) return;
    if (txStore === undefined) return;

    const _tableData = new Array<TableColumn>();
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
    columns: columns as any,
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
    renderTopToolbarCustomActions: ({ table }) => (
      <IonButton fill="clear" color="dark" onClick={onAddAddress}>
        + Add New Address
      </IonButton>
    ),
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
