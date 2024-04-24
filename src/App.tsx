import { IonApp, IonContent, IonFab, IonFabButton, IonFabList, IonIcon, IonRouterOutlet, IonSplitPane, setupIonicReact, useIonRouter } from '@ionic/react';
import { Route, Switch } from 'react-router-dom';
import Menu from './components/menu/Menu';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.scss';

import './App.scss'
import { usePages } from './hooks/usePages';
import React, { useEffect, useState } from 'react';
import Header from './components/header/Header';
import { addOutline, addSharp } from 'ionicons/icons';
import NewAddress from './components/new-address/NewAddress';

setupIonicReact();

const App: React.FC = () => {
  const { pages, getCurrentPage } = usePages();
  const [isOpen, setOpen] = useState(false);
  const router = useIonRouter();

  // Load the first page in the app 
  // when user tries to access a page
  // that is not defined in the router
  useEffect(() => {
    const currentPage = getCurrentPage();
    router.push(currentPage.url);
  }, [])

  return (
    <IonApp>
      <IonSplitPane contentId="main" >
        <Menu />

        <IonRouterOutlet id="main">
          <IonContent fullscreen>
            <Header />
            <Switch>
              {pages.map((page, index) =>
                <Route key={index} path={page.url} exact render={page.component}></Route>
              )}
            </Switch>
          </IonContent>
        </IonRouterOutlet>

      </IonSplitPane>

      <IonFab slot="fixed" vertical="bottom" horizontal="end">
        <IonFabButton onClick={() => setOpen(true)}>
          <IonIcon ios={addOutline} md={addSharp} />
        </IonFabButton>
      </IonFab>

      <NewAddress isOpen={isOpen} onClose={() => setOpen(false)} />

    </IonApp >
  );
};

export default App;
