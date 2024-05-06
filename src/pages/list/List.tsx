import { useEffect } from 'react';
import './List.scss';
import { useTxs } from '../../hooks/useTxs';
import { useAddresses } from '../../hooks/useAddresses';

const ListPage = ({ }) => {
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
    <div className='ListPage'>
      ListPage
    </div>
  );
};

export default ListPage;
