import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonInput,
  IonItem,
  IonLabel,
  IonToggle,
} from "@ionic/react";
import React, { useEffect, useState } from "react";
import AppToast from "../../components/toast/Toast";
import { useAppSettings } from "../../hooks/useAppSettings";
import { useMempoolApi } from "../../hooks/useMempoolApi";
import { usePricing } from "../../hooks/usePricing";
import "./Settings.scss";

const SettingsPage: React.FC = () => {
  const [mempoolAPIUrl, setMempoolAPIUrl] = useState<string>("");
  const [mempoolUrlValid, setMempoolUrlValid] = useState<boolean>(true);
  const [mempoolTouched, setMempoolTouched] = useState<boolean>(true);

  const [coingeckoAPIUrl, setCoingeckoApiUrl] = useState<string>("");
  const [coingeckoUrlValid, setCoingeckoUrlValid] = useState<boolean>(true);
  const [coingeckoTouched, setCoingeckoTouched] = useState<boolean>(true);
  const [confirmDestructiveActions, setConfirmDestructiveActions] =
    useState(true);

  const { updatePricingAPIUrl, getPricingApiUrl } = usePricing();
  const { getStoredData, updateMempoolAPIUrl } = useMempoolApi();
  const { getSettings, updateSettings } = useAppSettings();
  const [toast, setToastData] = useState({
    isOpen: false,
    message: "",
    color: "",
  });

  useEffect(() => {
    // Load the stored API URL
    const init = async () => {
      const url = await getPricingApiUrl();
      setCoingeckoApiUrl(url);
      const mempoolData = await getStoredData();
      setMempoolAPIUrl(mempoolData.mempoolAPIUrl);
      const settings = await getSettings();
      setConfirmDestructiveActions(settings.confirmDestructiveActions);
    };
    init();
  }, []);

  const validateMempoolURL = (event: Event) => {
    const url = (event.target as HTMLInputElement).value;
    try {
      new URL(url);
      setMempoolUrlValid(true);
    } catch {
      setMempoolUrlValid(false);
    }
    setMempoolAPIUrl(url);
  };

  const validateCoingeckoURL = (event: Event) => {
    const url = (event.target as HTMLInputElement).value;
    try {
      new URL(url);
      setCoingeckoUrlValid(true);
    } catch {
      setCoingeckoUrlValid(false);
    }
    setCoingeckoApiUrl(url);
  };

  const onSetAPIUrls = () => {
    updatePricingAPIUrl(coingeckoAPIUrl);
    updateMempoolAPIUrl(mempoolAPIUrl);
    setToastData({
      isOpen: true,
      message: `API URL updated successfully! The next requests will be made to the new URL.`,
      color: "success",
    });
  };

  const onConfirmDestructiveActionsChanged = async (checked: boolean) => {
    setConfirmDestructiveActions(checked);
    await updateSettings({ confirmDestructiveActions: checked });
    setToastData({
      isOpen: true,
      message: checked
        ? "Destructive action confirmations enabled."
        : "Destructive action confirmations disabled.",
      color: "success",
    });
  };

  return (
    <div className="SettingsPage">
      <IonCard>
        <IonCardTitle>API URLs</IonCardTitle>
        <IonCardContent>
          <IonInput
            className={`InputElement ${mempoolTouched && "ion-touched"} ${mempoolUrlValid === false ? "ion-invalid" : ""}`}
            label="Mempool Space API URL"
            labelPlacement="floating"
            type="text"
            value={mempoolAPIUrl}
            errorText="Invalid url"
            helperText="Mempool Space API URL (https://mempool.space/docs/faq)"
            onIonInput={(event) => validateMempoolURL(event)}
            onIonBlur={() => setMempoolTouched(true)}
          />

          <IonInput
            className={`InputElement ${coingeckoTouched && "ion-touched"} ${coingeckoUrlValid === false && "ion-invalid"}`}
            label="Coingecko API URL"
            labelPlacement="floating"
            type="text"
            value={coingeckoAPIUrl}
            errorText="Invalid url"
            helperText="Coingecko API URL (https://docs.coingecko.com/v3.0.1/reference/introduction)"
            onIonInput={(event) => validateCoingeckoURL(event)}
            onIonBlur={() => setCoingeckoTouched(true)}
          />

          <div className="AlignFooterEnd">
            <IonButton onClick={onSetAPIUrls}>Set URLs</IonButton>
          </div>
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardTitle>Safety</IonCardTitle>
        <IonCardContent>
          <IonItem lines="none">
            <IonLabel>
              Confirm destructive actions
              <p>Ask before deleting or replacing local data.</p>
            </IonLabel>
            <IonToggle
              checked={confirmDestructiveActions}
              onIonChange={(event) =>
                void onConfirmDestructiveActionsChanged(event.detail.checked)
              }
            />
          </IonItem>
        </IonCardContent>
      </IonCard>

      <AppToast
        isOpen={toast.isOpen}
        onClick={() => setToastData({ isOpen: false, message: "", color: "" })}
        onDidDismiss={() =>
          setToastData({ isOpen: false, message: "", color: "" })
        }
        message={toast.message}
        color={toast.color}
      />
    </div>
  );
};

export default SettingsPage;
