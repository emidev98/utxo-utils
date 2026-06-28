import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ExchangeTxType, ParsedExchangeTx } from "../../models/ExchangeData";
import {
  buildFingerprint,
  IExchangeCSVParser,
  normalizeBitcoinAmount,
} from "./types";

dayjs.extend(utc);

/** Required headers that uniquely identify a Crypto.com CSV export */
const REQUIRED_HEADERS = ["Timestamp (UTC)", "Transaction Kind", "Currency"];

/**
 * Maps Crypto.com `Transaction Kind` values to canonical ExchangeTxType.
 * Extend this map as more transaction kinds are encountered.
 */
const KIND_MAP: Record<string, ExchangeTxType> = {
  crypto_withdrawal: "withdrawal",
  crypto_deposit: "deposit",
  viban_purchase: "buy",
  crypto_purchase: "buy",
  crypto_exchange: "buy",
  crypto_earn_interest_paid: "reward",
  crypto_earn_program_created: "reward",
  crypto_earn_program_withdrawn: "withdrawal",
  card_cashback_reverted: "unknown",
  card_cashback: "reward",
  referral_card_cashback: "reward",
  reimbursement: "reward",
  crypto_to_exchange_transfer: "deposit",
  exchange_to_crypto_transfer: "withdrawal",
  supercharger_deposit: "deposit",
  supercharger_withdrawal: "withdrawal",
  supercharger_reward_to_app_credited: "reward",
  dust_conversion_credited: "buy",
  dust_conversion_debited: "sell",
  crypto_wallet_swap_credited: "buy",
  crypto_wallet_swap_debited: "sell",
};

/**
 * Parser for Crypto.com App CSV exports.
 *
 * Expected header row:
 * Timestamp (UTC),Transaction Description,Currency,Amount,To Currency,
 * To Amount,Native Currency,Native Amount,Native Amount (in USD),
 * Transaction Kind,Transaction Hash
 */
export class CryptoComParser implements IExchangeCSVParser {
  readonly id = "crypto.com";
  readonly name = "Crypto.com";

  detect(headers: string[]): boolean {
    return REQUIRED_HEADERS.every((h) => headers.includes(h));
  }

  parse(rows: Record<string, string>[]): ParsedExchangeTx[] {
    return rows
      .filter((row) => row["Timestamp (UTC)"]?.trim() !== "")
      .map((row): ParsedExchangeTx => {
        const rawTimestamp = row["Timestamp (UTC)"]?.trim() ?? "";
        const timestamp = dayjs.utc(rawTimestamp, "YYYY-MM-DD HH:mm:ss").unix();

        const rawAmount = parseFloat(row["Amount"] ?? "0");
        const currency = row["Currency"]?.trim() ?? "";

        // For viban_purchase the bought currency/amount is in To Currency/To Amount
        const toCurrency = row["To Currency"]?.trim();
        const toAmount = parseFloat(row["To Amount"] ?? "0");
        const isBuyWithFiat =
          toCurrency === "BTC" && !isNaN(toAmount) && toAmount !== 0;

        const rawEffectiveAmount = isBuyWithFiat ? toAmount : rawAmount;
        const effectiveCurrency = isBuyWithFiat ? toCurrency : currency;
        const amount = normalizeBitcoinAmount(
          rawEffectiveAmount,
          effectiveCurrency,
        );

        const fiatAmount = parseFloat(row["Native Amount (in USD)"] ?? "");
        const fiatCurrency = row["Native Currency"]?.trim();

        const kindRaw = row["Transaction Kind"]?.trim() ?? "";
        const type: ExchangeTxType = KIND_MAP[kindRaw] ?? "unknown";

        const txHash = row["Transaction Hash"]?.trim();
        const description = row["Transaction Description"]?.trim();

        return {
          fingerprint: buildFingerprint(
            timestamp,
            amount,
            effectiveCurrency,
            type,
            txHash,
          ),
          timestamp,
          type,
          amount,
          currency: effectiveCurrency,
          fiatAmount: isNaN(fiatAmount) ? undefined : fiatAmount,
          fiatCurrency: fiatCurrency || undefined,
          txHash: txHash || undefined,
          description: description || undefined,
          rawData: row,
        };
      });
  }
}
