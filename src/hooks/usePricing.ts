import { Dispatch, SetStateAction } from "react";
import btc1DayAvgHistoricalDataUrl from "/btc-1-day-avg-historical.txt";
import { BitcoinHistoricalData } from "../models/BitcoinHistoricalData";
import { PRICING_STORE_KEY, useStorage } from "../context/StorageContext";

export interface PricingStore {
  coingeckoApiUrl: string;
  lastUpdateTime: number;
  price: number;
}
export const usePricing = () => {
  const { storage } = useStorage();
  const PRICING_CACHE_EXPIRING_TIME = 60_000;

  const getLatestPrice = async () => {
    const data: PricingStore = await storage.get(PRICING_STORE_KEY);
    const TIME_SINCE_LAST_UPDATE = Date.now() - data.lastUpdateTime;
    if (TIME_SINCE_LAST_UPDATE < PRICING_CACHE_EXPIRING_TIME) {
      return data.price;
    }

    const latestPriceRes = await fetch(
      `${data.coingeckoApiUrl}/simple/price?ids=bitcoin&vs_currencies=usd`,
    )
      .then((response) => response.json())
      .catch((error) => console.error("Error fetching data:", error));

    const price: number = latestPriceRes?.bitcoin?.usd
      ? latestPriceRes.bitcoin.usd
      : 0;
    data.price = price;
    data.lastUpdateTime = Date.now();
    await storage.set(PRICING_STORE_KEY, data);
    return price;
  };

  const updatePricingAPIUrl = async (url: string) => {
    let data: PricingStore = await storage.get(PRICING_STORE_KEY);
    data.coingeckoApiUrl = url;
    await storage.set(PRICING_STORE_KEY, data);
  };

  const getPricingApiUrl = async () => {
    const data: PricingStore = await storage.get(PRICING_STORE_KEY);
    return data.coingeckoApiUrl;
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
    PRICING_CACHE_EXPIRING_TIME,
    getLatestPrice,
    updatePricingAPIUrl,
    getPricingApiUrl,
    getBitcoinHistoricalData,
  };
};
