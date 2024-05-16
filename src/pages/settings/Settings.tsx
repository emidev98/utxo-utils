import React, { useEffect, useState } from 'react';
import './Settings.scss';
import { IonCard, IonCardContent, IonCardTitle, IonButton, IonInput } from '@ionic/react';
import { usePricing } from '../../hooks/usePricing';
import { useMempoolApi } from '../../hooks/useMempoolApi';
import { useTxs } from '../../hooks/useTxs';
import { useAddresses } from '../../hooks/useAddresses';

const SettingsPage: React.FC = () => {
  const [mempoolAPIUrl, setMempoolAPIUrl] = useState<string>('');
  const [mempoolUrlValid, setMempoolUrlValid] = useState<boolean>(true);
  const [mempoolTouched, setMempoolTouched] = useState<boolean>(true);

  const [coingeckoAPIUrl, setCoingeckoApiUrl] = useState<string>('');
  const [coingeckoUrlValid, setCoingeckoUrlValid] = useState<boolean>(true);
  const [coingeckoTouched, setCoingeckoTouched] = useState<boolean>(true);

  const { updatePricingAPIUrl, getPricingApiUrl, resetPricingData} = usePricing();
  const { getStoredData, updateMempoolAPIUrl, resetMempoolData } = useMempoolApi();
  const { resetTransactionsData} = useTxs();
  const { resetAddressesData } = useAddresses();

  useEffect(() => {
    // Load the stored API URL
    const init = async () => {
      const url = await getPricingApiUrl();
      setCoingeckoApiUrl(url);
      const mempoolData = await getStoredData();
      setMempoolAPIUrl(mempoolData.mempoolAPIUrl);
    };
    init();
  }, [])

  const validateMempoolURL = (event: Event) => {
    const url = (event.target as HTMLInputElement).value;
    try {
      new URL(url);
      setMempoolUrlValid(true);
    }
    catch (e) {
      console.log(e)
      setMempoolUrlValid(false);
    }
    setMempoolAPIUrl(url);
  };

  const validateCoingeckoURL = (event: Event) => {
    const url = (event.target as HTMLInputElement).value;
    try {
      new URL(url);
    }
    catch (e) {
      console.log(e)
      setCoingeckoUrlValid(false);
    }
    setCoingeckoApiUrl(url);
  }

  const onSetAPIUrls = () => {
    updatePricingAPIUrl(coingeckoAPIUrl);
    updateMempoolAPIUrl(mempoolAPIUrl);
  }

  const onSyncFromAPI = () => {

  }

  const onResetData = () => {
    resetPricingData()
    resetMempoolData()
    resetTransactionsData()
    resetAddressesData()
  }

  return (
    <div className="SettingsPage">
      <IonCard>
        <IonCardTitle>Sync data</IonCardTitle>
        <IonCardContent className='SettingsCardContent'>
          <div>Sync your app with the latest data from the blockchain API, including wallets, transactions, prices, and more. This process might take some time depending on the amount of data, your network speed, and when you last synced.</div>
          <div><IonButton onClick={onSyncFromAPI}>Sync</IonButton></div>
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardTitle>API URLS</IonCardTitle>
        <IonCardContent>
          <IonInput className={`InputElement ${mempoolTouched && 'ion-touched'} ${mempoolUrlValid === false ? 'ion-invalid' : ""}`}
            label="Mempool Space API URL"
            labelPlacement="floating"
            type="text"
            value={mempoolAPIUrl}
            errorText="Invalid url"
            helperText="Mempool Space API URL (https://mempool.space/docs/faq)"
            onIonInput={(event) => validateMempoolURL(event)} 
            onIonBlur={()=>setMempoolTouched(true)}/>

          <IonInput className={`InputElement ${coingeckoTouched && 'ion-touched'} ${coingeckoUrlValid === false && 'ion-invalid'}`}
            label="Coingecko API URL"
            labelPlacement="floating"
            type="text"
            value={coingeckoAPIUrl}
            errorText="Invalid url"
            helperText="Coingecko API URL (https://docs.coingecko.com/v3.0.1/reference/introduction)"
            onIonInput={(event) => validateCoingeckoURL(event)} 
            onIonBlur={()=>setCoingeckoTouched(true)}/>

          <div className='AlignFooterEnd'><IonButton onClick={onSetAPIUrls}>Set Urls</IonButton></div>
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardTitle>Reset data</IonCardTitle>
        <IonCardContent className='SettingsCardContent'>
          <div>
            Delete all stored data from the application including wallets, transactions, prices and set it to the initial state as when open for the first time. This action is irreversible!
          </div>
          <div><IonButton color="danger" onClick={onResetData}>Reset data</IonButton></div>
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default SettingsPage;
