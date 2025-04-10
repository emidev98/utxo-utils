import { Storage } from "@ionic/storage";
import { useEffect, useState } from "react";
import btc1DayAvgHistoricalDataUrl from "/btc-1-day-avg-historical.txt";
// TODO: consider another way to import the file
// if we're penalized on speed
import { BitcoinHistoricalData } from "../models/BitcoinHistoricalData";

export interface PricingStore {
  coingeckoApiUrl: string;
  price: number;
}
const STORE_KEY = "pricing_store";
export const usePricing = () => {
  const [store] = useState(new Storage());

  useEffect(() => {
    const initializeStorage = async () => {
      await store.create();
      if (!(await store.get(STORE_KEY))) {
        await store.set(STORE_KEY, {
          coingeckoApiUrl: "https://api.coingecko.com/api/v3",
          price: 0,
        });
      }
    };
    initializeStorage();
  }, [store]);

  const loadLatestPrice = async () => {
    let data: PricingStore = await store.get(STORE_KEY);
    const latestPriceRes = await fetch(
      `${data.coingeckoApiUrl}/simple/price?ids=bitcoin&vs_currencies=usd`,
    )
      .then((response) => response.json())
      .catch((error) => console.error("Error fetching data:", error));

    const price = (latestPriceRes?.bitcoin?.usd as number)
      ? latestPriceRes.bitcoin.usd
      : 0;
    data.price = price;
    await store.set(STORE_KEY, data);
    return price;
  };

  const loadLatestPriceFromStoreOrZero = async () => {
    const data: PricingStore = await store.get(STORE_KEY);
    return data.price ? data.price : 0;
  };

  const updatePricingAPIUrl = async (url: string) => {
    let data: PricingStore = await store.get(STORE_KEY);
    data.coingeckoApiUrl = url;
    await store.set(STORE_KEY, data);
  };

  const getPricingApiUrl = async () => {
    const data: PricingStore = await store.get(STORE_KEY);
    return data.coingeckoApiUrl;
  };

  const resetPricingData = async () => {
    await store.set(STORE_KEY, {
      coingeckoApiUrl: "https://api.coingecko.com/api/v3",
      price: 0,
    });
  };

  const getBitcoinHistoricalData = async (): Promise<
    BitcoinHistoricalData[] | Error
  > => {
    return fetch(btc1DayAvgHistoricalDataUrl)
      .then(async (res) => {
        let buffer = await res.text();
        return buffer.split(",").map(BitcoinHistoricalData.fromEntryFileValue);
      })
      .catch((e) => {
        return e;
      });
  };

  return {
    loadLatestPrice,
    loadLatestPriceFromStoreOrZero,
    updatePricingAPIUrl,
    getPricingApiUrl,
    resetPricingData,
    getBitcoinHistoricalData,
  };
};
