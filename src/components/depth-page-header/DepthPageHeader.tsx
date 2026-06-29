import { IonButton, IonIcon } from "@ionic/react";
import { chevronBackOutline } from "ionicons/icons";
import React from "react";
import "./DepthPageHeader.scss";

interface DepthPageHeaderProps {
  backLabel: string;
  onBack: () => void;
  children: React.ReactNode;
  meta?: React.ReactNode;
}

const DepthPageHeader: React.FC<DepthPageHeaderProps> = ({
  backLabel,
  onBack,
  children,
  meta,
}) => {
  return (
    <section className="DepthPageHeader">
      <IonButton fill="clear" color="dark" onClick={onBack}>
        <IonIcon icon={chevronBackOutline} slot="start" />
        {backLabel}
      </IonButton>

      <div className="DepthPageHeaderMain">{children}</div>

      {meta && <div className="DepthPageHeaderMeta">{meta}</div>}
    </section>
  );
};

export default DepthPageHeader;
