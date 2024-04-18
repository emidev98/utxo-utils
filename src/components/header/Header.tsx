
import { useLocation } from 'react-router-dom';
import './Header.scss';
import { IonButtons, IonHeader, IonIcon, IonMenuButton, IonTitle, IonToolbar } from '@ionic/react';
import { Page, usePages } from '../../hooks/usePages';
import { useEffect, useState } from 'react';

const Header: React.FC = () => {
    const { getCurrentPage } = usePages();
    const [currentPage, setCurrentPage] = useState<Page>(getCurrentPage());
    const { pathname } = useLocation();

    useEffect(() => {
        const _currentPage = getCurrentPage();

        setCurrentPage(_currentPage)
    }, [pathname])

    return (
        <div className='Header'>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start"><IonMenuButton /></IonButtons>

                    <IonIcon className='PageIcon' slot="start" ios={currentPage?.iosIcon} md={currentPage?.mdIcon}/>

                    <IonTitle>{currentPage?.title}</IonTitle>
                </IonToolbar>
            </IonHeader>
        </div>
    );
};

export default Header;
