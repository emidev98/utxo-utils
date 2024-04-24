import { Storage } from '@ionic/storage';
import { AddressInfo } from 'bitcoin-address-validation';

interface AddressInfoExtended extends AddressInfo {
    label: string;
}

export interface AddressStateObject {
    [key: string]: AddressInfo;
}

export const useAddresses = () => {
    const store = new Storage();

    const putAddress = async (address: AddressInfoExtended) => {
        const addresses = await getAddresses();

        addresses[address.address] = address;

        await store.set('addresses', addresses);
        return addresses;
    }

    const getAddress = async (address: string) => {
        const addresses = await getAddresses();
        return addresses[address];
    }

    const getAddresses = async () => {
        await store.create();
        const addresses = await store.get('addresses') as AddressStateObject;
        return addresses ? addresses : {};
    }

    return { putAddress, getAddress, getAddresses }
} 
