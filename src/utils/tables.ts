import { Row, RowData } from "@tanstack/table-core";

export function sortFirstNumericElement<T extends RowData>(
  rowA: Row<T>,
  rowB: Row<T>,
  columnId: string,
): number {
  let rowValue = rowA.getValue(columnId)?.toString();
  if (rowValue === undefined) {
    return 0;
  }
  let row2Value = rowB.getValue(columnId)?.toString();
  if (row2Value === undefined) {
    return 0;
  }
  rowValue = rowValue.split(" ")[0];
  row2Value = row2Value.split(" ")[0];
  return parseFloat(rowValue) - parseFloat(row2Value);
}
