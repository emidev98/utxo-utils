import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import {
  CSVColumnMapping,
  ExchangeTxType,
  ParsedExchangeTx,
} from "../../models/ExchangeData";
import { buildFingerprint, IExchangeCSVParser } from "./types";

dayjs.extend(utc);
dayjs.extend(customParseFormat);

/**
 * Parser for any CSV format using a user-defined column mapping.
 * This parser is never auto-detected; it is constructed explicitly when
 * no known parser matches the uploaded file's headers.
 */
export class ManualMappingParser implements IExchangeCSVParser {
  readonly id = "manual";
  readonly name = "Manual mapping";

  constructor(private readonly mapping: CSVColumnMapping) {}

  /** Manual parsers are never auto-detected. */
  detect(): boolean {
    return false;
  }

  parse(rows: Record<string, string>[]): ParsedExchangeTx[] {
    const m = this.mapping;

    return rows
      .filter((row) => row[m.timestamp]?.trim() !== "")
      .map((row): ParsedExchangeTx => {
        const rawTimestamp = row[m.timestamp]?.trim() ?? "";
        const timestamp = m.timestampFormat
          ? dayjs.utc(rawTimestamp, m.timestampFormat).unix()
          : dayjs.utc(rawTimestamp).unix();

        const amount = parseFloat(row[m.amount] ?? "0");
        const currency = row[m.currency]?.trim() ?? "";

        const typeRaw = m.type ? (row[m.type]?.trim() ?? "") : "";
        const type = normaliseType(typeRaw);

        const fiatAmount = m.fiatAmount
          ? parseFloat(row[m.fiatAmount] ?? "")
          : undefined;
        const fiatCurrency = m.fiatCurrency
          ? row[m.fiatCurrency]?.trim()
          : undefined;
        const fee = m.fee ? parseFloat(row[m.fee] ?? "") : undefined;
        const feeCurrency = m.feeCurrency
          ? row[m.feeCurrency]?.trim()
          : undefined;
        const txHash = m.txHash ? row[m.txHash]?.trim() : undefined;
        const description = m.description
          ? row[m.description]?.trim()
          : undefined;

        return {
          fingerprint: buildFingerprint(
            timestamp,
            amount,
            currency,
            type,
            txHash,
          ),
          timestamp,
          type,
          amount,
          currency,
          fiatAmount:
            fiatAmount !== undefined && !isNaN(fiatAmount)
              ? fiatAmount
              : undefined,
          fiatCurrency: fiatCurrency || undefined,
          fee: fee !== undefined && !isNaN(fee) ? fee : undefined,
          feeCurrency: feeCurrency || undefined,
          txHash: txHash || undefined,
          description: description || undefined,
          rawData: row,
        };
      });
  }
}

/**
 * Tries to coerce a raw string value from a user-defined type column into
 * a canonical ExchangeTxType.  Falls back to "unknown".
 */
function normaliseType(raw: string): ExchangeTxType {
  const lower = raw.toLowerCase();
  if (lower.includes("buy") || lower.includes("purchase")) return "buy";
  if (lower.includes("sell")) return "sell";
  if (
    lower.includes("reward") ||
    lower.includes("earn") ||
    lower.includes("cashback")
  )
    return "reward";
  if (lower.includes("withdraw")) return "withdrawal";
  if (lower.includes("deposit") || lower.includes("topup")) return "deposit";
  return "unknown";
}
