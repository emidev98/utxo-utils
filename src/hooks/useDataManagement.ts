import {
  ADDRESSES_STORE_KEY,
  EXCHANGES_STORE_KEY,
  TXS_STORE_KEY,
  UTXOS_STORE_KEY,
  useStorage,
} from "../context/StorageContext";
import {
  DataExportPayload,
  ImportMode,
  ImportSummary,
  ProgressiveConflictConfig,
} from "../models/DataExport";
import { ExchangeAccount, ExchangeStore } from "../models/ExchangeData";
import { Transaction, UTXO } from "../models/MempoolAddressTxs";
import { LocalUTXO } from "../models/UTXOs";
import { AddressStateObject, useAddresses } from "./useAddresses";
import { useMempoolApi } from "./useMempoolApi";
import { TransactionsStorage, useTxs } from "./useTxs";
import { useUTXOs } from "./useUTXOs";

const DATA_EXPORT_VERSION = "1.0.0";

const createEmptyImportSummary = (): ImportSummary => ({
  insertedAddresses: 0,
  replacedAddresses: 0,
  insertedTransactions: 0,
  replacedTransactions: 0,
  insertedUtxos: 0,
  replacedUtxos: 0,
  insertedExchanges: 0,
  replacedExchanges: 0,
  insertedExchangeTransactions: 0,
  skippedExchangeTransactions: 0,
});

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

const hasStringProp = (value: Record<string, unknown>, key: string) => {
  return typeof value[key] === "string";
};

const hasNumberProp = (value: Record<string, unknown>, key: string) => {
  return typeof value[key] === "number" && Number.isFinite(value[key]);
};

const isValidTx = (value: unknown): value is Transaction => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    hasStringProp(value, "txid") &&
    Array.isArray(value.vin) &&
    Array.isArray(value.vout) &&
    hasNumberProp(value, "fee") &&
    isRecord(value.status) &&
    hasNumberProp(value.status, "block_time")
  );
};

const isValidUtxo = (value: unknown): value is UTXO => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    hasStringProp(value, "txid") &&
    hasNumberProp(value, "vout") &&
    hasNumberProp(value, "value") &&
    isRecord(value.status) &&
    hasNumberProp(value.status, "block_time")
  );
};

const isValidLocalUtxo = (value: unknown): value is LocalUTXO => {
  if (!isRecord(value)) {
    return false;
  }

  return hasNumberProp(value, "lastUpdated") && Array.isArray(value.utxos);
};

const isValidExchangeTransaction = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    hasStringProp(value, "id") &&
    hasStringProp(value, "fingerprint") &&
    hasStringProp(value, "exchangeId") &&
    hasNumberProp(value, "timestamp") &&
    hasStringProp(value, "type") &&
    hasNumberProp(value, "amount") &&
    hasStringProp(value, "currency") &&
    isRecord(value.rawData) &&
    hasStringProp(value, "matchState")
  );
};

const isValidExchangeAccount = (value: unknown): value is ExchangeAccount => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    hasStringProp(value, "id") &&
    hasStringProp(value, "name") &&
    hasNumberProp(value, "createdAt") &&
    Array.isArray(value.transactions) &&
    value.transactions.every(isValidExchangeTransaction)
  );
};

const isValidExchangeStore = (value: unknown): value is ExchangeStore => {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every(isValidExchangeAccount);
};

const isValidPayload = (value: unknown): value is DataExportPayload => {
  if (!isRecord(value)) {
    return false;
  }

  if (!isRecord(value.metadata)) {
    return false;
  }

  const metadata = value.metadata;
  const validMetadata =
    hasStringProp(metadata, "version") &&
    hasNumberProp(metadata, "exportedAt") &&
    hasNumberProp(metadata, "addressCount") &&
    hasNumberProp(metadata, "txCount") &&
    hasNumberProp(metadata, "utxoCount");

  if (!validMetadata) {
    return false;
  }

  if (
    !isRecord(value.addresses) ||
    !isRecord(value.transactions) ||
    !isRecord(value.utxos) ||
    (value.exchanges !== undefined && !isValidExchangeStore(value.exchanges))
  ) {
    return false;
  }

  const txValues = Object.values(value.transactions);
  if (
    txValues.some(
      (entry) => !Array.isArray(entry) || entry.some((tx) => !isValidTx(tx)),
    )
  ) {
    return false;
  }

  const utxoValues = Object.values(value.utxos);
  if (
    utxoValues.some(
      (entry) =>
        !isValidLocalUtxo(entry) || entry.utxos.some((u) => !isValidUtxo(u)),
    )
  ) {
    return false;
  }

  return true;
};

const toOutpointKey = (utxo: UTXO) => `${utxo.txid}:${utxo.vout}`;

