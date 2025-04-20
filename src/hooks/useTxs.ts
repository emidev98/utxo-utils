import { Transaction } from "../models/MempoolAddressTxs";
import { TXS_STORE_KEY, useStorage } from "../context/StorageContext";
import _sortBy from "lodash/sortBy";
export interface TransactionsStorage {
  [key: string]: Array<Transaction>;
}
export const useTxs = () => {
  const { storage } = useStorage();

  const appendTxs = async (addr: string, transactions: Array<Transaction>) => {
    let storedTxs = await getAllTxs();
    let addrEntry = storedTxs[addr];

    if (addrEntry) {
      storedTxs[addr] = addrEntry.concat(transactions);
    } else {
      storedTxs[addr] = transactions;
    }

    await storage.set(TXS_STORE_KEY, storedTxs);

    return storedTxs;
  };

  const getTxsByAddress = async (address: string) => {
    const res = (await storage.get(TXS_STORE_KEY)) as TransactionsStorage;

    if (res && res[address]) {
      return res[address];
    }

    return new Array<Transaction>();
  };

  const getAllTxs = async (): Promise<TransactionsStorage> => {
    return (await storage.get(TXS_STORE_KEY)) as TransactionsStorage;
  };

  // Returns the first transaction in and the last transaction out
  const getFirstInAndLastOut = (
    txStore: TransactionsStorage,
    address: string,
  ) => {
    const sorted = _sortBy(txStore[address], "status.block_time");

    return {
      firstIn: sorted[0],
      lastOut: sorted
        .reverse()
        .find((tx) =>
          tx.vin.find((vin) => vin.prevout.scriptpubkey_address === address),
        ),
    };
  };
  const getIncomingTxFees = (txStore: TransactionsStorage, address: string) => {
    const feesPaid = txStore[address].reduce((acc, tx) => {
      const vout = tx.vout.find(
        (vout) => vout.scriptpubkey_address === address,
      );
      if (vout !== undefined) {
        acc += tx.fee / tx.vout.length;
      }

      return acc;
    }, 0);
    return Number(feesPaid.toFixed(0));
  };

  return {
    appendTxs,
    getAllTxs,
    getTxsByAddress,
    getIncomingTxFees,
    getFirstInAndLastOut,
  };
};
