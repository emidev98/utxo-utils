import dayjs, { Dayjs } from "dayjs";

export class BitcoinHistoricalData {
  constructor(
    public date: Dayjs,
    public price: Number,
  ) {}

  static fromEntryFileValue(val: string) {
    const DATE_INDEX_LENGTH = 8;

    const dateString = val.substring(0, DATE_INDEX_LENGTH);
    const integer = val.substring(DATE_INDEX_LENGTH, val.length - 2);
    const decimal = val.substring(
      DATE_INDEX_LENGTH + dateString.length + integer.length,
    );

    return new BitcoinHistoricalData(
      dayjs(dateString, "YYYYMMDD"),
      Number(integer + "." + decimal),
    );
  }
}
