import { useEffect, useState } from "react";
import "./SimpleKpi.scss";
import {
  IonCard,
  IonCardContent,
  IonCardSubtitle,
  IonCardTitle,
  IonSkeletonText,
} from "@ionic/react";

interface SimpleKpiProps {
  title: string;
  value?: number | string;
  loading?: boolean;
  formatter?: (value: number | string) => string;
}

const SimpleKpi = ({ value, title, formatter, loading }: SimpleKpiProps) => {
  const [_value, setValue] = useState("-");

  useEffect(() => {
    if (formatter && value !== undefined) {
      setValue(formatter(value));
    } else {
      setValue(value?.toString() || "-");
    }
  }, [value, title, formatter, loading]);

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
          <IonCardTitle>{_value}</IonCardTitle>
          <IonCardSubtitle>{title}</IonCardSubtitle>
        </IonCardContent>
      )}
    </IonCard>
  );
};

export default SimpleKpi;
