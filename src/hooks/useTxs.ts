import { Storage } from '@ionic/storage';
import { Transaction } from '../models/MempoolAddressTxs';
import { useEffect, useState } from 'react';
import { AddressStateObject } from './useAddresses';
import * as _ from 'lodash';
import { AddressInfo } from '../models/MempoolAddress';

export interface TransactionsStorage {
    [key: string]: Array<Transaction>;
}

// Key being address
export interface STXOandUTXO {
    [key: string]: {
        stxo: Array<Transaction>;
        utxo: Array<Transaction>;
    }
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


    const insertTxs = async (addrInfo: AddressInfo, transactions: Array<Transaction>) => {
        let storedTxs = await getAllTxs();
        let addrEntry = storedTxs[addrInfo.address];

        if (addrEntry) {
            storedTxs[addrInfo.address] = addrEntry.concat(transactions);
        } else {
            storedTxs[addrInfo.address] = transactions;
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


    const calculatePaidTxsFees = (txStore: TransactionsStorage) => {
        let feesPaid = 0;

        _.forEach(txStore, (txs, addr) => {
            _.forEach(txs, (tx) => {
                feesPaid += tx.fee;
            });
        });

        return feesPaid;
    }

    // Returns the first transaction in and the last transaction out
    const getFirstInAndLastOut = (txStore: TransactionsStorage, address: string) => {
        const sorted = _.sortBy(txStore[address], "status.block_time");

        return {
            firstIn: sorted[0],
            lastOut: sorted[sorted.length - 1]
        }
    }

    return { insertTxs, getAllTxs, getTxsByAddress, calculatePaidTxsFees, getFirstInAndLastOut }
} 
