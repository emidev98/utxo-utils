import {
  IonApp,
  IonContent,
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
import "@ionic/react/css/display.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";

/* Theme variables */
import "./theme/variables.scss";

import React, { useEffect } from "react";
import {
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./App.scss";
import Header from "./components/header/Header";
import { LatestPriceContext } from "./context/LatestPriceContext";
import { StorageProvider } from "./context/StorageContext";
import { ToastProvider } from "./context/ToastContext";
import { usePages } from "./hooks/usePages";
import ExchangeDetailPage from "./pages/exchanges/exchange-detail/ExchangeDetailPage";

setupIonicReact();

const App: React.FC = () => {
  const { pages, getCurrentPage } = usePages();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Load the first page when user tries to access
  // a page that is not defined in the router
  useEffect(() => {
    const currentPage = getCurrentPage();
    const isNestedPagePath = pathname.startsWith(`${currentPage.url}/`);
    if (pathname === currentPage.url || isNestedPagePath) {
      return;
    }
    navigate(currentPage.url);
  }, []);

  return (
    <IonApp>
      <StorageProvider>
        <LatestPriceContext>
          <ToastProvider>
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
                    <Route
                      path="/exchanges/:exchangeId"
                      element={<ExchangeDetailPage />}
                    />
                  </Routes>
                  <Outlet />
                </div>
              </IonContent>
            </IonSplitPane>
          </ToastProvider>
        </LatestPriceContext>
      </StorageProvider>
    </IonApp>
  );
};

export default App;
