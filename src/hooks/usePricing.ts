import { Storage } from '@ionic/storage';
import { useEffect, useState } from 'react';

export interface PricingStore {
    coingeckoApiUrl: string;
    price: number;
}
const STORE_KEY = 'pricing_store';
export const usePricing = () => {
    const [store] = useState(new Storage());

    useEffect(() => {
        const initializeStorage = async () => {
            await store.create();
            if (!await store.get(STORE_KEY)) {
                await store.set(STORE_KEY, {
                    coingeckoApiUrl: 'https://api.coingecko.com/api/v3',
                    price: 0
                })
            }
        };
        initializeStorage();
    }, [store]);

    const loadLatestPrice = async () => {
        let data: PricingStore = await store.get(STORE_KEY);
        const latestPriceRes = await fetch(`${data.coingeckoApiUrl}/simple/price?ids=bitcoin&vs_currencies=usd`)
            .then(response => response.json())
            .catch(error => console.error('Error fetching data:', error));

        const price = latestPriceRes?.bitcoin?.usd as number ? latestPriceRes.bitcoin.usd : 0;
        data.price = price;
        await store.set(STORE_KEY, data);
        return price;
    }

    const loadLatestPriceFromStoreOrZero = async () => {
        const data: PricingStore = await store.get(STORE_KEY);
        return data.price ? data.price : 0;
    }

    const updatePricingAPIUrl = async (url: string) => {
        let data: PricingStore = await store.get(STORE_KEY);
        data.coingeckoApiUrl = url;
        await store.set(STORE_KEY, data);
    }

    const getPricingApiUrl = async () => {
        const data: PricingStore = await store.get(STORE_KEY);
        return data.coingeckoApiUrl;
    }

    const resetPricingData = async () => {
        await store.set(STORE_KEY, {
            coingeckoApiUrl: 'https://api.coingecko.com/api/v3',
            price: 0
        });
    }

    return { loadLatestPrice, loadLatestPriceFromStoreOrZero, updatePricingAPIUrl, getPricingApiUrl, resetPricingData }
} 
