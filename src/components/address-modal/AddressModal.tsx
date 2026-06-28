import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import validate, {
  AddressInfo,
  getAddressInfo,
} from "bitcoin-address-validation";
import {
  addOutline,
  closeOutline,
  closeSharp,
  saveOutline,
} from "ionicons/icons";
import { useEffect, useState } from "react";
import { AddressInfoExtended, useAddresses } from "../../hooks/useAddresses";
import { addressFormatter } from "../../hooks/useFormatter";
import { useMempoolApi } from "../../hooks/useMempoolApi";
import { useTxs } from "../../hooks/useTxs";
import { useUTXOs } from "../../hooks/useUTXOs";
import Loader from "../loader/Loader";
import AppToast from "../toast/Toast";
import "./AddressModal.scss";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  addressToEdit?: AddressInfoExtended;
}

const TOAST_DURATION = 4000;

const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  addressToEdit,
}) => {
  const [isValidInputLabel, setValidInputLabel] = useState<boolean>();
  const [isTouchedInputLabel, setTouchedInputLabel] = useState(false);
  const [addressLabel, setAddressLabel] = useState("");

  const [isValidInputAddress, setValidInputAddress] = useState<boolean>();
  const [isTouchedInputAddress, setTouchedInputAddress] = useState(false);
  const [addressDetails, setAddressDetails] = useState<AddressInfo>();

  // TODO: Index in background
  const [toast, setToastData] = useState({
    isOpen: false,
    message: "",
    color: "",
  });
  const [amountOfTxsToIndex, setAmountOfTxsToIndex] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { queryAllTxsGivenAddrInfo, queryAddrInfo, queryUtxos } =
    useMempoolApi();
  const { appendTxs } = useTxs();
  const { updateUTXOs } = useUTXOs();

  const { putAddress, getAddress } = useAddresses();

  const onImportAddress = async () => {
    setIsLoading(true);
    setAmountOfTxsToIndex("");
    // If we're editing an existing address, update its label and return
    if (addressToEdit) {
      try {
        await putAddress({ ...addressToEdit, label: addressLabel });
        setToastData({
          isOpen: true,
          message: `Address ${addressFormatter(addressToEdit.address)} updated successfully!`,
          color: "success",
        });
        setTimeout(() => {
          setToastData({ isOpen: false, message: "", color: "" });
        }, TOAST_DURATION);
      } finally {
        setIsLoading(false);
      }
      return onClose();
    }

    if (addressDetails) {
      const isAlreadyDefined = await getAddress(addressDetails.address);
      const addrInfo = await queryAddrInfo(addressDetails.address);
      if (addrInfo instanceof Error) {
        return setToastData({
          isOpen: true,
          message: `Something went wrong indexing the data ${JSON.stringify(addrInfo)}.`,
          color: "error",
        });
      }

      setAmountOfTxsToIndex(addrInfo.chain_stats.tx_count.toString());

      if (isAlreadyDefined) {
        setToastData({
          isOpen: true,
          message: `Address ${addressFormatter(addressDetails.address)} already exists! Try providing a different address.`,
          color: "warning",
        });
        setValidInputAddress(false);
      } else {
        const [txs, utxos] = await Promise.all([
          queryAllTxsGivenAddrInfo(addrInfo),
          queryUtxos(addrInfo.address),
        ]);
        if (txs instanceof Error || utxos instanceof Error) {
          return setToastData({
            isOpen: true,
            message: `Something went wrong indexing the data ${JSON.stringify(addrInfo)}.`,
            color: "error",
          });
        }

        await Promise.all([
          appendTxs(addrInfo.address, txs),
          putAddress({
            ...addressDetails,
            ...addrInfo,
            label: addressLabel,
          }),
          updateUTXOs(addrInfo.address, utxos),
        ]);

        setAddressLabel("");
        setAddressDetails({ ...addressDetails, address: "" });
        setToastData({
          isOpen: true,
          message: `${txs.length} txs indexed for address ${addressFormatter(addressDetails.address)} successfully!`,
          color: "success",
        });
        setTimeout(() => {
          setToastData({
            isOpen: false,
            message: "",
            color: "",
          });
        }, TOAST_DURATION);
      }
    }

    setIsLoading(false);
    return onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    if (addressToEdit) {
      setAddressLabel(addressToEdit.label || "");
      setAddressDetails(addressToEdit);
      setValidInputLabel(
        addressToEdit?.label?.length > 0 && addressToEdit?.label?.length < 100,
      );
      setValidInputAddress(true);
      setTouchedInputLabel(false);
      setTouchedInputAddress(false);
    } else {
      // New address mode: reset form
      setAddressLabel("");
      setAddressDetails(undefined);
      setValidInputLabel(false);
      setValidInputAddress(false);
      setTouchedInputLabel(false);
      setTouchedInputAddress(false);
    }
  }, [isOpen, addressToEdit]);

  const validateLabel = (ev: Event) => {
    const value = (ev.target as HTMLInputElement).value;
    setAddressLabel(value);

    if (value?.length && value.length < 100) setValidInputLabel(true);
    else setValidInputLabel(false);
  };

  const validateBitcoinAddress = (ev: Event) => {
    const value = (ev.target as HTMLInputElement).value;
    const isValid = validate(value);

    setValidInputAddress(isValid);

    if (isValid) {
      setAddressDetails(getAddressInfo(value));
    }
  };

  return (
    <>
      <IonModal
        className="NewManualAddress"
        isOpen={isOpen}
        onWillDismiss={onClose}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>
              {addressToEdit ? "Edit address" : "New address"}
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={onClose}>
                <IonIcon ios={closeOutline} md={closeSharp} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          <IonInput
            className={`InputElement ${isValidInputLabel && "ion-valid"} ${isValidInputLabel === false && "ion-invalid"} ${isTouchedInputLabel && "ion-touched"}`}
            label="Address label *"
            labelPlacement="floating"
            type="text"
            value={addressLabel}
            helperText="Human redeable text to identify the address"
            errorText="Label can have a maximum of 100 characters"
            onIonInput={(event: Event) => validateLabel(event)}
            onIonBlur={() => setTouchedInputLabel(true)}
          />

          <IonInput
            className={`InputElement ${isValidInputAddress && "ion-valid"} ${isValidInputAddress === false && "ion-invalid"} ${isTouchedInputAddress && "ion-touched"}`}
            label="Address *"
            labelPlacement="floating"
            type="text"
            value={addressDetails?.address}
            disabled={!!addressToEdit}
            helperText="Required a valid Bitcoin adddres to analyze its UTXO"
            errorText="Invalid Bitcoin address"
            onIonInput={(event: Event) => validateBitcoinAddress(event)}
            onIonBlur={() => setTouchedInputAddress(true)}
          />
        </IonContent>

        <IonFooter className="ModalFooter">
          <IonButton
            expand="block"
            color="primary"
            onClick={onImportAddress}
            disabled={!isValidInputLabel || !isValidInputAddress}
          >
            <IonIcon
              className="ModalFooterIcon"
              icon={addressToEdit ? saveOutline : addOutline}
            ></IonIcon>
            {addressToEdit ? "Save" : "Import address"}
          </IonButton>
        </IonFooter>

        <Loader
          isOpen={isLoading}
          message={`Indexing ${amountOfTxsToIndex} txs for address ${addressFormatter(addressDetails?.address)}`}
        />
      </IonModal>

      <AppToast
        isOpen={toast.isOpen}
        onClick={() => setToastData({ isOpen: false, message: "", color: "" })}
        message={toast.message}
        color={toast.color}
      />
    </>
  );
};

export default AddressModal;
