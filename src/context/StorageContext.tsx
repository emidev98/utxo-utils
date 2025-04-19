import React, { createContext, useContext, useEffect, useState } from "react";
import { Storage } from "@ionic/storage";

type StorageContextType = {
  storage: Storage;
  resetStorage: () => {};
  ready: boolean;
};

const StorageContext = createContext<StorageContextType>({
  storage: new Storage(),
  resetStorage: async () => {},
  ready: false,
});

export const PRICING_STORE_KEY = "pricing_store";
export const TXS_STORE_KEY = "transactions";
export const MEMPOOL_STORE_KEY = "mempool_store";
export const ADDRESSES_STORE_KEY = "addresses";

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [storage, setStorage] = useState<Storage>(new Storage());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const instance = await storage.create();
        await setStorageData();
        setStorage(instance);
        setReady(true);
      } catch (err) {
        console.error("Failed to initialize Storage:", err);
        setReady(false);
      }
    };
    init();
  }, []);

  const setStorageData = async (overwritte = false) => {
    const mempoolData = await storage.get(MEMPOOL_STORE_KEY);
    const txData = await storage.get(TXS_STORE_KEY);
    const pricingData = await storage.get(PRICING_STORE_KEY);
    const addressesData = await storage.get(ADDRESSES_STORE_KEY);

    if (!mempoolData || overwritte) {
      await storage.set(MEMPOOL_STORE_KEY, {
        mempoolAPIUrl: "https://mempool.space/api",
      });
    }

    if (!txData || overwritte) {
      await storage.set(TXS_STORE_KEY, {
        transactions: {},
      });
    }

    if (!pricingData || overwritte) {
      await storage.set(PRICING_STORE_KEY, {
        coingeckoApiUrl: "https://api.coingecko.com/api/v3",
        price: 0,
        lastUpdateTime: Date.now(),
      });
    }

    if (!addressesData || overwritte) {
      await storage.set(ADDRESSES_STORE_KEY, {});
    }
  };
  const resetStorage = () => setStorageData(true);

  return (
    <StorageContext.Provider value={{ storage, ready, resetStorage }}>
      {ready ? children : ""}
    </StorageContext.Provider>
  );
};

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (!context.storage) {
    console.warn("Storage not ready yet or used outside of provider");
  }
  return context;
};
