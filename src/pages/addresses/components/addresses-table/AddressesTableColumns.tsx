import { IonButton, IonIcon } from "@ionic/react";
import { copySharp, pencil, trash } from "ionicons/icons";
import { MRT_ColumnDef } from "material-react-table";
import {
  addressFormatter,
  BTCFormatter,
  USDFormatter,
} from "../../../../hooks/useFormatter";
import { sortFirstNumericElement } from "../../../../utils/tables";

export interface AddressesTableColumn {
  label: string;
  type: string;
  address: string;
  balance: number;
  currentPrice: number;
  txCount: number;
  firstTxIn: string;
  lastTxOut: string;
}

interface Props {
  onEditAddress: (address: string) => void;
  onDeleteAddress: (address: string) => Promise<void> | void;
  onCopyValueFromCell: (value: string) => void;
}

export function useAddressesTableColumns({
  onEditAddress,
  onDeleteAddress,
  onCopyValueFromCell,
}: Props) {
  const ADDRESSES_TABLE_COLUMNS: MRT_ColumnDef<AddressesTableColumn>[] = [
    {
      accessorKey: "actions",
      header: "",
      size: 0,
      enableColumnActions: false,
      enableColumnFilter: false,
      enableColumnDragging: false,
      enableSorting: false,
      Cell: (p) => {
        return (
          <div className="AddressTableActionCell">
            <IonButton
              className="AddressTableAcctionButton"
              fill="clear"
              onClick={() => onEditAddress(p.row.original.address)}
            >
              <IonIcon size="small" icon={pencil}></IonIcon>
            </IonButton>
            <IonButton
              className="AddressTableAcctionButton"
              fill="clear"
              color="danger"
              onClick={() => onDeleteAddress(p.row.original.address)}
            >
              <IonIcon size="small" icon={trash}></IonIcon>
            </IonButton>
          </div>
        );
      },
    },
    {
      accessorKey: "address",
      header: "Address",
      size: 0,
      Cell: (p) => {
        return (
          <div className="AddressTableCopyCell">
            <IonButton
              fill="clear"
              className="CopyCellButton"
              onClick={() => onCopyValueFromCell(String(p.renderedCellValue))}
            >
              <IonIcon size="small" icon={copySharp}></IonIcon>
            </IonButton>
            <div>{addressFormatter(String(p.renderedCellValue))}</div>
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
      accessorKey: "txCount",
      header: "Txs",
      size: 0,
    },
    {
      accessorKey: "balance",
      header: "Spendable Balance",
      size: 0,
      sortingFn: sortFirstNumericElement,
      Cell: (p) => {
        const value = p.cell.getValue<number>();
        return <span>{BTCFormatter(value)}</span>;
      },
    },
    {
      accessorKey: "currentPrice",
      header: "Current Price",
      sortingFn: sortFirstNumericElement,
      Cell: (p) => {
        const value = p.cell.getValue<number>();
        return <span>{USDFormatter(value)}</span>;
      },
    },
    {
      accessorKey: "firstTxIn",
      header: "First tx received",
      size: 162,
    },
    {
      accessorKey: "lastTxOut",
      header: "Last tx sent",
      size: 162,
    },
    {
      accessorKey: "type",
      header: "Type",
      size: 0,
    },
  ];

  return ADDRESSES_TABLE_COLUMNS;
}
