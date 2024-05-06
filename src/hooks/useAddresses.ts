import { Storage } from '@ionic/storage';
import { AddressInfo } from 'bitcoin-address-validation';
import { useEffect, useState } from 'react';

interface AddressInfoExtended extends AddressInfo {
    label: string;
}

export interface AddressStateObject {
    [key: string]: AddressInfo;
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

    const trimAddress = (address?: string) => {
        if (!address) return "";

        return `${address.substring(0, 6)}...${address.substring(address.length - 4, address.length)}`;
    }

    return { putAddress, getAddress, getAddresses, trimAddress }
} 