export const useDataManagement = () => {
  const { storage, resetStorage } = useStorage();
  const { queryTxsByAddr, queryUtxos } = useMempoolApi();
  const { getAddresses } = useAddresses();
  const { getAllTxs } = useTxs();
  const { updateUTXOs } = useUTXOs();

  const syncFromAPI = async (
    onProgress?: (address: string) => void,
  ): Promise<{ syncedAddresses: number; appendedTransactions: number }> => {
    const addresses = await getAddresses();
    const txs = await getAllTxs();

    let syncedAddresses = 0;
    let appendedTransactions = 0;

    for (const addr of Object.keys(addresses)) {
      syncedAddresses += 1;
      onProgress?.(addr);

      const existingTxs = txs[addr] ?? [];
      let lastTxId =
        existingTxs.length > 0
          ? existingTxs[existingTxs.length - 1].txid
          : undefined;

      const utxos = await queryUtxos(addr);
      if (utxos instanceof Error) {
        throw utxos;
      }
      await updateUTXOs(addr, utxos);

      while (true) {
        const newTxs = await queryTxsByAddr(addr, lastTxId);

        if (newTxs instanceof Error) {
          throw newTxs;
        }

        if (newTxs.length === 0) {
          break;
        }

        const current =
          ((await storage.get(TXS_STORE_KEY)) as TransactionsStorage | null) ??
          {};
        const addrCurrent = current[addr] ?? [];
        current[addr] = addrCurrent.concat(newTxs);
        await storage.set(TXS_STORE_KEY, current);

        appendedTransactions += newTxs.length;
        lastTxId = newTxs[newTxs.length - 1].txid;
      }
    }

    return { syncedAddresses, appendedTransactions };
  };

  const buildExportPayload = async (): Promise<DataExportPayload> => {
    const [addresses, transactions, utxos, exchanges] = await Promise.all([
      storage.get(ADDRESSES_STORE_KEY),
      storage.get(TXS_STORE_KEY),
      storage.get(UTXOS_STORE_KEY),
      storage.get(EXCHANGES_STORE_KEY),
    ]);

    const safeAddresses = (addresses ?? {}) as AddressStateObject;
    const safeTransactions = (transactions ?? {}) as TransactionsStorage;
    const safeUtxos = (utxos ?? {}) as Record<string, LocalUTXO>;
    const safeExchanges = (exchanges ?? {}) as ExchangeStore;

    const txCount = Object.values(safeTransactions).reduce(
      (acc, txList) => acc + txList.length,
      0,
    );
    const utxoCount = Object.values(safeUtxos).reduce(
      (acc, local) => acc + local.utxos.length,
      0,
    );
    const exchangeTxCount = Object.values(safeExchanges).reduce(
      (acc, exchange) => acc + exchange.transactions.length,
      0,
    );

    return {
      metadata: {
        version: DATA_EXPORT_VERSION,
        exportedAt: Date.now(),
        addressCount: Object.keys(safeAddresses).length,
        txCount,
        utxoCount,
        exchangeCount: Object.keys(safeExchanges).length,
        exchangeTxCount,
      },
      addresses: safeAddresses,
      transactions: safeTransactions,
      utxos: safeUtxos,
      exchanges: safeExchanges,
    };
  };

  const exportDataToJson = async () => {
    const payload = await buildExportPayload();
    const content = JSON.stringify(payload, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    return {
      payload,
      content,
      fileName: `utxo-utils-data-${timestamp}.json`,
    };
  };

  const readAndValidatePayload = (jsonContent: string): DataExportPayload => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      throw new Error("Invalid JSON file.");
    }

    if (!isValidPayload(parsed)) {
      throw new Error("Invalid data format for import.");
    }

    if (parsed.metadata.version !== DATA_EXPORT_VERSION) {
      throw new Error(
        `Unsupported import version ${parsed.metadata.version}. Expected ${DATA_EXPORT_VERSION}.`,
      );
    }

    return {
      ...parsed,
      exchanges: parsed.exchanges ?? {},
    };
  };

  const importDataFromJson = async (
    jsonContent: string,
    mode: ImportMode,
    progressiveConflicts?: ProgressiveConflictConfig,
  ): Promise<ImportSummary> => {
    const payload = readAndValidatePayload(jsonContent);

    if (mode === "replace") {
      await storage.set(ADDRESSES_STORE_KEY, payload.addresses);
      await storage.set(TXS_STORE_KEY, payload.transactions);
      await storage.set(UTXOS_STORE_KEY, payload.utxos);
      await storage.set(EXCHANGES_STORE_KEY, payload.exchanges ?? {});

      return {
        insertedAddresses: Object.keys(payload.addresses).length,
        replacedAddresses: 0,
        insertedTransactions: Object.values(payload.transactions).reduce(
          (acc, txs) => acc + txs.length,
          0,
        ),
        replacedTransactions: 0,
        insertedUtxos: Object.values(payload.utxos).reduce(
          (acc, local) => acc + local.utxos.length,
          0,
        ),
        replacedUtxos: 0,
        insertedExchanges: Object.keys(payload.exchanges ?? {}).length,
        replacedExchanges: 0,
        insertedExchangeTransactions: Object.values(
          payload.exchanges ?? {},
        ).reduce((acc, exchange) => acc + exchange.transactions.length, 0),
        skippedExchangeTransactions: 0,
      };
    }

    if (!progressiveConflicts) {
      throw new Error("Progressive conflict rules are required.");
    }

    const summary = createEmptyImportSummary();
    const [
      existingAddressesRaw,
      existingTxsRaw,
      existingUtxosRaw,
      existingExchangesRaw,
    ] = await Promise.all([
      storage.get(ADDRESSES_STORE_KEY),
      storage.get(TXS_STORE_KEY),
      storage.get(UTXOS_STORE_KEY),
      storage.get(EXCHANGES_STORE_KEY),
    ]);

    const existingAddresses = (existingAddressesRaw ??
      {}) as AddressStateObject;
    const existingTxs = (existingTxsRaw ?? {}) as TransactionsStorage;
    const existingUtxos = (existingUtxosRaw ?? {}) as Record<string, LocalUTXO>;
    const existingExchanges = (existingExchangesRaw ?? {}) as ExchangeStore;

    for (const [addr, incomingAddr] of Object.entries(payload.addresses)) {
      const alreadyExists = Boolean(existingAddresses[addr]);
      if (alreadyExists) {
        if (progressiveConflicts.addresses === "replace-imported") {
          existingAddresses[addr] = incomingAddr;
          summary.replacedAddresses += 1;
        }
      } else {
        existingAddresses[addr] = incomingAddr;
        summary.insertedAddresses += 1;
      }
    }

    for (const [addr, incomingTxs] of Object.entries(payload.transactions)) {
      const current = existingTxs[addr] ?? [];
      const txById = new Map(current.map((tx) => [tx.txid, tx]));

      for (const tx of incomingTxs) {
        const exists = txById.has(tx.txid);
        if (exists) {
          if (progressiveConflicts.transactions === "replace-imported") {
            txById.set(tx.txid, tx);
            summary.replacedTransactions += 1;
          }
        } else {
          txById.set(tx.txid, tx);
          summary.insertedTransactions += 1;
        }
      }

      existingTxs[addr] = Array.from(txById.values());
    }

    for (const [addr, incomingLocal] of Object.entries(payload.utxos)) {
      const currentLocal = existingUtxos[addr] ?? { lastUpdated: 0, utxos: [] };
      const utxoByKey = new Map(
        currentLocal.utxos.map((u) => [toOutpointKey(u), u]),
      );

      for (const utxo of incomingLocal.utxos) {
        const key = toOutpointKey(utxo);
        const exists = utxoByKey.has(key);
        if (exists) {
          if (progressiveConflicts.utxos === "replace-imported") {
            utxoByKey.set(key, utxo);
            summary.replacedUtxos += 1;
          }
        } else {
          utxoByKey.set(key, utxo);
          summary.insertedUtxos += 1;
        }
      }

      existingUtxos[addr] = {
        lastUpdated: Math.max(
          currentLocal.lastUpdated,
          incomingLocal.lastUpdated,
        ),
        utxos: Array.from(utxoByKey.values()),
      };
    }

    for (const [exchangeId, incomingExchange] of Object.entries(
      payload.exchanges ?? {},
    )) {
      const currentExchange = existingExchanges[exchangeId];
      if (!currentExchange) {
        existingExchanges[exchangeId] = incomingExchange;
        summary.insertedExchanges += 1;
        summary.insertedExchangeTransactions +=
          incomingExchange.transactions.length;
        continue;
      }

      const txByFingerprint = new Map(
        currentExchange.transactions.map((tx) => [tx.fingerprint, tx]),
      );

      for (const incomingTx of incomingExchange.transactions) {
        if (txByFingerprint.has(incomingTx.fingerprint)) {
          summary.skippedExchangeTransactions += 1;
          continue;
        }

        txByFingerprint.set(incomingTx.fingerprint, incomingTx);
        summary.insertedExchangeTransactions += 1;
      }

      existingExchanges[exchangeId] = {
        ...currentExchange,
        transactions: Array.from(txByFingerprint.values()),
        lastImportedAt: Math.max(
          currentExchange.lastImportedAt ?? 0,
          incomingExchange.lastImportedAt ?? 0,
        ),
        lastModifiedAt: Math.max(
          currentExchange.lastModifiedAt ?? 0,
          incomingExchange.lastModifiedAt ?? 0,
        ),
      };
    }

    await storage.set(ADDRESSES_STORE_KEY, existingAddresses);
    await storage.set(TXS_STORE_KEY, existingTxs);
    await storage.set(UTXOS_STORE_KEY, existingUtxos);
    await storage.set(EXCHANGES_STORE_KEY, existingExchanges);

    return summary;
  };

  const resetCoreData = async () => {
    await resetStorage();
  };

  return {
    syncFromAPI,
    exportDataToJson,
    importDataFromJson,
    resetCoreData,
  };
};
