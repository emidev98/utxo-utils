import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ExchangeTxType, ParsedExchangeTx } from "../../models/ExchangeData";
import {
  buildFingerprint,
  IExchangeCSVParser,
  normalizeBitcoinAmount,
} from "./types";

dayjs.extend(utc);

/**
 * Required headers that uniquely identify a Coinbase transaction history CSV.
 *
 * Target export: Tax → Download → Individual CSV → All transactions
 * (also known as the "Transaction History" report)
 */
const REQUIRED_HEADERS = [
  "Timestamp",
  "Transaction Type",
  "Asset",
  "Quantity Transacted",
  "Notes",
];

/**
 * Coinbase `Transaction Type` values where the asset amount is outgoing
 * (the CSV always reports `Quantity Transacted` as a positive number, so we
 * must negate it based on the transaction type).
 */
const OUTGOING_TYPES = new Set([
  "Send",
  "Sell",
  "Advanced Trade Sell",
  "Convert",
]);

/**
 * Maps Coinbase `Transaction Type` to canonical ExchangeTxType.
 */
function mapCoinbaseType(txType: string): ExchangeTxType {
  switch (txType) {
    case "Buy":
    case "Advanced Trade Buy":
      return "buy";
    case "Sell":
    case "Advanced Trade Sell":
      return "sell";
    case "Send":
      return "withdrawal";
    case "Receive":
      return "deposit";
    case "Convert":
      return "buy"; // treated as a swap/buy of the target asset
    case "Rewards Income":
    case "Coinbase Earn":
    case "Learning Reward":
    case "Staking Income":
    case "Inflation Reward":
      return "reward";
    default:
      return "unknown";
  }
}

/**
 * Parser for Coinbase "All transactions" CSV exports.
 *
 * Expected header row:
 * Timestamp,Transaction Type,Asset,Quantity Transacted,Spot Price Currency,
 * Spot Price at Transaction,Subtotal,Total (inclusive of fees and/or spread),
 * Fees and/or Spread,Notes
 *
 * NOTES:
 * - `Quantity Transacted` is always positive; direction is inferred from type.
 * - `Total (inclusive of fees and/or spread)` is the fiat amount paid/received.
 * - The `Notes` field sometimes contains the on-chain address for Send transactions.
 *
 * How to export: Taxes → Tax center → Download CSV → All transactions
 */
export class CoinbaseParser implements IExchangeCSVParser {
  readonly id = "coinbase";
  readonly name = "Coinbase";

  detect(headers: string[]): boolean {
    return REQUIRED_HEADERS.every((h) => headers.includes(h));
  }

  parse(rows: Record<string, string>[]): ParsedExchangeTx[] {
    return rows
      .filter((row) => row["Timestamp"]?.trim() !== "")
      .map((row): ParsedExchangeTx => {
        const rawTimestamp = row["Timestamp"]?.trim() ?? "";
        // Coinbase timestamps are ISO 8601: "2022-01-01T00:00:00Z"
        const timestamp = dayjs.utc(rawTimestamp).unix();

        const txType = row["Transaction Type"]?.trim() ?? "";
        const type = mapCoinbaseType(txType);

        const quantityRaw = parseFloat(row["Quantity Transacted"] ?? "0");
        // Negate for outgoing transactions since Coinbase always exports positive qty
        const rawAmount = OUTGOING_TYPES.has(txType)
          ? -quantityRaw
          : quantityRaw;
        const currency = row["Asset"]?.trim() ?? "";
        const amount = normalizeBitcoinAmount(rawAmount, currency);

        const total = parseFloat(
          row["Total (inclusive of fees and/or spread)"] ?? "",
        );
        const fees = parseFloat(row["Fees and/or Spread"] ?? "");
        const spotPriceCurrency = row["Spot Price Currency"]?.trim();

        const notes = row["Notes"]?.trim();

        return {
          fingerprint: buildFingerprint(timestamp, amount, currency, type),
          timestamp,
          type,
          amount,
          currency,
          fiatAmount: isNaN(total) ? undefined : Math.abs(total),
          fiatCurrency: spotPriceCurrency || undefined,
          fee: isNaN(fees) ? undefined : fees,
          feeCurrency: spotPriceCurrency || undefined,
          description: notes || txType || undefined,
          rawData: row,
        };
      });
  }
}
