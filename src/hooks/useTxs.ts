import { Storage } from '@ionic/storage';
import { Transaction } from '../models/MempoolAddressTxs';
import { useEffect, useState } from 'react';
import * as _ from 'lodash';
import { AddressInfo } from '../models/MempoolAddress';

export interface TransactionsStorage {
    [key: string]: Array<Transaction>;
}


const STORE_KEY = 'transactions';
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

        await store.set(STORE_KEY, storedTxs);

        return storedTxs;
    }

    const getTxsByAddress = async (address: string) => {
        const res = await store.get(STORE_KEY) as TransactionsStorage;

        if (res && res[address]) {
            return res[address];
        }

        return new Array<Transaction>();
    }

    const getAllTxs = async (): Promise<TransactionsStorage> => {
        const res = await store.get(STORE_KEY) as TransactionsStorage;
        return res ? res : {};
    }

    // Returns the first transaction in and the last transaction out
    const getFirstInAndLastOut = (txStore: TransactionsStorage, address: string) => {
        const sorted = _.sortBy(txStore[address], "status.block_time");

        return {
            firstIn: sorted[0],
            lastOut: sorted.reverse().find((tx) => tx.vin.find((vin) => vin.prevout.scriptpubkey_address === address))
        }
    }
    // Returns the first transaction in and the last transaction out
    const getFeesPaid = (txStore: TransactionsStorage, address: string) => {
        const feesPaid = txStore[address].reduce((acc, tx) => { 
          if (tx.vout.find(vout => vout.scriptpubkey_address === address)) {
            acc += tx.fee;
          }
  
          return acc
        }, 0);
        
        return feesPaid;
    }

    const resetTransactionsData = async () => {
        await store.set(STORE_KEY, {});
    }

    return { insertTxs, getAllTxs, getTxsByAddress, getFeesPaid, getFirstInAndLastOut, resetTransactionsData }
} 
