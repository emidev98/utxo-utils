export type ExchangeTxType =
  | "buy"
  | "sell"
  | "reward"
  | "withdrawal"
  | "deposit"
  | "unknown";

export type MatchState = "hash_match" | "amount_date_match" | "unmatched";

export interface ExchangeTransaction {
  /** UUID assigned at import time */
  id: string;
  /**
   * Deterministic deduplication key.
   * - If txHash present: `"txhash:" + txHash`
   * - Otherwise: `"${timestamp}_${amount}_${currency}_${type}"`
   */
  fingerprint: string;
  exchangeId: string;
  /** Unix seconds (normalized from CSV UTC strings) */
  timestamp: number;
  type: ExchangeTxType;
  /** BTC float. Positive = received/bought, negative = sent/sold */
  amount: number;
  currency: string;
  fiatAmount?: number;
  fiatCurrency?: string;
  /** BTC fee amount */
  fee?: number;
  feeCurrency?: string;
  /** On-chain transaction id / hash, if provided by the exchange */
  txHash?: string;
  description?: string;
  /** Verbatim CSV row, kept for debugging and re-parsing */
  rawData: Record<string, string>;
  matchState: MatchState;
  /** Matched on-chain txid (populated by reconciliation) */
  matchedTxId?: string;
}

export interface ExchangeAccount {
  /** UUID auto-generated at creation */
  id: string;
  name: string;
  /** Unix seconds */
  createdAt: number;
  /** Unix seconds, updated after each CSV import */
  lastImportedAt?: number;
  transactions: ExchangeTransaction[];
}

/** Root storage shape, keyed by exchange UUID */
export type ExchangeStore = Record<string, ExchangeAccount>;

/**
 * User-defined mapping from CSV column names to canonical ExchangeTransaction fields.
 * Used by ManualMappingParser when no known parser is detected.
 */
export interface CSVColumnMapping {
  timestamp: string;
  /** Dayjs-compatible format string, e.g. "YYYY-MM-DD HH:mm:ss". Defaults to ISO 8601. */
  timestampFormat?: string;
  amount: string;
  currency: string;
  /**
   * Column whose values will be mapped to ExchangeTxType.
   * ManualMappingParser maps unrecognised values to "unknown".
   */
  type: string;
  txHash?: string;
  fiatAmount?: string;
  fiatCurrency?: string;
  fee?: string;
  feeCurrency?: string;
  description?: string;
}

/**
 * Normalised output produced by any parser before it becomes an ExchangeTransaction.
 * Excludes fields that are assigned post-parse (id, exchangeId, matchState, matchedTxId).
 */
export interface ParsedExchangeTx {
  fingerprint: string;
  timestamp: number;
  type: ExchangeTxType;
  amount: number;
  currency: string;
  fiatAmount?: number;
  fiatCurrency?: string;
  fee?: number;
  feeCurrency?: string;
  txHash?: string;
  description?: string;
  rawData: Record<string, string>;
}
