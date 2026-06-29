import { BinanceParser } from "./BinanceParser";
import { BitgetParser } from "./BitgetParser";
import { BybitParser } from "./BybitParser";
import { CoinbaseParser } from "./CoinbaseParser";
import { CryptoComParser } from "./CryptoComParser";
import { GenericTradeParser } from "./GenericTradeParser";
import { KrakenParser } from "./KrakenParser";
import { OKXParser } from "./OKXParser";
import { RevolutParser } from "./RevolutParser";
import { IExchangeCSVParser } from "./types";

export { ManualMappingParser } from "./ManualMappingParser";
export { isBitcoinCurrency } from "./types";
export type { IExchangeCSVParser } from "./types";

/**
 * All built-in parsers in priority order.
 * The first parser whose detect() returns true will be used.
 * To add support for a new exchange, create a class implementing
 * IExchangeCSVParser and add an instance here.
 */
export const KNOWN_PARSERS: IExchangeCSVParser[] = [
  new CryptoComParser(),
  new RevolutParser(),
  new BinanceParser(),
  new KrakenParser(),
  new CoinbaseParser(),
  new OKXParser(),
  new BitgetParser(),
  new BybitParser(),
  new GenericTradeParser(),
];

/**
 * Optimistically selects a parser by testing headers against each known
 * parser's detect() method.
 * @returns The first matching parser, or null if none matched.
 */
export function detectParser(headers: string[]): IExchangeCSVParser | null {
  return KNOWN_PARSERS.find((p) => p.detect(headers)) ?? null;
}

/**
 * Lightweight browser-compatible CSV text parser.
 * Handles quoted fields (including those containing commas or newlines).
 * Does NOT depend on any external CSV library.
 */
export function parseCSVText(text: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const lines = splitCSVLines(text.trim());
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.every((v) => v === "")) continue; // skip blank lines

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Splits raw CSV text into logical lines, correctly handling newlines that
 * appear inside quoted fields.
 */
function splitCSVLines(text: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      // Handle escaped quotes ("") inside a quoted field
      if (inQuotes && text[i + 1] === '"') {
        current += '""';
        i++;
      } else {
        current += ch;
        inQuotes = !inQuotes;
      }
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      // Skip \r in \r\n sequences
      if (ch === "\r" && text[i + 1] === "\n") i++;
      lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  if (current !== "") {
    lines.push(current);
  }

  return lines;
}

/**
 * Parses a single CSV line into an array of field values.
 * Strips surrounding double-quotes and unescapes internal doubled-quotes.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  fields.push(current);
  return fields;
}
