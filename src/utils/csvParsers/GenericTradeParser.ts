import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import { FIAT_ASSETS_SYMBOLS } from "../../clients/frankfurter";
import { ExchangeTxType, ParsedExchangeTx } from "../../models/ExchangeData";
import {
  buildFingerprint,
  IExchangeCSVParser,
  normalizeBitcoinAmount,
} from "./types";

dayjs.extend(utc);
dayjs.extend(customParseFormat);

const REQUIRED_HEADERS = [
  "Symbol",
  "Type",
  "Quantity",
  "Price",
  "Value",
  "Fees",
  "Date",
];

const TIMESTAMP_FORMAT = "MMM DD, YYYY, hh:mm:ss A";

/**
 * Parser for simple trade exports with one asset row per buy/sell.
 *
 * Expected header row:
 * Symbol,Type,Quantity,Price,Value,Fees,Date
 */
export class GenericTradeParser implements IExchangeCSVParser {
  readonly id = "generic-trades";
  readonly name = "Generic trades";

  detect(headers: string[]): boolean {
    return REQUIRED_HEADERS.every((h) => headers.includes(h));
  }

  parse(rows: Record<string, string>[]): ParsedExchangeTx[] {
    return rows
      .filter((row) => row["Date"]?.trim() !== "")
      .map((row): ParsedExchangeTx => {
        const rawTimestamp = row["Date"]?.trim() ?? "";
        const timestamp = parseTimestamp(rawTimestamp);

        const currency = row["Symbol"]?.trim() ?? "";
        const type = normaliseType(row["Type"]?.trim() ?? "");
        const quantity = parseFloat(row["Quantity"] ?? "0");
        const signedQuantity = type === "sell" ? -quantity : quantity;
        const amount = normalizeBitcoinAmount(signedQuantity, currency);

        const value = parseMoney(row["Value"] ?? "");
        const fee = parseMoney(row["Fees"] ?? "");
        const price = row["Price"]?.trim();
        const description = price ? `Price: ${price}` : undefined;
        const fiatCurrency = value.currency ?? fee.currency;

        return {
          fingerprint: buildFingerprint(timestamp, amount, currency, type),
          timestamp,
          type,
          amount,
          currency,
          fiatAmount: value.amount,
          fiatCurrency,
          fee: fee.amount,
          feeCurrency: fee.currency ?? fiatCurrency,
          description,
          rawData: row,
        };
      });
  }
}

function parseTimestamp(raw: string): number {
  const normalized = raw.replace(/^([A-Za-z]{3}) (\d),/, "$1 0$2,");
  return dayjs.utc(normalized, TIMESTAMP_FORMAT).unix();
}

function normaliseType(raw: string): ExchangeTxType {
  const lower = raw.toLowerCase();
  if (lower.includes("buy")) return "buy";
  if (lower.includes("sell")) return "sell";
  return "unknown";
}

function parseMoney(raw: string): {
  amount?: number;
  currency?: string;
} {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return {};
  }

  const symbol = Object.keys(FIAT_ASSETS_SYMBOLS).find((s) =>
    trimmed.includes(s),
  );
  const amount = parseFloat(trimmed.replace(/[^\d.-]/g, ""));

  return {
    amount: isNaN(amount) ? undefined : amount,
    currency: symbol ? FIAT_ASSETS_SYMBOLS[symbol] : undefined,
  };
}
