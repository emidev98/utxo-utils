import { useMempoolApi } from '../hooks/useMempoolApi';

addEventListener('fetchTransactionsForAddress', async (resolve, reject, args) => {
    try {
        const { getAllTransactions } = useMempoolApi(args.address);
        const res = await getAllTransactions();

        resolve(res);
    } catch (err) {
        console.error(err);
        reject(err);
    }
});