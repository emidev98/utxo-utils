import {
  IonApp,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonSplitPane,
  setupIonicReact,
} from "@ionic/react";
import Menu from "./components/menu/Menu";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.scss";

import "./App.scss";
import { usePages } from "./hooks/usePages";
import React, { useEffect } from "react";
import Header from "./components/header/Header";
import { Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { ModalProvider } from "./context/ModalContext";
import { ToastProvider } from "./context/ToastContext";
import { StorageProvider } from "./context/StorageContext";

setupIonicReact();

const App: React.FC = () => {
  const { pages, getCurrentPage } = usePages();
  const navigate = useNavigate();

  // Load the first page when user tries to access
  // a page that is not defined in the router
  useEffect(() => {
    const currentPage = getCurrentPage();
    navigate(currentPage.url);
  }, []);

  return (
    <IonApp>
      <StorageProvider>
        <ToastProvider>
          <ModalProvider>
            <IonSplitPane contentId="main">
              <Menu />

              <IonContent id="main" fullscreen>
                <Header />
                <div id="PageContent">
                  <Routes>
                    {pages.map((page, index) => (
                      <Route
                        key={index}
                        path={page.url}
                        element={page.component}
                      />
                    ))}
                  </Routes>
                  <Outlet />
                </div>
              </IonContent>
            </IonSplitPane>
          </ModalProvider>
        </ToastProvider>
      </StorageProvider>
    </IonApp>
  );
};

export default App;
