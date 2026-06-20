import { ExchangeTxType, ParsedExchangeTx } from "../../models/ExchangeData";

/**
 * Contract that every exchange CSV parser must implement.
 * Adding support for a new exchange requires only creating a class that
 * satisfies this interface and registering it in csvParsers/index.ts.
 */
export interface IExchangeCSVParser {
  /** Stable identifier for the parser, e.g. "crypto.com" */
  readonly id: string;
  /** Human-readable name shown in the UI */
  readonly name: string;
  /**
   * Returns true when the given header row looks like it belongs to this
   * exchange's CSV export format.  Called before parse() to enable
   * optimistic auto-detection.
   */
  detect(headers: string[]): boolean;
  /**
   * Converts an array of raw CSV rows (each a header→value map) into the
   * canonical ParsedExchangeTx shape.
   * @param rows  Each element maps column header → cell value.
   */
  parse(rows: Record<string, string>[]): ParsedExchangeTx[];
}

/**
 * Builds the deterministic fingerprint used for deduplication.
 * - If a txHash is present the hash is the canonical identity.
 * - Otherwise we fall back to a composite of stable fields.
 */
export function buildFingerprint(
  timestamp: number,
  amount: number,
  currency: string,
  type: ExchangeTxType,
  txHash?: string,
): string {
  if (txHash && txHash.trim() !== "") {
    return `txhash:${txHash.trim()}`;
  }
  return `${timestamp}_${amount}_${currency}_${type}`;
}
