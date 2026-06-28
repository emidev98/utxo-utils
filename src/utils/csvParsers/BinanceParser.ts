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
 * Required headers that uniquely identify a Binance "Statement" CSV export.
 *
 * Target export: Account → Transaction History → Generate all statements
 * (produces a file with headers below).
 */
const REQUIRED_HEADERS = ["UTC_Time", "Account", "Operation", "Coin", "Change"];

/**
 * Maps Binance `Operation` values to canonical ExchangeTxType.
 * Binance uses a large number of operation names; extend this map as needed.
 */
const OPERATION_MAP: Record<string, ExchangeTxType> = {
  // Spot trades
  Buy: "buy",
  Sell: "sell",
  Transaction_Buy: "buy",
  Transaction_Sell: "sell",
  Transaction_Fee: "unknown",
  Fee: "unknown",
  // Fiat gateway
  Fiat_Deposit: "deposit",
  Fiat_Withdrawal: "withdrawal",
  // On-chain transfers
  Deposit: "deposit",
  Withdraw: "withdrawal",
  Crypto_Withdrawal: "withdrawal",
  Crypto_Deposit: "deposit",
  // Rewards / income
  "Commission History": "reward",
  "Referral Kickback": "reward",
  Distribution: "reward",
  "Airdrop Assets": "reward",
  "Launchpool Earnings / Airdrop": "reward",
  "Simple Earn Flexible Interest": "reward",
  "Simple Earn Locked Rewards": "reward",
  "ETH 2.0 Staking Rewards": "reward",
  "Savings Interest": "reward",
  "POS savings interest": "reward",
  "Liquid Swap rewards": "reward",
  Interest: "reward",
  Cashback: "reward",
  // Earn / savings
  "Simple Earn Flexible Subscription": "deposit",
  "Simple Earn Flexible Redemption": "withdrawal",
  "Simple Earn Locked Subscription": "deposit",
  "Simple Earn Locked Redemption": "withdrawal",
  "POS savings purchase": "deposit",
  "POS savings redemption": "withdrawal",
  "Savings purchase": "deposit",
  "Savings Principal redemption": "withdrawal",
  // Conversions
  "Small assets exchange BNB": "sell",
  Convert: "unknown",
  "ETH 2.0 Staking": "deposit",
  // Misc
  "Large OTC trading": "unknown",
  "Binance Payment": "sell",
  Transfer: "unknown",
};

/**
 * Parser for Binance Statement CSV exports.
 *
 * Expected header row:
 * User_ID,UTC_Time,Account,Operation,Coin,Change,Remark
 *
 * How to export: Binance → Wallets → Transaction History → Generate all statements
 */
export class BinanceParser implements IExchangeCSVParser {
  readonly id = "binance";
  readonly name = "Binance";

  detect(headers: string[]): boolean {
    return REQUIRED_HEADERS.every((h) => headers.includes(h));
  }

  parse(rows: Record<string, string>[]): ParsedExchangeTx[] {
    return rows
      .filter((row) => row["UTC_Time"]?.trim() !== "")
      .map((row): ParsedExchangeTx => {
        const rawTimestamp = row["UTC_Time"]?.trim() ?? "";
        const timestamp = dayjs.utc(rawTimestamp, "YYYY-MM-DD HH:mm:ss").unix();

        // `Change` is a signed decimal (e.g., "+0.001" or "-0.001")
        const changeRaw = row["Change"]?.trim().replace(/\+/, "") ?? "0";
        const rawAmount = parseFloat(changeRaw);
        const currency = row["Coin"]?.trim() ?? "";
        const amount = normalizeBitcoinAmount(rawAmount, currency);

        const operationRaw = row["Operation"]?.trim() ?? "";
        const type: ExchangeTxType = OPERATION_MAP[operationRaw] ?? "unknown";

        const remark = row["Remark"]?.trim();

        return {
          fingerprint: buildFingerprint(timestamp, amount, currency, type),
          timestamp,
          type,
          amount,
          currency,
          description: remark || operationRaw || undefined,
          rawData: row,
        };
      });
  }
}
