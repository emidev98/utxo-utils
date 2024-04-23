import { Storage } from '@ionic/storage';


export const usePricing = () => {
    const store = new Storage();

    const loadLatestPrice = async () => {
        await store.create();

        const latestPriceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
            .then(response => response.json())
            .catch(error => console.error('Error fetching data:', error));

        const price = latestPriceRes.bitcoin.usd as number;
        store.set('price', price);
        return price;
    }

    const loadLatestPriceFromStoreOrZero = async () => {
        await store.create();

        let price = await store.get('price') as number | undefined;

        return price ? price : 0;
    }
    return { loadLatestPrice, loadLatestPriceFromStoreOrZero }
} 
