import { useEffect } from 'react';
import './SimpleKpi.scss';
import { useTxs } from '../../../hooks/useTxs';
import { useAddresses } from '../../../hooks/useAddresses';
import { IonCard, IonCardContent, IonCardSubtitle, IonCardTitle, IonSkeletonText } from '@ionic/react';

interface SimpleKpiProps {
  amount: number | string;
  message: string;
  loading?: boolean;
}

const SimpleKpi = ({ amount, message, loading }: SimpleKpiProps) => {
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
    <IonCard className='SimpleKpi'>
      {loading
        ? <IonCardContent>
          <IonSkeletonText animated={true} className='SkeletonTitle'></IonSkeletonText>
          <IonSkeletonText animated={true} className='SkeletonSubTitle'></IonSkeletonText>
        </IonCardContent>
        : <IonCardContent>
          <IonCardTitle>{amount}</IonCardTitle>
          <IonCardSubtitle>{message}</IonCardSubtitle>
        </IonCardContent>}
    </IonCard>
  );
};

export default SimpleKpi;
