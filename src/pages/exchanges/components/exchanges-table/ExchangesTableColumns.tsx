import { IonButton, IonIcon } from "@ionic/react";
import { eyeOutline, trashOutline } from "ionicons/icons";
import { MRT_ColumnDef } from "material-react-table";
import { BTCFormatter } from "../../../../hooks/useFormatter";

export interface ExchangesTableColumn {
  id: string;
  name: string;
  txCount: number;
  matchedCount: number;
  btcPurchasedAmount: number;
  btcDepositedAmount: number;
  btcWithdrawnAmount: number;
  firstTxTimestamp?: number;
  lastTxTimestamp?: number;
  lastModifiedTimestamp?: number;
  firstTxDate: string;
  lastTxDate: string;
  lastModifiedDate: string;
}

interface UseExchangesTableColumnsProps {
  onViewExchange: (id: string) => void;
  onDeleteExchange: (id: string) => void;
}

const sortOptionalNumber = (a?: number, b?: number): number => {
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  return a - b;
};

export const useExchangesTableColumns = ({
  onViewExchange,
  onDeleteExchange,
}: UseExchangesTableColumnsProps): MRT_ColumnDef<ExchangesTableColumn>[] => {
  return [
    {
      accessorKey: "actions",
      header: "",
      size: 0,
      enableColumnActions: false,
      enableColumnFilter: false,
      enableColumnDragging: false,
      enableSorting: false,
      Cell: ({ row }) => {
        return (
          <div className="ExchangeTableActionCell">
            <IonButton
              fill="clear"
              className="ExchangeTableActionButton"
              onClick={() => onViewExchange(row.original.id)}
            >
              <IonIcon size="small" icon={eyeOutline}></IonIcon>
            </IonButton>
            <IonButton
              fill="clear"
              color="danger"
              className="ExchangeTableActionButton"
              onClick={() => onDeleteExchange(row.original.id)}
            >
              <IonIcon size="small" icon={trashOutline}></IonIcon>
            </IonButton>
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      size: 120,
    },
    {
      accessorKey: "txCount",
      header: "Txs",
      size: 120,
    },
    {
      accessorKey: "matchedCount",
      header: "Matched",
      size: 120,
    },
    {
      accessorKey: "btcPurchasedAmount",
      header: "BTC Flow",
      sortingFn: (rowA, rowB) => {
        const rowATotal =
          rowA.original.btcPurchasedAmount +
          rowA.original.btcDepositedAmount +
          rowA.original.btcWithdrawnAmount;
        const rowBTotal =
          rowB.original.btcPurchasedAmount +
          rowB.original.btcDepositedAmount +
          rowB.original.btcWithdrawnAmount;
        return rowATotal - rowBTotal;
      },
      size: 230,
      Cell: ({ row }) => (
        <div className="ExchangeBtcFlowCell">
          <span>Bought {BTCFormatter(row.original.btcPurchasedAmount)}</span>
          <span>Deposited {BTCFormatter(row.original.btcDepositedAmount)}</span>
          <span>Withdrawn {BTCFormatter(row.original.btcWithdrawnAmount)}</span>
        </div>
      ),
    },
    {
      accessorKey: "firstTxDate",
      header: "First Transaction",
      sortingFn: (rowA, rowB) =>
        sortOptionalNumber(
          rowA.original.firstTxTimestamp,
          rowB.original.firstTxTimestamp,
        ),
      size: 170,
    },
    {
      accessorKey: "lastTxDate",
      header: "Last Transaction",
      sortingFn: (rowA, rowB) =>
        sortOptionalNumber(
          rowA.original.lastTxTimestamp,
          rowB.original.lastTxTimestamp,
        ),
      size: 170,
    },
    {
      accessorKey: "lastModifiedDate",
      header: "Last Modification",
      sortingFn: (rowA, rowB) =>
        sortOptionalNumber(
          rowA.original.lastModifiedTimestamp,
          rowB.original.lastModifiedTimestamp,
        ),
      size: 160,
    },
  ];
};
