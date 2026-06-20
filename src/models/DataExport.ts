import { AddressInfo as AddressInfoComputed } from "bitcoin-address-validation";
import { AddressInfo } from "./MempoolAddress";
import { Transaction } from "./MempoolAddressTxs";
import { LocalUTXO } from "./UTXOs";

export interface ExportAddressInfo extends AddressInfoComputed, AddressInfo {
  label: string;
}

export interface ExportMetadata {
  version: string;
  exportedAt: number;
  addressCount: number;
  txCount: number;
  utxoCount: number;
}

export interface DataExportPayload {
  metadata: ExportMetadata;
  addresses: Record<string, ExportAddressInfo>;
  transactions: Record<string, Transaction[]>;
  utxos: Record<string, LocalUTXO>;
}

export type ImportMode = "replace" | "progressive";

export type ConflictResolution = "keep-existing" | "replace-imported";

export interface ProgressiveConflictConfig {
  addresses: ConflictResolution;
  transactions: ConflictResolution;
  utxos: ConflictResolution;
}

export interface ImportSummary {
  insertedAddresses: number;
  replacedAddresses: number;
  insertedTransactions: number;
  replacedTransactions: number;
  insertedUtxos: number;
  replacedUtxos: number;
}
