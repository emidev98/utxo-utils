import { Storage } from '@ionic/storage';
import { Transaction } from '../models/MempoolAddressTxs';
import { useEffect, useState } from 'react';
import { AddressStateObject } from './useAddresses';
import * as _ from 'lodash';

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

    // Given the stores of transactions and addresses, calculate the total fees paid
    // by the user for all their addresses splitting the txs in Input and Output transactions.
    const calculatePaidTxsFees = (txStore: TransactionsStorage, addrStore: AddressStateObject) => {
        const splitted = splitSTXOandUTXO(txStore, addrStore);
        let feesPaid = 0;

        _.forEach(splitted, (txs, addr) => {
            feesPaid += _.sumBy(txs.stxo, 'fee');
        });

        return feesPaid;
    }
    
    // The function's purpose is to split the transactions for each address into two categories: 
    // spent transaction outputs (STXO) and unspent transaction outputs (UTXO). 
    const splitSTXOandUTXO = (txStore: TransactionsStorage, addrStore: AddressStateObject): STXOandUTXO => {
        let data: STXOandUTXO = {};

        _.forEach(txStore, (txs, addr) => {
            data[addr] = {
                stxo: new Array<Transaction>(),
                utxo: new Array<Transaction>()
            }

            _.forEach(txs, (tx) => {
                const isInputExistingAddress = !!_.find(tx.vout, (vout) =>  addrStore[vout.scriptpubkey_address] !== undefined);

                if (isInputExistingAddress) {
                    data[addr].utxo.push(tx);
                } else {
                    data[addr].stxo.push(tx);
                }
            });
        });

        return data;
    }

    return { insertTxs, getAllTxs, getTxsByAddress, calculatePaidTxsFees, splitSTXOandUTXO}
} 
