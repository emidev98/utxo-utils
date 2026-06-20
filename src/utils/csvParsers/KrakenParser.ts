import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ExchangeTxType, ParsedExchangeTx } from "../../models/ExchangeData";
import { buildFingerprint, IExchangeCSVParser } from "./types";

dayjs.extend(utc);

/**
 * Required headers that uniquely identify a Kraken Ledgers CSV export.
 *
 * Target export: History → Export → Ledgers (not Trades)
 */
const REQUIRED_HEADERS = [
  "txid",
  "refid",
  "time",
  "type",
  "aclass",
  "asset",
  "amount",
  "fee",
];

/**
 * Maps Kraken `type` + optional `subtype` to canonical ExchangeTxType.
 */
function mapKrakenType(
  type: string,
  subtype: string,
  amount: number,
): ExchangeTxType {
  switch (type.toLowerCase()) {
    case "trade":
    case "margin trade":
      return amount >= 0 ? "buy" : "sell";
    case "deposit":
    case "receive":
      return "deposit";
    case "withdrawal":
    case "spend":
      return "withdrawal";
    case "earn":
    case "staking": {
      const sub = subtype.toLowerCase();
      if (sub === "reward") return "reward";
      if (
        sub === "allocation" ||
        sub === "autoallocate" ||
        sub === "spottostaking"
      )
        return "deposit";
      if (sub === "deallocation" || sub === "stakingfromspot")
        return "withdrawal";
      return "reward";
    }
    case "transfer":
      return "unknown";
    case "rollover":
      return "unknown";
    default:
      return "unknown";
  }
}

/**
 * Normalises Kraken's internal asset codes to standard ticker symbols.
 * Kraken prefixes fiat with "Z" and some crypto with "X".
 */
function normaliseKrakenAsset(asset: string): string {
  const MAP: Record<string, string> = {
    XXBT: "BTC",
    XBT: "BTC",
    XETH: "ETH",
    XLTC: "LTC",
    XXRP: "XRP",
    XXLM: "XLM",
    XXDG: "DOGE",
    ZUSD: "USD",
    ZEUR: "EUR",
    ZGBP: "GBP",
    ZCAD: "CAD",
    ZJPY: "JPY",
  };
  return MAP[asset] ?? asset;
}

/**
 * Parser for Kraken Ledgers CSV exports.
 *
 * Expected header row:
 * "txid","refid","time","type","subtype","aclass","asset","amount","fee","balance"
 *
 * IMPORTANT: The `txid` field is Kraken's internal ledger ID, NOT an on-chain
 * transaction hash. On-chain withdrawal TXIDs are not included in this export.
 *
 * How to export: History → Export → Select "Ledgers" → Export
 */
export class KrakenParser implements IExchangeCSVParser {
  readonly id = "kraken";
  readonly name = "Kraken";

  detect(headers: string[]): boolean {
    return REQUIRED_HEADERS.every((h) => headers.includes(h));
  }

  parse(rows: Record<string, string>[]): ParsedExchangeTx[] {
    return rows
      .filter((row) => row["time"]?.trim() !== "")
      .map((row): ParsedExchangeTx => {
        const rawTimestamp = row["time"]?.trim() ?? "";
        const timestamp = dayjs.utc(rawTimestamp, "YYYY-MM-DD HH:mm:ss").unix();

        const amount = parseFloat(row["amount"] ?? "0");
        const rawAsset = row["asset"]?.trim() ?? "";
        const currency = normaliseKrakenAsset(rawAsset);
        const fee = parseFloat(row["fee"] ?? "");

        const typeRaw = row["type"]?.trim() ?? "";
        const subtype = row["subtype"]?.trim() ?? "";
        const type = mapKrakenType(typeRaw, subtype, amount);

        const description = [typeRaw, subtype].filter(Boolean).join(" – ");

        return {
          fingerprint: buildFingerprint(timestamp, amount, currency, type),
          timestamp,
          type,
          amount,
          currency,
          fee: isNaN(fee) ? undefined : fee,
          feeCurrency: currency,
          description: description || undefined,
          rawData: row,
        };
      });
  }
}
