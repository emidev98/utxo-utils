import { IonButton, IonCard, IonSkeletonText } from "@ionic/react";
import dayjs from "dayjs";
import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import { useEffect, useState } from "react";
import {
  ExchangeAccount,
  ExchangeStore,
} from "../../../../models/ExchangeData";
import "./ExchangesTable.scss";
import {
  ExchangesTableColumn,
  useExchangesTableColumns,
} from "./ExchangesTableColumns";

interface ExchangesTableProps {
  exchangeStore?: ExchangeStore;
  loading?: boolean;
  onAddExchange: () => void;
  onViewExchange: (id: string) => void;
  onDeleteExchange: (id: string) => void;
}

const ExchangesTable = ({
  exchangeStore,
  loading,
  onAddExchange,
  onViewExchange,
  onDeleteExchange,
}: ExchangesTableProps) => {
  const [tableData, setTableData] = useState(new Array<ExchangesTableColumn>());

  const columns = useExchangesTableColumns({
    onViewExchange,
    onDeleteExchange,
  });

  useEffect(() => {
    if (exchangeStore === undefined) return;

    const rows = Object.values(exchangeStore).map(
      (account: ExchangeAccount) => {
        const txCount = account.transactions.length;
        const matchedCount = account.transactions.filter(
          (tx) => tx.matchState !== "unmatched",
        ).length;

        const timestamps = account.transactions.map((tx) => tx.timestamp);
        const firstTxTimestamp = timestamps.length
          ? Math.min(...timestamps)
          : undefined;
        const lastTxTimestamp = timestamps.length
          ? Math.max(...timestamps)
          : undefined;

        return {
          id: account.id,
          name: account.name,
          txCount,
          matchedCount,
          firstTxTimestamp,
          lastTxTimestamp,
          lastModifiedTimestamp: account.lastImportedAt,
          firstTxDate: firstTxTimestamp
            ? dayjs.unix(firstTxTimestamp).format("YYYY-MM-DD HH:mm")
            : "-",
          lastTxDate: lastTxTimestamp
            ? dayjs.unix(lastTxTimestamp).format("YYYY-MM-DD HH:mm")
            : "-",
          lastModifiedDate: account.lastImportedAt
            ? dayjs.unix(account.lastImportedAt).format("YYYY-MM-DD")
            : "-",
        };
      },
    );

    setTableData(rows.sort((a, b) => b.txCount - a.txCount));
  }, [exchangeStore]);

  const table = useMaterialReactTable({
    columns,
    data: tableData,
    enableFullScreenToggle: false,
    initialState: {
      pagination: { pageSize: 25, pageIndex: 0 },
      density: "compact",
    },
    muiPaginationProps: {
      rowsPerPageOptions: [25, 50, 100],
    },
    renderTopToolbarCustomActions: () => (
      <IonButton fill="clear" color="dark" onClick={onAddExchange}>
        + Add Exchange
      </IonButton>
    ),
  });

  return (
    <IonCard className="ExchangesTable TableData">
      {loading ? (
        <div className="ExchangesTableLoading">
          <IonSkeletonText animated={true} className="ExchangesTableSkeleton" />
          <IonSkeletonText animated={true} className="ExchangesTableSkeleton" />
          <IonSkeletonText animated={true} className="ExchangesTableSkeleton" />
          <IonSkeletonText animated={true} className="ExchangesTableSkeleton" />
          <IonSkeletonText animated={true} className="ExchangesTableSkeleton" />
          <IonSkeletonText animated={true} className="ExchangesTableSkeleton" />
          <IonSkeletonText animated={true} className="ExchangesTableSkeleton" />
          <IonSkeletonText animated={true} className="ExchangesTableSkeleton" />
        </div>
      ) : (
        <MaterialReactTable table={table} />
      )}
    </IonCard>
  );
};

export default ExchangesTable;
