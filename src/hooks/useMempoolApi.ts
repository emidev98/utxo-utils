import { AddressInfo } from "../models/MempoolAddress";
import { Transaction } from "../models/MempoolAddressTxs";

export const useMempoolApi = () => {
    
    // Get the address details from the mempool API
    const queryAddrInfo = async (address: string) => {
        const res: AddressInfo = await fetch(`http://192.168.1.100:3006/api/address/${address}`)
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
            `http://192.168.1.100:3006/api/address/${address}/txs/chain/${txId}` :
            `http://192.168.1.100:3006/api/address/${address}/txs`;

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

    return {
        queryAddrInfo,
        queryTxsByAddr,
        queryAllTxs,
        queryAllTxsGivenAddrInfo,
    };
} 
