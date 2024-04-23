
import { useLocation } from 'react-router-dom';
import './Header.scss';
import { IonButtons, IonHeader, IonIcon, IonMenuButton, IonTitle, IonToolbar } from '@ionic/react';
import { Page, usePages } from '../../hooks/usePages';
import { useEffect, useState } from 'react';
import { usePricing } from '../../hooks/usePricing';

const Header: React.FC = () => {
    const INTERVAL = 30_000;
    const { getCurrentPage } = usePages();
    const { loadLatestPrice, loadLatestPriceFromStoreOrZero } = usePricing();
    const [currentPage, setCurrentPage] = useState<Page>(getCurrentPage());
    const { pathname } = useLocation();
    const [price, setPrice] = useState("");

    useEffect(() => {
        const _currentPage = getCurrentPage();

        setCurrentPage(_currentPage)
    }, [pathname])

    useEffect(() => {
        // get the data from store so we don't  
        // spam the API on every app refresh
        (async ()=>{
            const latestPrice = await loadLatestPriceFromStoreOrZero(); 
            setPrice(latestPrice.toLocaleString());
        })();

        // Setup interval to fetch data periodically from API
        const interval = setInterval(async()=> {
            const latestPrice = await loadLatestPrice();
            setPrice(latestPrice.toLocaleString());
        }, INTERVAL);

        // Cleanup function to clear interval when component unmounts
        return () => clearInterval(interval);
    }, []); // Empty dependency array ensures that effect runs only once when component mounts

    return (
        <div className='Header'>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start"><IonMenuButton /></IonButtons>
                    <IonIcon className='PageIcon' slot="start" ios={currentPage?.iosIcon} md={currentPage?.mdIcon} />
                    <IonTitle>{currentPage?.title}</IonTitle>
                    {price !== "0" && <IonTitle size="small" slot="end">1BTC = {price} $</IonTitle>}
                </IonToolbar>
            </IonHeader>
        </div>
    );
};

export default Header;