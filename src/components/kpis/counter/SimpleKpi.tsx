import "./SimpleKpi.scss";
import {
  IonCard,
  IonCardContent,
  IonCardSubtitle,
  IonCardTitle,
  IonSkeletonText,
} from "@ionic/react";

interface SimpleKpiProps {
  amount: number | string;
  message: string;
  loading?: boolean;
}

const SimpleKpi = ({ amount, message, loading }: SimpleKpiProps) => {
  return (
    <IonCard className="SimpleKpi">
      {loading ? (
        <IonCardContent>
          <IonSkeletonText
            animated={true}
            className="SkeletonTitle"
          ></IonSkeletonText>
          <IonSkeletonText
            animated={true}
            className="SkeletonSubTitle"
          ></IonSkeletonText>
        </IonCardContent>
      ) : (
        <IonCardContent>
          <IonCardTitle>{amount}</IonCardTitle>
          <IonCardSubtitle>{message}</IonCardSubtitle>
        </IonCardContent>
      )}
    </IonCard>
  );
};

export default SimpleKpi;
