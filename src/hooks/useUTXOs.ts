import _ from "lodash";
import { UTXO, VoutWithBlockTime } from "../models/MempoolAddressTxs";
import dayjs, { Dayjs } from "dayjs";
import { useStorage, UTXOS_STORE_KEY } from "../context/StorageContext";
import { LocalUTXO } from "../models/UTXOs";

export const useUTXOs = () => {
  const { storage } = useStorage();

  const updateUTXOs = async (addr: string, utxos: Array<UTXO>) => {
    let utxosStorage = (await storage.get(UTXOS_STORE_KEY)) as Record<
      string,
      LocalUTXO
    >;
    utxosStorage[addr] = {
      lastUpdated: dayjs().unix(),
      utxos,
    };

    await storage.set(UTXOS_STORE_KEY, utxosStorage);
    return utxosStorage;
  };

  const deleteUTXOs = async (addr: string) => {
    let utxosStorage = (await storage.get(UTXOS_STORE_KEY)) as Record<
      string,
      LocalUTXO
    >;
    delete utxosStorage[addr];
    await storage.set(UTXOS_STORE_KEY, utxosStorage);
    return utxosStorage;
  };

  // return all UTXO's from your addresses, sorted ascending
  const getAllUTXOs = async (): Promise<Array<UTXO>> => {
    let utxosStorage = (await storage.get(UTXOS_STORE_KEY)) as Record<
      string,
      LocalUTXO
    >;
    if (Object.keys(utxosStorage).length === 0) {
      return [];
    }
    return _.chain(utxosStorage)
      .map((localUtxo, key) =>
        localUtxo.utxos.map((u) => {
          return {
            ...u,
            block_time: dayjs(u.status.block_time * 1000),
            scriptpubkey_address: key,
          };
        }),
      )
      .flatten()
      .sort((a, b) => a.status.block_height - b.status.block_height)
      .value();
  };

  const getUtxoFirstSyncDate = async () => {
    let utxosStorage = (await storage.get(UTXOS_STORE_KEY)) as Record<
      string,
      LocalUTXO
    >;
    if (Object.keys(utxosStorage).length === 0) {
      return undefined;
    }

    return _.chain(utxosStorage)
      .map((localUtxo) => localUtxo.lastUpdated)
      .min()
      .value();
  };

  return {
    getAllUTXOs,
    updateUTXOs,
    deleteUTXOs,
    getUtxoFirstSyncDate,
  };
};
