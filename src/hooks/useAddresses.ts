import { Storage } from '@ionic/storage';
import { AddressInfo as AddressInfoComputed } from 'bitcoin-address-validation';
import { useEffect, useState } from 'react';
import _ from 'lodash';
import { AddressInfo } from '../models/MempoolAddress';
import { TransactionsStorage } from './useTxs';

export interface AddressInfoExtended extends AddressInfoComputed, AddressInfo {
    label: string;
}

export interface AddressStateObject {
    [key: string]: AddressInfoExtended;
}

const STORE_KEY = 'addresses';

export const useAddresses = () => {
    const [store] = useState(new Storage());

    useEffect(() => {
        const initializeStorage = async () => {
            await store.create();
        };
        initializeStorage();
    }, [store]);

    const putAddress = async (address: AddressInfoExtended) => {
        const addresses = await getAddresses();

        addresses[address.address] = address;

        await store.set(STORE_KEY, addresses);
        return addresses;
    }

    const getAddress = async (address: string) => {
        const addresses = await getAddresses();
        return addresses[address];
    }

    const getAddresses = async () => {
        const addresses = await store.get(STORE_KEY) as AddressStateObject;
        return addresses ? addresses : {};
    }

    const sumBalances = (addrStore: AddressStateObject) => {
        let _totalHoldings = 0;

        _.forEach(addrStore, (addr) => {
            _totalHoldings += (addr.chain_stats.funded_txo_sum - addr.chain_stats.spent_txo_count)
        })

        return _totalHoldings;
    };

    const sumTxsFeesPaid = (txStore: TransactionsStorage, addrStore: AddressStateObject) => {
        const addresses = Object.keys(addrStore);
        let feesPaid = 0;

        addresses.forEach((addr) => {
            txStore[addr].forEach(tx => {
                tx.vin.forEach((vin) => {
                    if (vin.prevout.scriptpubkey_address.includes(addr)) {
                        feesPaid += tx.fee;
                    }
                })
            })
        })
    
        return feesPaid;
    }

    const resetAddressesData = async () => {
        await store.set(STORE_KEY, {});
    }

    return { putAddress, getAddress, getAddresses, sumBalances, sumTxsFeesPaid, resetAddressesData}
} 
