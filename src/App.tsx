import { IonApp, IonContent, IonRouterOutlet, IonSplitPane, setupIonicReact } from '@ionic/react';
import { Route } from 'react-router-dom';
import Menu from './components/Menu';

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
import React from 'react';
import Header from './components/header/Header';

setupIonicReact();

const App: React.FC = () => {
  const { pages } = usePages();

  return (
    <IonApp>
      <IonSplitPane contentId="main" >
        <Menu />

        <IonRouterOutlet id="main">
          <IonContent fullscreen>
            <Header />

            {pages.map((page, index) =>
              <Route key={index} path={page.url} exact render={page.component}></Route>
            )}
          </IonContent>
        </IonRouterOutlet>

      </IonSplitPane>
    </IonApp >
  );
};

export default App;
