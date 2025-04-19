import { AddressInfo } from "../models/MempoolAddress";
import { Transaction } from "../models/MempoolAddressTxs";
import { MEMPOOL_STORE_KEY, useStorage } from "../context/StorageContext";

export interface MempoolStore {
  mempoolAPIUrl: string;
}
export const useMempoolApi = () => {
  const { storage } = useStorage();

  // Get the address details from the mempool API
  const queryAddrInfo = async (
    address: string,
  ): Promise<AddressInfo | Error> => {
    const data: MempoolStore = await storage.get(MEMPOOL_STORE_KEY);
    return await fetch(`${data.mempoolAPIUrl}/address/${address}`)
      .then((response) => {
        return response.json();
      })
      .catch((error) => {
        return error;
      });
  };

  // Index the first 10 transactions by block height in descending order
  // for a given address. When the txId is provided, the index will start
  // from that transaction and fetch the next 10 transactions and so on until
  // no more transactions are available.
  const queryTxsByAddr = async (
    address: string,
    txId?: string,
  ): Promise<Array<Transaction> | Error> => {
    const data: MempoolStore = await storage.get(MEMPOOL_STORE_KEY);
    const url = txId
      ? `${data.mempoolAPIUrl}/address/${address}/txs/chain/${txId}`
      : `${data.mempoolAPIUrl}/address/${address}/txs`;

    return await fetch(url)
      .then((response) => {
        return response.json();
      })
      .catch((error) => {
        return error;
      });
  };

  /// Get all transactions for a given address by fetching the first 10 transactions
  /// and then fetching the next 10 transactions until all transactions are fetched.
  const queryAllTxs = async (
    address: string,
  ): Promise<Array<Transaction> | Error> => {
    const addressInfo = await queryAddrInfo(address);
    if (addressInfo instanceof Error) {
      return addressInfo;
    }
    const totalTransactions = addressInfo.chain_stats.tx_count;

    let allTransactions: Transaction[] = [];
    let lastTxId: string | undefined;

    while (allTransactions.length < totalTransactions) {
      const transactions = await queryTxsByAddr(address, lastTxId);
      if (transactions instanceof Error) {
        return transactions;
      }

      if (transactions.length == 0) break;

      allTransactions = [...allTransactions, ...transactions];
      lastTxId = allTransactions[allTransactions.length - 1].txid;
    }

    return allTransactions;
  };

  // Get all transactions given the address details.
  const queryAllTxsGivenAddrInfo = async (
    addrInfo: AddressInfo,
  ): Promise<Array<Transaction> | Error> => {
    const totalTransactions = addrInfo.chain_stats.tx_count;

    let allTransactions: Transaction[] = [];
    let lastTxId: string | undefined;

    while (allTransactions.length < totalTransactions) {
      const transactions = await queryTxsByAddr(addrInfo.address, lastTxId);
      if (transactions instanceof Error) {
        return transactions;
      }
      if (transactions.length == 0) break;

      allTransactions = [...allTransactions, ...transactions];
      lastTxId = allTransactions[allTransactions.length - 1].txid;
    }

    return allTransactions;
  };

  const getStoredData = () => {
    return storage.get(MEMPOOL_STORE_KEY) as Promise<MempoolStore>;
  };

  const updateMempoolAPIUrl = async (url: string) => {
    let data: MempoolStore = await storage.get(MEMPOOL_STORE_KEY);
    data.mempoolAPIUrl = url;
    await storage.set(MEMPOOL_STORE_KEY, data);
  };

  return {
    queryAddrInfo,
    queryTxsByAddr,
    queryAllTxs,
    queryAllTxsGivenAddrInfo,
    getStoredData,
    updateMempoolAPIUrl,
  };
};
