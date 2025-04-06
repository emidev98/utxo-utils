import { Row, RowData } from "@tanstack/table-core";

export function sortFirstNumericElement<T extends RowData>(
  rowA: Row<T>,
  rowB: Row<T>,
  columnId: string,
): number {
  let rowValue: string = (rowA.getValue(columnId) as string).split(" ")[0];
  let row2Value: string = (rowB.getValue(columnId) as string).split(" ")[0];

  return parseFloat(rowValue) - parseFloat(row2Value);
}
