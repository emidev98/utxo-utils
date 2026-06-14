import { IonIcon } from "@ionic/react";
import dayjs from "dayjs";
import {
  arrowDown,
  arrowDownOutline,
  arrowUp,
  arrowUpOutline,
} from "ionicons/icons";
import { MRT_ColumnDef } from "material-react-table";
import { SATSFormatter, USDFormatter } from "../../../../hooks/useFormatter";
import { sortFirstNumericElement } from "../../../../utils/tables";

export interface UtxosTableColumn {
  addressLabel?: string;
  value: number;
  blockTime: number;
  receivingPrice: number;
  currentPrice: number;
  profitAndLoss: number;
}

export const UTXOS_TABLE_COLUMNS: MRT_ColumnDef<UtxosTableColumn>[] = [
  {
    accessorKey: "addressLabel",
    header: "Address Label",
  },
  {
    accessorKey: "value",
    header: "Value",
    sortingFn: sortFirstNumericElement,
    Cell: (p) => {
      const value = p.cell.getValue<number>();
      return <span>{SATSFormatter(value)} </span>;
    },
  },
  {
    accessorKey: "receivingPrice",
    header: "Reciving Price",
    Cell: (p) => {
      const historicalPrice = p.cell.getValue<number>();
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
    Cell: (p) => {
      const value = p.cell.getValue<number>();
      return <span>{USDFormatter(value)} </span>;
    },
  },
  {
    accessorKey: "profitAndLoss",
    header: "P&L",
    sortingFn: sortFirstNumericElement,
    Cell: (p) => {
      const value = p.cell.getValue<number>();
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
    Cell: (p) => {
      const blockTime = p.cell.getValue<number>();
      return <span>{dayjs(blockTime).format("YYYY-MM-DD HH:mm:ss")} </span>;
    },
  },
];
