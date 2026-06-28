import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ExchangeTxType, ParsedExchangeTx } from "../../models/ExchangeData";
import {
  buildFingerprint,
  IExchangeCSVParser,
  normalizeBitcoinAmount,
  normalizeBitcoinFee,
} from "./types";

dayjs.extend(utc);

/**
 * Required headers that uniquely identify a Bitget Bills/Flow Records CSV export.
 *
 * Target export: Assets → Bill Records → Export
 */
const REQUIRED_HEADERS = [
  "Time",
  "Currency",
  "Type",
  "Amount",
  "TransactionId",
];

/**
 * Maps Bitget `Type` values to canonical ExchangeTxType.
 */
const TYPE_MAP: Record<string, ExchangeTxType> = {
  Deposit: "deposit",
  Withdraw: "withdrawal",
  Withdrawal: "withdrawal",
  Buy: "buy",
  Sell: "sell",
  // Spot trading fee entries
  Fee: "unknown",
  // Earn / rewards
  Earn: "reward",
  Interest: "reward",
  Cashback: "reward",
  Reward: "reward",
  "Staking reward": "reward",
  // Savings / flexible earn
  Savings: "deposit",
  "Savings redemption": "withdrawal",
  // P2P
  "P2P purchase": "buy",
  "P2P sell": "sell",
};

/**
 * Parser for Bitget Bill Records CSV exports.
 *
 * Expected header row:
 * Time,Currency,Type,Amount,Fee,TransactionId,Note,Status
 *
 * NOTES:
 * - `Amount` is signed (negative = outflow).
 * - `TransactionId` contains the on-chain txid for deposits and withdrawals.
 * - Bitget timestamps are typically UTC+8; we treat them as UTC for simplicity.
 * - Only rows with Status = "Successful" (or no Status column) are processed.
 *
 * How to export: Assets → Bill Records → Export
 */
export class BitgetParser implements IExchangeCSVParser {
  readonly id = "bitget";
  readonly name = "Bitget";

  detect(headers: string[]): boolean {
    return REQUIRED_HEADERS.every((h) => headers.includes(h));
  }

  parse(rows: Record<string, string>[]): ParsedExchangeTx[] {
    return rows
      .filter(
        (row) =>
          row["Time"]?.trim() !== "" &&
          // Skip failed/cancelled transactions when Status column is present
          (row["Status"] === undefined ||
            row["Status"]?.trim().toLowerCase() === "successful" ||
            row["Status"]?.trim().toLowerCase() === "success"),
      )
      .map((row): ParsedExchangeTx => {
        const rawTimestamp = row["Time"]?.trim() ?? "";
        const timestamp = dayjs.utc(rawTimestamp).unix();

        const rawAmount = parseFloat(row["Amount"] ?? "0");
        const currency = row["Currency"]?.trim() ?? "";
        const amount = normalizeBitcoinAmount(rawAmount, currency);
        const rawFee = parseFloat(row["Fee"] ?? "");
        const fee = normalizeBitcoinFee(rawFee, currency);

        const typeRaw = row["Type"]?.trim() ?? "";
        const type: ExchangeTxType = TYPE_MAP[typeRaw] ?? "unknown";

        const txId = row["TransactionId"]?.trim();
        const note = row["Note"]?.trim();

        return {
          fingerprint: buildFingerprint(
            timestamp,
            amount,
            currency,
            type,
            txId,
          ),
          timestamp,
          type,
          amount,
          currency,
          fee,
          feeCurrency: currency,
          txHash: txId || undefined,
          description: note || typeRaw || undefined,
          rawData: row,
        };
      });
  }
}
