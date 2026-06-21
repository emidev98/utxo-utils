import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useExchanges } from "../../../hooks/useExchanges";
import { ExchangeAccount } from "../../../models/ExchangeData";
import "./ExchangeDetailPage.scss";

const ExchangeDetailPage = () => {
  const { exchangeId } = useParams();
  const { getExchange } = useExchanges();

  const [loading, setLoading] = useState(true);
  const [exchange, setExchange] = useState<ExchangeAccount | undefined>();

  useEffect(() => {
    const init = async () => {
      if (!exchangeId) {
        setExchange(undefined);
        setLoading(false);
        return;
      }

      const account = await getExchange(exchangeId);
      setExchange(account);
      setLoading(false);
    };

    init();
  }, [exchangeId, getExchange]);

  return (
    <div className="ExchangeDetailPage">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>
            {loading
              ? "Loading exchange..."
              : (exchange?.name ?? "Exchange not found")}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <pre>
            {JSON.stringify(
              exchange ?? { error: "Exchange not found", exchangeId },
              null,
              2,
            )}
          </pre>
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default ExchangeDetailPage;
