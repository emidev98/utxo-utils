import { IonCard, IonSkeletonText } from "@ionic/react";
import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import { useEffect, useState } from "react";
import { useLatestPricingContext } from "../../../../context/LatestPriceContext";
import { AddressStateObject } from "../../../../hooks/useAddresses";
import { BitcoinHistoricalData } from "../../../../models/BitcoinHistoricalData";
import { UTXO } from "../../../../models/MempoolAddressTxs";
import "./UTXOsTable.scss";
import { UTXOS_TABLE_COLUMNS, UtxosTableColumn } from "./UTXOsTableColumns";

interface UTXOsTableProps {
  historicalPrices: BitcoinHistoricalData[];
  utxos: UTXO[];
  addresses: AddressStateObject;
  firstUtxo?: UTXO;
  lastUtxo?: UTXO;
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
  const { latestPrice } = useLatestPricingContext();

  const [tableData, setTableData] = useState(new Array<UtxosTableColumn>());

  useEffect(() => {
    if (firstUtxo === undefined || lastUtxo === undefined) return;

    const _tableData = new Array<UtxosTableColumn>();
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
      });
    });

    setTableData(_tableData.sort((a, b) => b.blockTime - a.blockTime));
  }, [historicalPrices, utxos, addresses, latestPrice]);

  const table = useMaterialReactTable({
    columns: UTXOS_TABLE_COLUMNS,
    data: tableData,
    enableFullScreenToggle: false,
    filterFromLeafRows: true,
    paginateExpandedRows: false,
    initialState: {
      pagination: { pageSize: 25, pageIndex: 0 },
      density: "comfortable",
    },
    muiPaginationProps: {
      rowsPerPageOptions: [25, 50, 100],
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
