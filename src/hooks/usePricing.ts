import { Storage } from '@ionic/storage';
import { useEffect, useState } from 'react';

export const usePricing = () => {
    const [store] = useState(new Storage());

    useEffect(() => {
        const initializeStorage = async () => {
            await store.create();
        };
        initializeStorage();
    }, [store]);

    const loadLatestPrice = async () => {
        const latestPriceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
            .then(response => response.json())
            .catch(error => console.error('Error fetching data:', error));

        const price = latestPriceRes.bitcoin.usd as number;
        await store.set('price', price);
        return price;
    }

    const loadLatestPriceFromStoreOrZero = async () => {
        const price = await store.get('price') as number | undefined;
        return price ? price : 0;
    }
    return { loadLatestPrice, loadLatestPriceFromStoreOrZero }
} 
