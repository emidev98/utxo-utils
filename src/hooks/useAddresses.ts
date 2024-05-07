import { Storage } from '@ionic/storage';
import { AddressInfo } from 'bitcoin-address-validation';
import { useEffect, useState } from 'react';
import { TransactionsStorage, useTxs } from './useTxs';
import _ from 'lodash';

interface AddressInfoExtended extends AddressInfo {
    label: string;
}

export interface AddressStateObject {
    [key: string]: AddressInfo;
}

const ADDRESS_STORAGE_KEY = 'addresses';

export const useAddresses = () => {
    const [store] = useState(new Storage());
    const { splitSTXOandUTXO } = useTxs();

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

    const trimAddress = (address?: string) => {
        if (!address) return "";

        return `${address.substring(0, 6)}...${address.substring(address.length - 4, address.length)}`;
    }

    const countAddresses = (addresses: AddressStateObject) => {
        return Object.keys(addresses).length;
    }

    const sumUTXO = (txStore: TransactionsStorage, addrStore: AddressStateObject) => {
        const splitted = splitSTXOandUTXO(txStore, addrStore);
        const _totalHoldings = _.chain(splitted)
            .flatMap(tx => tx.utxo)
            .filter(tx => {
                // Check if any of the vout addresses are in the address list
                const isInputToExistingAddress = !!_.find(tx.vout, (vout) => addrStore[vout.scriptpubkey_address] !== undefined);

                return isInputToExistingAddress;
            })
            .sumBy(tx => {
                return _.sumBy(tx.vout, (vout) => {
                    if (addrStore[vout.scriptpubkey_address] !== undefined) {
                        return vout.value;
                    }
                    return 0;
                });
            })
            .value();

        return _totalHoldings;
    };

    return { putAddress, getAddress, getAddresses, trimAddress, countAddresses, sumUTXO }
} 
