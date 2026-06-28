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
 * Required headers that uniquely identify an OKX Financial Records CSV export.
 *
 * Target export: Assets → Financial Records → Export
 * (the "Funding account bills" / "Financial records" report)
 */
const REQUIRED_HEADERS = ["Bill ID", "Time", "Type", "Currency", "Amount"];

/**
 * Maps OKX `Type` / `Sub-type` values to canonical ExchangeTxType.
 */
function mapOKXType(
  type: string,
  subType: string,
  amount: number,
): ExchangeTxType {
  const t = type.toLowerCase();
  const s = subType.toLowerCase();

  if (t.includes("deposit") || s.includes("deposit")) return "deposit";
  if (
    t.includes("withdrawal") ||
    t.includes("withdraw") ||
    s.includes("withdrawal")
  )
    return "withdrawal";

  // Trading: positive amount = received (buy), negative = sent (sell)
  if (t === "trade" || t === "trading") return amount >= 0 ? "buy" : "sell";

  if (
    t.includes("earn") ||
    t.includes("staking") ||
    t.includes("interest") ||
    t.includes("reward") ||
    t.includes("savings") ||
    s.includes("reward") ||
    s.includes("interest")
  )
    return "reward";

  if (t.includes("purchase") || t.includes("buy")) return "buy";
  if (t.includes("sell") || t.includes("redemption")) return "sell";

  return "unknown";
}

/**
 * Parser for OKX Financial Records CSV exports.
 *
 * Expected header row (newer format):
 * Bill ID,Time,Type,Sub-type,Currency,Amount,Fee,Balance
 *
 * The `Sub-type` column is optional in older exports.
 *
 * NOTES:
 * - OKX timestamps are in UTC+8; we treat them as UTC for simplicity since
 *   the offset is not encoded in the exported string.
 * - `Amount` is signed (negative = outflow).
 * - OKX does not include on-chain txids in this export.
 *
 * How to export: Assets → Financial Records → Export
 */
export class OKXParser implements IExchangeCSVParser {
  readonly id = "okx";
  readonly name = "OKX";

  detect(headers: string[]): boolean {
    return REQUIRED_HEADERS.every((h) => headers.includes(h));
  }

  parse(rows: Record<string, string>[]): ParsedExchangeTx[] {
    return rows
      .filter((row) => row["Time"]?.trim() !== "")
      .map((row): ParsedExchangeTx => {
        const rawTimestamp = row["Time"]?.trim() ?? "";
        // OKX timestamps can be ISO 8601 or "YYYY-MM-DD HH:mm:ss"
        const timestamp = dayjs.utc(rawTimestamp).unix();

        const rawAmount = parseFloat(row["Amount"] ?? "0");
        const currency = row["Currency"]?.trim() ?? "";
        const amount = normalizeBitcoinAmount(rawAmount, currency);
        const rawFee = parseFloat(row["Fee"] ?? "");
        const fee = normalizeBitcoinFee(rawFee, currency);

        const typeRaw = row["Type"]?.trim() ?? "";
        const subTypeRaw = row["Sub-type"]?.trim() ?? "";
        const type = mapOKXType(typeRaw, subTypeRaw, rawAmount);

        const billId = row["Bill ID"]?.trim();
        const description = [typeRaw, subTypeRaw].filter(Boolean).join(" – ");

        return {
          fingerprint: buildFingerprint(
            timestamp,
            amount,
            currency,
            type,
            billId,
          ),
          timestamp,
          type,
          amount,
          currency,
          fee,
          feeCurrency: currency,
          description: description || undefined,
          rawData: row,
        };
      });
  }
}
