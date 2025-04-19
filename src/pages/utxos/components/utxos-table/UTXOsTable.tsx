import { useEffect, useMemo, useState } from "react";
import "./UTXOsTable.scss";
import * as _ from "lodash";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { IonCard, IonSkeletonText } from "@ionic/react";
import { sortFirstNumericElement } from "../../../../utils/tables";
import { USDFormatter, SATSFormatter } from "../../../../hooks/useFormatter";
import { BitcoinHistoricalData } from "../../../../models/BitcoinHistoricalData";
import { VoutWithBlockTime } from "../../../../models/MempoolAddressTxs";
import { AddressStateObject } from "../../../../hooks/useAddresses";
import dayjs from "dayjs";

interface TableColumn {
  addressLabel?: string;
  value: number;
  blockTime: number;
  historicalPrice?: number;
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
        Cell: ({ cell }) => {
          const value = cell.getValue<number>();
          return <span>{SATSFormatter(value)}</span>;
        },
      },
      {
        accessorKey: "historicalPrice",
        header: "Historical Price",
        Cell: ({ cell }) => {
          const historicalPrice = cell.getValue<number>();
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
        accessorKey: "blockTime",
        header: "Block Time",
        Cell: ({ cell }) => {
          const blockTime = cell.getValue<number>();
          return <span>{dayjs(blockTime).format("YYYY-MM-DD HH:mm:ss")}</span>;
        },
      },
    ],
    new Array<MRT_ColumnDef<TableColumn>>(),
  );
  const [tableData, setTableData] = useState(new Array<TableColumn>());

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
          ? historicalPrices[priceIndex]
          : undefined;

      _tableData.push({
        addressLabel: addresses[utxo.scriptpubkey_address].label,
        value: utxo.value,
        historicalPrice: historicalPrice?.price,
        blockTime: utxo.block_time.toDate().getTime(),
        script: utxo.scriptpubkey_asm,
      });
    });

    setTableData(
      _tableData.sort((a, b) => {
        return a.blockTime - b.blockTime;
      }),
    );
  }, [historicalPrices, utxos]);

  const table = useMaterialReactTable({
    columns: columns,
    data: tableData,
    enableFullScreenToggle: false,
    filterFromLeafRows: true,
    paginateExpandedRows: false,
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
