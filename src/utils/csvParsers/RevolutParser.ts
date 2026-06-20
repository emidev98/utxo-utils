import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ExchangeTxType, ParsedExchangeTx } from "../../models/ExchangeData";
import { buildFingerprint, IExchangeCSVParser } from "./types";

dayjs.extend(utc);

/** Required headers that uniquely identify a Revolut CSV export */
const REQUIRED_HEADERS = ["Type", "Started Date", "Completed Date", "Currency"];

/**
 * Maps Revolut `Type` values to canonical ExchangeTxType.
 * Direction (buy vs sell) is refined by checking the Currency column.
 */
const TYPE_MAP: Record<string, ExchangeTxType> = {
  EXCHANGE: "buy", // refined below: if currency is not BTC → sell
  CRYPTO_WITHDRAWAL: "withdrawal",
  CRYPTO_DEPOSIT: "deposit",
  TRANSFER: "unknown",
  TOPUP: "deposit",
  CARD_PAYMENT: "sell",
  ATM: "unknown",
  REWARD: "reward",
  CASHBACK: "reward",
  REFUND: "unknown",
};

/**
 * Parser for Revolut CSV exports (crypto transactions).
 *
 * Expected header row:
 * Type,Product,Started Date,Completed Date,Description,Amount,Currency,
 * Fiat amount,Fiat amount (inc. fees),Fee,Base currency,State,Balance
 */
export class RevolutParser implements IExchangeCSVParser {
  readonly id = "revolut";
  readonly name = "Revolut";

  detect(headers: string[]): boolean {
    return REQUIRED_HEADERS.every((h) => headers.includes(h));
  }

  parse(rows: Record<string, string>[]): ParsedExchangeTx[] {
    return rows
      .filter(
        (row) =>
          row["Completed Date"]?.trim() !== "" &&
          // Skip non-completed rows
          (row["State"]?.trim().toUpperCase() === "COMPLETED" ||
            row["State"] === undefined),
      )
      .map((row): ParsedExchangeTx => {
        // Use Completed Date as the canonical timestamp
        const rawTimestamp = row["Completed Date"]?.trim() ?? "";
        const timestamp = dayjs.utc(rawTimestamp, "YYYY-M-D HH:mm:ss").unix();

        const amount = parseFloat(row["Amount"] ?? "0");
        const currency = row["Currency"]?.trim() ?? "";

        const fiatAmount = parseFloat(
          row["Fiat amount (inc. fees)"] ?? row["Fiat amount"] ?? "",
        );
        const fiatCurrency = row["Base currency"]?.trim();
        const fee = parseFloat(row["Fee"] ?? "");

        const typeRaw = row["Type"]?.trim().toUpperCase() ?? "";
        let type: ExchangeTxType = TYPE_MAP[typeRaw] ?? "unknown";

        // Refine EXCHANGE direction: if currency is BTC and amount > 0 → buy; < 0 → sell
        if (typeRaw === "EXCHANGE") {
          type = amount >= 0 ? "buy" : "sell";
        }

        const description = row["Description"]?.trim();

        return {
          fingerprint: buildFingerprint(timestamp, amount, currency, type),
          timestamp,
          type,
          amount,
          currency,
          fiatAmount: isNaN(fiatAmount) ? undefined : fiatAmount,
          fiatCurrency: fiatCurrency || undefined,
          fee: isNaN(fee) ? undefined : fee,
          feeCurrency: fiatCurrency || undefined,
          description: description || undefined,
          rawData: row,
        };
      });
  }
}
