import { AddressInfo as AddressInfoComputed } from "bitcoin-address-validation";
import { AddressInfo } from "../models/MempoolAddress";
import { TransactionsStorage } from "./useTxs";
import { ADDRESSES_STORE_KEY, useStorage } from "../context/StorageContext";
import _forEach from "lodash/forEach";

export interface AddressInfoExtended extends AddressInfoComputed, AddressInfo {
  label: string;
}

export interface AddressStateObject {
  [key: string]: AddressInfoExtended;
}

export const useAddresses = () => {
  const { storage } = useStorage();

  const putAddress = async (address: AddressInfoExtended) => {
    const addresses = await getAddresses();

    addresses[address.address] = address;

    await storage.set(ADDRESSES_STORE_KEY, addresses);
    return addresses;
  };

  const getAddress = async (address: string) => {
    const addresses = await getAddresses();
    return addresses[address];
  };

  const getAddresses = async () => {
    const addresses = (await storage.get(
      ADDRESSES_STORE_KEY,
    )) as AddressStateObject;
    return addresses ? addresses : {};
  };

  const sumBalances = (addrStore: AddressStateObject) => {
    let _totalHoldings = 0;

    _forEach(addrStore, (addr) => {
      _totalHoldings +=
        addr.chain_stats.funded_txo_sum - addr.chain_stats.spent_txo_sum;
    });

    return _totalHoldings;
  };

  const sumTxsFeesPaid = (
    txStore: TransactionsStorage,
    addrStore: AddressStateObject,
  ) => {
    const addresses = Object.keys(addrStore);
    let feesPaid = 0;
    addresses.forEach((addr) => {
      txStore[addr].forEach((tx) => {
        tx.vin.forEach((vin) => {
          if (vin.prevout.scriptpubkey_address.includes(addr)) {
            feesPaid += tx.fee;
          }
        });
      });
    });

    return feesPaid;
  };

  return {
    putAddress,
    getAddress,
    getAddresses,
    sumBalances,
    sumTxsFeesPaid,
  };
};
