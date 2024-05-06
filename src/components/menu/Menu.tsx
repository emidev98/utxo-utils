import {
  IonContent,
  IonIcon,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonMenuToggle,
  IonNote,
} from '@ionic/react';

import { useLocation } from 'react-router';
import './Menu.scss';
import { logoGithub } from 'ionicons/icons';
import { usePages } from '../../hooks/usePages';
import { NavLink } from 'react-router-dom';

const Menu: React.FC = () => {
  const location = useLocation();
  const { pages } = usePages();

  return (
    <IonMenu className="AppMenu" contentId="main" type="overlay">
      <IonContent>
        <IonList id="inbox-list">
          <IonListHeader>UTXO Utils</IonListHeader>
          <IonNote className="github-info">
            <IonIcon aria-hidden="true" md={logoGithub}></IonIcon>
            <span>emidev98/utxo-utils</span>
          </IonNote>
          {pages.map((page, index) => {
            return (
              <NavLink key={index} className="MenuEntry" to={page.url}>
                <IonIcon ios={page.iosIcon} md={page.mdIcon} />
                <IonLabel>{page.title}</IonLabel>
              </NavLink>
            );
          })}
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default Menu;
