import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { TransactionsStorage } from "../hooks/useTxs";
import {
  ExchangeAccount,
  ExchangeTransaction,
  MatchState,
} from "../models/ExchangeData";
import { Transaction } from "../models/MempoolAddressTxs";
import { isBitcoinCurrency } from "./csvParsers/types";

dayjs.extend(utc);

interface MatchedEntry {
  tx: Transaction;
  address: string;
}

export interface OnChainIndex {
  /** txid → on-chain transaction */
  byTxId: Map<string, MatchedEntry>;
  /**
   * "${satoshis}_${YYYYMMDD}" → array of on-chain transactions whose any vout
   * or vin carries that amount on that day.  Allows amount+date matching even
   * when exact amounts differ by fees.
   */
  byAmountAndDate: Map<string, MatchedEntry[]>;
}

export interface MatchResult {
  matchState: MatchState;
  matchedTxId?: string;
}

/**
 * Tolerance used for amount-based matching (Tier 2).
 * Exchange-reported amounts may differ from on-chain vout values by the
 * withdrawal fee charged by the exchange.  ±5000 satoshis ≈ ±$5 at $100k/BTC.
 */
const AMOUNT_TOLERANCE_SATS = 5000;

/**
 * Builds two indices from the stored on-chain transaction data:
 * 1. byTxId — O(1) lookup for Tier-1 hash matching.
 * 2. byAmountAndDate — Tier-2 amount+date lookup, one entry per vout value.
 */
export function buildOnChainIndex(txStore: TransactionsStorage): OnChainIndex {
  const byTxId = new Map<string, MatchedEntry>();
  const byAmountAndDate = new Map<string, MatchedEntry[]>();

  for (const [address, txs] of Object.entries(txStore)) {
    if (!txs) continue;
    for (const tx of txs) {
      const entry: MatchedEntry = { tx, address };

      byTxId.set(tx.txid, entry);

      const dateKey = dayjs.unix(tx.status.block_time).utc().format("YYYYMMDD");

      // Index every vout value (amounts the transaction paid out)
      for (const vout of tx.vout) {
        const key = `${vout.value}_${dateKey}`;
        const bucket = byAmountAndDate.get(key) ?? [];
        bucket.push(entry);
        byAmountAndDate.set(key, bucket);
      }

      // Also index vin prevout values (amounts the transaction consumed)
      for (const vin of tx.vin) {
        if (vin.prevout?.value) {
          const key = `${vin.prevout.value}_${dateKey}`;
          const bucket = byAmountAndDate.get(key) ?? [];
          bucket.push(entry);
          byAmountAndDate.set(key, bucket);
        }
      }
    }
  }

  return { byTxId, byAmountAndDate };
}

/**
 * Attempts to match a single exchange transaction against the on-chain index
 * using the three-tier strategy:
 *
 * Tier 1 — Transaction hash: exact, 100% confidence.
 * Tier 2 — Amount + date: approximate, subject to fee tolerance.
 * Tier 3 — Unmatched: exchange-only transaction; on-chain data may not be synced.
 */
export function matchExchangeTx(
  tx: ExchangeTransaction,
  index: OnChainIndex,
): MatchResult {
  // Tier 1: hash match
  if (tx.txHash) {
    const hit = index.byTxId.get(tx.txHash);
    if (hit) {
      return { matchState: "hash_match", matchedTxId: hit.tx.txid };
    }
  }

  // Tier 2: amount + date match
  if (!isBitcoinCurrency(tx.currency)) {
    return { matchState: "unmatched" };
  }

  const amountSats = Math.abs(tx.amount);
  const dateKey = dayjs.unix(tx.timestamp).utc().format("YYYYMMDD");

  // Try exact amount first, then sweep tolerance window
  for (let delta = 0; delta <= AMOUNT_TOLERANCE_SATS; delta += 1000) {
    for (const candidateSats of [amountSats - delta, amountSats + delta]) {
      if (candidateSats < 0) continue;
      const key = `${candidateSats}_${dateKey}`;
      const hits = index.byAmountAndDate.get(key);
      if (hits && hits.length > 0) {
        return {
          matchState: "amount_date_match",
          matchedTxId: hits[0].tx.txid,
        };
      }
    }
    if (delta === 0) continue; // avoid duplicate check at delta=0
  }

  return { matchState: "unmatched" };
}

/**
 * Runs reconciliation for all transactions in an exchange account and returns
 * an updated copy with matchState and matchedTxId populated.
 * Does not mutate the input object.
 */
export function reconcileExchange(
  account: ExchangeAccount,
  txStore: TransactionsStorage,
): ExchangeAccount {
  const index = buildOnChainIndex(txStore);

  const updatedTransactions = account.transactions.map((tx) => {
    const result = matchExchangeTx(tx, index);
    return {
      ...tx,
      matchState: result.matchState,
      matchedTxId: result.matchedTxId,
    };
  });

  return { ...account, transactions: updatedTransactions };
}
