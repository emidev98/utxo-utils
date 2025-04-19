import { useLocation } from "react-router";
import "./Header.scss";
import {
  IonButtons,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { Page, usePages } from "../../hooks/usePages";
import { useEffect, useState } from "react";
import { usePricing } from "../../hooks/usePricing";
import { USDFormatter } from "../../hooks/useFormatter";

const Header: React.FC = () => {
  const { getCurrentPage } = usePages();
  const { pollLatestPrice } = usePricing();
  const [latestPrice, setLatestPrice] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<Page>(getCurrentPage());
  const { pathname } = useLocation();
  const [price, setPrice] = useState("");

  useEffect(() => {
    const _currentPage = getCurrentPage();

    setCurrentPage(_currentPage);
  }, [pathname]);

  useEffect(pollLatestPrice(setLatestPrice), []);

  return (
    <div className="Header">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonIcon
            className={
              "PageIcon " + (currentPage.className ? currentPage.className : "")
            }
            slot="start"
            ios={currentPage?.iosIcon}
            md={currentPage?.mdIcon}
          />
          <IonTitle>{currentPage?.title}</IonTitle>
          {price !== "0" && (
            <IonTitle size="small" slot="end">
              1 ₿ = {USDFormatter(latestPrice)} $
            </IonTitle>
          )}
        </IonToolbar>
      </IonHeader>
    </div>
  );
};

export default Header;
