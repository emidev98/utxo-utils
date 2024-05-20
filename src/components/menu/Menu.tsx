import {
  IonContent,
  IonIcon,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonNote,
} from '@ionic/react';

import './Menu.scss';
import { logoGithub } from 'ionicons/icons';
import { usePages } from '../../hooks/usePages';
import { NavLink } from 'react-router-dom';

const Menu: React.FC = () => {
  const { pages } = usePages();

  return (
    <IonMenu className="AppMenu" contentId="main" type="overlay">
      <IonContent>
        <IonList id="inbox-list">
          <IonListHeader>
            <img src="/logo-x256.png" alt="logo" className='AppLogo'/>
            <span>UTXO Utils</span>
          </IonListHeader>
          <IonNote className="github-info">
            <a onClick={()=>window.open('https://github.com/emidev98/utxo-utils/', '_blank')}>
              <IonIcon aria-hidden="true" md={logoGithub}></IonIcon>
              <span>emidev98/utxo-utils</span>
            </a>
          </IonNote>
          {pages.map((page, index) => {
            return (
              <NavLink key={index} className={`MenuEntry ` + (page.className ? page.className : "")} to={page.url}>
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
