import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonMenuToggle,
  IonNote,
} from '@ionic/react';

import { useLocation } from 'react-router-dom';
import './Menu.scss';
import { logoGithub } from 'ionicons/icons';
import { usePages } from '../../hooks/usePages';

const Menu: React.FC = () => {
  const location = useLocation();
  const { pages } = usePages();

  return (
    <IonMenu contentId="main" type="overlay">
      <IonContent>
        <IonList id="inbox-list">
          <IonListHeader>UTXO Utils</IonListHeader>
          <IonNote className='github-info'>
            <IonIcon aria-hidden="true" md={logoGithub}></IonIcon>
            <span>emidev98/utxo-utils</span>
          </IonNote>
          {pages.map((page, index) => {
            return (
              <IonMenuToggle key={index} autoHide={false}>
                <IonItem className={location.pathname === page.url ? 'selected' : ''} routerLink={page.url} routerDirection="none" lines="none" detail={false}>
                  <IonIcon aria-hidden="true" slot="start" ios={page.iosIcon} md={page.mdIcon} />
                  <IonLabel>{page.title}</IonLabel>
                </IonItem>
              </IonMenuToggle>
            );
          })}
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default Menu;
