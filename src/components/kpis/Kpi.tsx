import { useEffect, useState } from "react";
import "./Kpi.scss";
import {
  IonCard,
  IonCardContent,
  IonCardSubtitle,
  IonCardTitle,
  IonSkeletonText,
} from "@ionic/react";

interface KpiProps {
  title: string;
  value?: number | string;
  loading?: boolean;
  formatter?: (value: number | string) => string;
}

const Kpi = ({ value, title, formatter, loading }: KpiProps) => {
  const [_value, setValue] = useState("-");

  useEffect(() => {
    if (formatter && value !== undefined) {
      setValue(formatter(value));
    } else {
      setValue(value?.toString() || "-");
    }
  }, [value, title, formatter, loading]);

  return (
    <IonCard className="Kpi">
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
          <IonCardTitle>{_value}</IonCardTitle>
          <IonCardSubtitle>{title}</IonCardSubtitle>
        </IonCardContent>
      )}
    </IonCard>
  );
};

export default Kpi;
