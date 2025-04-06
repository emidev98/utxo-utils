import { IonFab, IonFabButton, IonIcon } from "@ionic/react";
import React, { createContext, useState, useContext } from "react";
import { addOutline, addSharp } from "ionicons/icons";
import NewAddress from "../components/new-address/NewAddress";

interface IModalContext {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

// Create a context with default values
const ModalContext = createContext<IModalContext>({
  isOpen: false,
  openModal: () => {},
  closeModal: () => {},
});

// Define the Provider component
export const ModalProvider: React.FC<{ children: JSX.Element }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <ModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}

      <IonFab slot="fixed" vertical="bottom" horizontal="end">
        <IonFabButton onClick={() => openModal()}>
          <IonIcon ios={addOutline} md={addSharp} />
        </IonFabButton>
      </IonFab>

      <NewAddress isOpen={isOpen} onClose={() => closeModal()} />
    </ModalContext.Provider>
  );
};

// Custom hook to use the context
export const useModalContext = (): IModalContext => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModalContext must be used within a ModalProvider");
  }
  return context;
};
