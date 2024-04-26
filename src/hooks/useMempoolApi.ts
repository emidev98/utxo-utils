import { Storage } from '@ionic/storage';
import { AddressInfo } from "../models/MempoolAddress";
import { Transaction } from "../models/MempoolAddressTxs";

export interface TransactionsStorage {
    [key: string]: Array<Transaction>;
}

const TXS_STORAGE_KEY = 'transactions';
export const useMempoolApi = () => {
    const store = new Storage();


    // Get the address details from the mempool API
    const queryAddrInfo = async (address: string) => {
        const res: AddressInfo = await fetch(`https://mempool.space/api/address/${address}`)
            .then(response => response.json())
            .catch(error => console.error('Error fetching data:', error));

        return res;
    }

    // Index the first 10 transactions by block height in descending order
    // for a given address. When the txId is provided, the index will start
    // from that transaction and fetch the next 10 transactions and so on until
    // no more transactions are available. 
    const queryTxsByAddr = async (address: string, txId?: string) => {
        const url = txId ?
            `https://mempool.space/api/address/${address}/txs/chain/${txId}` :
            `https://mempool.space/api/address/${address}/txs`;

        const res: Array<Transaction> = await fetch(url)
            .then(response => response.json())
            .catch(error => console.error('Error fetching data:', error));


        return res;
    }

    /// Get all transactions for a given address by fetching the first 10 transactions
    /// and then fetching the next 10 transactions until all transactions are fetched.
    const queryAllTxs = async (address: string) => {
        const addressInfo = await queryAddrInfo(address);
        const totalTransactions = addressInfo.chain_stats.tx_count;

        let allTransactions: Transaction[] = [];
        let lastTxId: string | undefined;

        while (allTransactions.length < totalTransactions) {
            const transactions = await queryTxsByAddr(address, lastTxId);

            if (transactions.length == 0) break;

            allTransactions = [...allTransactions, ...transactions];
            lastTxId = allTransactions[allTransactions.length - 1].txid;
        }

        return allTransactions;
    }


    // Get all transactions given the address details.
    const queryAllTxsGivenAddrInfo = async (addrInfo: AddressInfo) => {
        const totalTransactions = addrInfo.chain_stats.tx_count;

        let allTransactions: Transaction[] = [];
        let lastTxId: string | undefined;

        while (allTransactions.length < totalTransactions) {
            const transactions = await queryTxsByAddr(addrInfo.address, lastTxId);

            if (transactions.length == 0) break;

            allTransactions = [...allTransactions, ...transactions];
            lastTxId = allTransactions[allTransactions.length - 1].txid;
        }

        return allTransactions;
    }

    // Query all transactions for a given address and save them in the store
    // under the key TXS_STORAGE_KEY to be used later.
    const putTransactions = async (address: string, transactions: Array<Transaction>) => {
        await store.create();
        await store.set(TXS_STORAGE_KEY, { [address]: transactions });
    }

    // Get all transactions for a given address from the store.
    const getStoredTxs = async (address: string) => {
        await store.create();
        const transactions = await store.get(TXS_STORAGE_KEY) as TransactionsStorage;
        return transactions[address];
    }

    return {
        queryAddrInfo,
        queryTxsByAddr,
        queryAllTxs,
        putTransactions,
        queryAllTxsGivenAddrInfo,
        getStoredTxs
    };
} 
