import { EXCHANGES_STORE_KEY, useStorage } from "../context/StorageContext";
import {
  ExchangeAccount,
  ExchangeStore,
  ExchangeTransaction,
  ParsedExchangeTx,
} from "../models/ExchangeData";
import { reconcileExchange as reconcileUtil } from "../utils/exchangeMatching";
import { TransactionsStorage } from "./useTxs";

export const useExchanges = () => {
  const { storage } = useStorage();
  const getNowUnix = () => Math.floor(Date.now() / 1000);

  const getExchanges = async (): Promise<ExchangeStore> => {
    const store = (await storage.get(EXCHANGES_STORE_KEY)) as ExchangeStore;
    return store ?? {};
  };

  const getExchange = async (
    id: string,
  ): Promise<ExchangeAccount | undefined> => {
    const store = await getExchanges();
    return store[id];
  };

  const putExchange = async (account: ExchangeAccount): Promise<void> => {
    const store = await getExchanges();
    store[account.id] = {
      ...account,
      lastModifiedAt: account.lastModifiedAt ?? getNowUnix(),
    };
    await storage.set(EXCHANGES_STORE_KEY, store);
  };

  const removeExchange = async (id: string): Promise<void> => {
    const store = await getExchanges();
    if (store[id]) {
      delete store[id];
      await storage.set(EXCHANGES_STORE_KEY, store);
    }
  };

  const appendTransactions = async (
    exchangeId: string,
    newTxs: ParsedExchangeTx[],
  ): Promise<{ inserted: number; duplicates: number }> => {
    const store = await getExchanges();
    const account = store[exchangeId];
    if (!account) {
      throw new Error(`Exchange account ${exchangeId} not found`);
    }

    const existingFingerprints = new Set(
      account.transactions.map((t) => t.fingerprint),
    );

    let inserted = 0;
    let duplicates = 0;

    const toInsert: ExchangeTransaction[] = [];
    for (const parsed of newTxs) {
      if (existingFingerprints.has(parsed.fingerprint)) {
        duplicates++;
        continue;
      }
      toInsert.push({
        ...parsed,
        id: crypto.randomUUID(),
        exchangeId,
        matchState: "unmatched",
      });
      existingFingerprints.add(parsed.fingerprint);
      inserted++;
    }

    account.transactions = [...account.transactions, ...toInsert];
    account.lastImportedAt = getNowUnix();
    account.lastModifiedAt = account.lastImportedAt;
    store[exchangeId] = account;

    await storage.set(EXCHANGES_STORE_KEY, store);
    return { inserted, duplicates };
  };

  const reconcileExchange = async (
    id: string,
    txStore: TransactionsStorage,
  ): Promise<ExchangeAccount> => {
    const account = await getExchange(id);
    if (!account) {
      throw new Error(`Exchange account ${id} not found`);
    }

    const updated = reconcileUtil(account, txStore);
    await putExchange({ ...updated, lastModifiedAt: getNowUnix() });
    return updated;
  };

  const updateExchangeName = async (
    id: string,
    name: string,
  ): Promise<ExchangeAccount> => {
    const account = await getExchange(id);
    if (!account) {
      throw new Error(`Exchange account ${id} not found`);
    }

    const updated = {
      ...account,
      name,
      lastModifiedAt: getNowUnix(),
    };
    await putExchange(updated);
    return updated;
  };

  return {
    getExchanges,
    getExchange,
    putExchange,
    removeExchange,
    appendTransactions,
    reconcileExchange,
    updateExchangeName,
  };
};
