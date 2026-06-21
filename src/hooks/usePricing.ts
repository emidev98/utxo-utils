import { CoinGeckoClient } from "../clients/CoinGeckoClient";
import { PRICING_STORE_KEY, useStorage } from "../context/StorageContext";
import { BitcoinHistoricalData } from "../models/BitcoinHistoricalData";
import btc1DayAvgHistoricalDataUrl from "/btc-1-day-avg-historical.txt";

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

    const client = new CoinGeckoClient(data.coingeckoApiUrl);
    const price = await client.getLatestBtcPriceUsd();

    data.price = price;
    data.lastUpdateTime = Date.now();
    await storage.set(PRICING_STORE_KEY, data);
    return price;
  };

  const updatePricingAPIUrl = async (url: string) => {
    const data: PricingStore = await storage.get(PRICING_STORE_KEY);
    data.coingeckoApiUrl = url;
    await storage.set(PRICING_STORE_KEY, data);
  };

  const getPricingApiUrl = async () => {
    const data: PricingStore = await storage.get(PRICING_STORE_KEY);
    return data.coingeckoApiUrl;
  };

  const getBitcoinHistoricalData = async (): Promise<
    BitcoinHistoricalData[]
  > => {
    return fetch(btc1DayAvgHistoricalDataUrl).then(async (res) => {
      const buffer = await res.text();
      return buffer.split(",").map(BitcoinHistoricalData.fromEntryFileValue);
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
