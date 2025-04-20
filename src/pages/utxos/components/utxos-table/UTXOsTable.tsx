import { useEffect, useMemo, useState } from "react";
import "./UTXOsTable.scss";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { IonCard, IonIcon, IonSkeletonText } from "@ionic/react";
import { sortFirstNumericElement } from "../../../../utils/tables";
import { USDFormatter, SATSFormatter } from "../../../../hooks/useFormatter";
import { BitcoinHistoricalData } from "../../../../models/BitcoinHistoricalData";
import { VoutWithBlockTime } from "../../../../models/MempoolAddressTxs";
import { AddressStateObject } from "../../../../hooks/useAddresses";
import dayjs from "dayjs";
import { usePricing } from "../../../../hooks/usePricing";
import {
  arrowUp,
  arrowDown,
  arrowUpOutline,
  arrowDownOutline,
} from "ionicons/icons";

interface TableColumn {
  addressLabel?: string;
  value: number;
  blockTime: number;
  receivingPrice: number;
  currentPrice: number;
  profitAndLoss: number;
  script: string;
}

interface UTXOsTableProps {
  historicalPrices: BitcoinHistoricalData[];
  utxos: VoutWithBlockTime[];
  addresses: AddressStateObject;
  firstUtxo?: VoutWithBlockTime;
  lastUtxo?: VoutWithBlockTime;
  loading: boolean;
}

const UTXOsTable = ({
  loading,
  historicalPrices,
  addresses,
  utxos,
  firstUtxo,
  lastUtxo,
}: UTXOsTableProps) => {
  const { pollLatestPrice } = usePricing();
  const [latestPrice, setLatestPrice] = useState<number>(0);
  const columns = useMemo<MRT_ColumnDef<TableColumn>[]>(
    () => [
      {
        accessorKey: "addressLabel",
        header: "Address Label",
      },
      {
        accessorKey: "value",
        header: "Value",
        sortingFn: sortFirstNumericElement,
        Cell: (props) => {
          const value = props.cell.getValue<number>();
          return <span>{SATSFormatter(value)}</span>;
        },
      },
      {
        accessorKey: "receivingPrice",
        header: "Reciving Price",
        Cell: (props) => {
          const historicalPrice = props.cell.getValue<number>();
          return (
            <span>
              {historicalPrice !== undefined
                ? USDFormatter(historicalPrice)
                : "N/A"}
            </span>
          );
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
        accessorKey: "profitAndLoss",
        header: "P&L",
        sortingFn: sortFirstNumericElement,
        Cell: (props) => {
          const value = props.cell.getValue<number>();
          return (
            <span>
              {value > 0 ? (
                <IonIcon ios={arrowUpOutline} md={arrowUp} />
              ) : (
                <IonIcon ios={arrowDownOutline} md={arrowDown} />
              )}
              {USDFormatter(value)}
            </span>
          );
        },
      },
      {
        accessorKey: "blockTime",
        header: "Receiving Time",
        Cell: (props) => {
          const blockTime = props.cell.getValue<number>();
          return <span>{dayjs(blockTime).format("YYYY-MM-DD HH:mm:ss")}</span>;
        },
      },
    ],
    new Array<MRT_ColumnDef<TableColumn>>(),
  );
  const [tableData, setTableData] = useState(new Array<TableColumn>());

  useEffect(pollLatestPrice(setLatestPrice), []);

  useEffect(() => {
    if (firstUtxo === undefined || lastUtxo === undefined) return;

    const _tableData = new Array<TableColumn>();
    // Keep track of current position in historicalPrices
    // to make the search linear instead of quadratic
    let priceIndex = 0;

    utxos.forEach((utxo) => {
      // Move forward until we find matching date or pass it
      while (
        priceIndex < historicalPrices.length &&
        historicalPrices[priceIndex].date.isBefore(utxo.block_time, "day")
      ) {
        priceIndex++;
      }

      // Check if we found a matching date
      const historicalPrice =
        priceIndex < historicalPrices.length &&
        historicalPrices[priceIndex].date.isSame(utxo.block_time, "day")
          ? historicalPrices[priceIndex].price
          : 0;

      const receivingPrice = (utxo.value / 1e8) * historicalPrice;
      const currentPrice = (utxo.value / 1e8) * latestPrice;

      _tableData.push({
        addressLabel: addresses[utxo.scriptpubkey_address].label,
        value: utxo.value,
        receivingPrice: receivingPrice,
        currentPrice: currentPrice,
        profitAndLoss: currentPrice - receivingPrice,
        blockTime: utxo.block_time.toDate().getTime(),
        script: utxo.scriptpubkey_asm,
      });
    });

    setTableData(_tableData.sort((a, b) => b.blockTime - a.blockTime));
  }, [historicalPrices, utxos, addresses, latestPrice]);

  const table = useMaterialReactTable({
    columns: columns,
    data: tableData,
    enableFullScreenToggle: false,
    filterFromLeafRows: true,
    paginateExpandedRows: false,
    initialState: { pagination: { pageSize: 25, pageIndex: 0 } },
    muiPaginationProps: {
      rowsPerPageOptions: [25, 50, 100],
    },
    renderDetailPanel: ({ row }) => {
      return (
        <div className="UTXOsTableDetailPanel">
          <div className="UTXOsTableDetailPanelValue">
            {row.original.script}
          </div>
        </div>
      );
    },
  });

  return (
    <IonCard className="UTXOsTable TableData">
      {loading ? (
        <div className="UTXOsTableLoading">
          <IonSkeletonText animated={true} className="UTXOsTableSkeleton" />
          <IonSkeletonText animated={true} className="UTXOsTableSkeleton" />
          <IonSkeletonText animated={true} className="UTXOsTableSkeleton" />
          <IonSkeletonText animated={true} className="UTXOsTableSkeleton" />
          <IonSkeletonText animated={true} className="UTXOsTableSkeleton" />
          <IonSkeletonText animated={true} className="UTXOsTableSkeleton" />
          <IonSkeletonText animated={true} className="UTXOsTableSkeleton" />
          <IonSkeletonText animated={true} className="UTXOsTableSkeleton" />
        </div>
      ) : (
        <MaterialReactTable table={table} />
      )}
    </IonCard>
  );
};

export default UTXOsTable;
