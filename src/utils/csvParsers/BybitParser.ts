import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ExchangeTxType, ParsedExchangeTx } from "../../models/ExchangeData";
import { buildFingerprint, IExchangeCSVParser } from "./types";

dayjs.extend(utc);

/**
 * Required headers that uniquely identify a Bybit Transaction Records CSV export.
 *
 * Target export: Assets → Transaction History → Export
 * (the "Funding wallet" or "Spot" account statement)
 */
const REQUIRED_HEADERS = [
  "Date(UTC)",
  "Type",
  "Asset",
  "Amount",
  "Transaction ID",
];

/**
 * Maps Bybit `Type` values to canonical ExchangeTxType.
 */
const TYPE_MAP: Record<string, ExchangeTxType> = {
  // Deposits / withdrawals
  Deposit: "deposit",
  Withdraw: "withdrawal",
  Withdrawal: "withdrawal",
  // Spot trading
  Buy: "buy",
  Sell: "sell",
  Trade: "buy", // refined below by amount sign
  // Transfers between wallets (internal)
  Transfer: "unknown",
  "Internal Transfer": "unknown",
  // Earn / rewards
  Earn: "reward",
  Reward: "reward",
  Interest: "reward",
  "Staking reward": "reward",
  Cashback: "reward",
  // Fees
  Fee: "unknown",
  // Airdrop
  Airdrop: "reward",
};

/**
 * Parser for Bybit Transaction Records CSV exports.
 *
 * Expected header row:
 * Date(UTC),Type,Asset,Amount,Fee,Transaction ID
 *
 * NOTES:
 * - `Amount` is signed (negative = outflow).
 * - `Transaction ID` is the on-chain txid for deposits and withdrawals;
 *   for spot trades it is the Bybit internal order ID.
 * - For "Trade" type rows, direction is inferred from the sign of `Amount`.
 * - Bybit may export timestamps in UTC or UTC+8 depending on account settings;
 *   this parser treats the value as UTC.
 *
 * How to export: Assets → Transaction History → Export (select Funding account)
 */
export class BybitParser implements IExchangeCSVParser {
  readonly id = "bybit";
  readonly name = "Bybit";

  detect(headers: string[]): boolean {
    return REQUIRED_HEADERS.every((h) => headers.includes(h));
  }

  parse(rows: Record<string, string>[]): ParsedExchangeTx[] {
    return rows
      .filter((row) => row["Date(UTC)"]?.trim() !== "")
      .map((row): ParsedExchangeTx => {
        const rawTimestamp = row["Date(UTC)"]?.trim() ?? "";
        // Bybit format: "2022-01-01 00:00:00" (UTC)
        const timestamp = dayjs.utc(rawTimestamp, "YYYY-MM-DD HH:mm:ss").unix();

        const amount = parseFloat(row["Amount"] ?? "0");
        const currency = row["Asset"]?.trim() ?? "";
        const fee = parseFloat(row["Fee"] ?? "");

        const typeRaw = row["Type"]?.trim() ?? "";
        let type: ExchangeTxType = TYPE_MAP[typeRaw] ?? "unknown";

        // Refine "Trade" type based on amount sign
        if (typeRaw === "Trade") {
          type = amount >= 0 ? "buy" : "sell";
        }

        const txId = row["Transaction ID"]?.trim();
        const remark = row["Remark"]?.trim();

        // Only treat the txId as an on-chain hash for deposit/withdrawal rows
        const isOnChain = type === "deposit" || type === "withdrawal";

        return {
          fingerprint: buildFingerprint(
            timestamp,
            amount,
            currency,
            type,
            isOnChain ? txId : undefined,
          ),
          timestamp,
          type,
          amount,
          currency,
          fee: isNaN(fee) ? undefined : fee,
          feeCurrency: currency,
          txHash: isOnChain && txId ? txId : undefined,
          description: remark || typeRaw || undefined,
          rawData: row,
        };
      });
  }
}
