import { Storage } from '@ionic/storage';
import { AddressInfo as AddressInfoComputed } from 'bitcoin-address-validation';
import { useEffect, useState } from 'react';
import _ from 'lodash';
import { AddressInfo } from '../models/MempoolAddress';

export interface AddressInfoExtended extends AddressInfoComputed, AddressInfo {
    label: string;
}

export interface AddressStateObject {
    [key: string]: AddressInfoExtended;
}

const ADDRESS_STORAGE_KEY = 'addresses';

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

        await store.set(ADDRESS_STORAGE_KEY, addresses);
        return addresses;
    }

    const getAddress = async (address: string) => {
        const addresses = await getAddresses();
        return addresses[address];
    }

    const getAddresses = async () => {
        const addresses = await store.get(ADDRESS_STORAGE_KEY) as AddressStateObject;
        return addresses ? addresses : {};
    }

    const sumBalances = (addrStore: AddressStateObject) => {
        let _totalHoldings = 0;

        _.forEach(addrStore, (addr) => {
            _totalHoldings += (addr.chain_stats.funded_txo_sum - addr.chain_stats.spent_txo_count)
        })

        return _totalHoldings;
    };

    return { putAddress, getAddress, getAddresses, sumBalances }
} 
