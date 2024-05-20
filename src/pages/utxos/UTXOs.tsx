import { useEffect } from 'react';
import './UTXOs.scss';
import { useTxs } from '../../hooks/useTxs';
import { useAddresses } from '../../hooks/useAddresses';

const UTXOsPage = ({ }) => {
  const { getAllTxs } = useTxs();
  const { getAddresses } = useAddresses();

  useEffect(() => {
    const init = async () => {
      let [txsRes, addrRes] = await Promise.all([getAllTxs(), getAddresses()]);


      console.log("txsRes", txsRes)
      console.log("addrRes", addrRes)
    };
    init();
  }, [])

  return (
    <div className='UTXOsPage'>
      UTXOsPage
    </div>
  );
};

export default UTXOsPage;
