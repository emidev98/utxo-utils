import {
  IonButtons,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { useLatestPricingContext } from "../../context/LatestPriceContext";
import { USDFormatter } from "../../hooks/useFormatter";
import { Page, usePages } from "../../hooks/usePages";
import "./Header.scss";

const Header: React.FC = () => {
  const { getCurrentPage } = usePages();
  const [currentPage, setCurrentPage] = useState<Page>(getCurrentPage());
  const { pathname } = useLocation();
  const { latestPrice } = useLatestPricingContext();

  useEffect(() => {
    const _currentPage = getCurrentPage();

    setCurrentPage(_currentPage);
  }, [pathname]);

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
          {
            <IonTitle size="small" slot="end">
              1 ₿ = {USDFormatter(latestPrice)}
            </IonTitle>
          }
        </IonToolbar>
      </IonHeader>
    </div>
  );
};

export default Header;
