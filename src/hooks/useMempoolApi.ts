export const useMempoolApi = () => {

    const getTxsByAddress = async (address: string) => {
        const res = await fetch(`https://mempool.space/api/address/${address}/txs`)
            .then(response => response.json())
            .catch(error => console.error('Error fetching data:', error));


        return res;
    }

    return { getTxsByAddress };
} 
