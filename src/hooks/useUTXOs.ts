import dayjs from "dayjs";
import { useStorage, UTXOS_STORE_KEY } from "../context/StorageContext";
import { UTXO } from "../models/MempoolAddressTxs";
import { LocalUTXO } from "../models/UTXOs";

export const useUTXOs = () => {
  const { storage } = useStorage();

  const updateUTXOs = async (addr: string, utxos: Array<UTXO>) => {
    const utxosStorage = (await storage.get(UTXOS_STORE_KEY)) as Record<
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
    const utxosStorage = (await storage.get(UTXOS_STORE_KEY)) as Record<
      string,
      LocalUTXO
    >;
    delete utxosStorage[addr];
    await storage.set(UTXOS_STORE_KEY, utxosStorage);
    return utxosStorage;
  };

  // return all UTXO's from your addresses, sorted ascending
  const getAllUTXOs = async (): Promise<Array<UTXO>> => {
    const utxosStorage = (await storage.get(UTXOS_STORE_KEY)) as Record<
      string,
      LocalUTXO
    >;
    if (Object.keys(utxosStorage).length === 0) {
      return [];
    }
    return Object.keys(utxosStorage)
      .flatMap(function (key) {
        const localUtxo = utxosStorage[key];
        return localUtxo.utxos.map(function (u) {
          return {
            ...u,
            block_time: dayjs(u.status.block_time * 1000),
            scriptpubkey_address: key,
          };
        });
      })
      .sort(function (a, b) {
        return a.status.block_height - b.status.block_height;
      });
  };

  const getUtxoFirstSyncDate = async () => {
    const utxosStorage = (await storage.get(UTXOS_STORE_KEY)) as Record<
      string,
      LocalUTXO
    >;
    if (Object.keys(utxosStorage).length === 0) {
      return undefined;
    }

    return Math.min.apply(
      null,
      Object.values(utxosStorage).map(function (localUtxo) {
        return localUtxo.lastUpdated;
      }),
    );
  };

  return {
    getAllUTXOs,
    updateUTXOs,
    deleteUTXOs,
    getUtxoFirstSyncDate,
  };
};
