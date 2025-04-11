import dayjs, { Dayjs } from "dayjs";

export class BitcoinHistoricalData {
  constructor(
    public date: Dayjs,
    public price: number,
  ) {}

  static fromEntryFileValue(val: string) {
    const DATE_INDEX_LENGTH = 8;

    const dateString = val.substring(0, DATE_INDEX_LENGTH);
    const integer = val.substring(DATE_INDEX_LENGTH, val.length - 2);
    const decimal = val.substring(DATE_INDEX_LENGTH + integer.length);

    return new BitcoinHistoricalData(
      dayjs(dateString, "YYYYMMDD"),
      parseFloat(integer + "." + decimal),
    );
  }
}
