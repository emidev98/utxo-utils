import "./ConfirmModal.scss";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
  IonButton,
  IonButtons,
} from "@ionic/react";
import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = "Confirm",
  message = "Are you sure?",
  confirmText = "Yes",
  cancelText = "No",
  onCancel,
  onConfirm,
}) => {
  return (
    <IonModal isOpen={isOpen} onWillDismiss={onCancel} className="ConfirmModal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>{title}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ConfirmModalContent ion-padding">
        <div className="ConfirmMessage">{message}</div>
      </IonContent>

      <IonFooter>
        <div className="ConfirmFooter">
          <IonButton expand="block" color="medium" onClick={onCancel}>
            {cancelText}
          </IonButton>
          <IonButton expand="block" color="danger" onClick={onConfirm}>
            {confirmText}
          </IonButton>
        </div>
      </IonFooter>
    </IonModal>
  );
};

export default ConfirmModal;
