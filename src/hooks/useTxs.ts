import { Storage } from '@ionic/storage';
import { Transaction } from '../models/MempoolAddressTxs';
import { useEffect, useState } from 'react';

export interface TransactionsStorage {
    [key: string]: Array<Transaction>;
}

const TXS_STORAGE_KEY = 'transactions';

export const useTxs = () => {
    const [store] = useState(new Storage());

    useEffect(() => {
        const initializeStorage = async () => {
            await store.create();
        };
        initializeStorage();
    }, [store]);


    const insertTxs = async (address: string, transactions: Array<Transaction>) => {
        let storedTxs = await getAllTxs();
        let addrEntry = storedTxs[address];

        if (addrEntry) {
            storedTxs[address] = addrEntry.concat(transactions);
        } else {
            storedTxs[address] = transactions;
        }

        await store.set(TXS_STORAGE_KEY, storedTxs);

        return storedTxs;
    }

    const getTxsByAddress = async (address: string) => {
        const res = await store.get(TXS_STORAGE_KEY) as TransactionsStorage;

        if (res && res[address]) {
            return res[address];
        }

        return new Array<Transaction>();
    }

    const getAllTxs = async (): Promise<TransactionsStorage> => {
        const res = await store.get(TXS_STORAGE_KEY) as TransactionsStorage;
        return res ? res : {};
    }

    return { insertTxs, getAllTxs, getTxsByAddress }
} 
