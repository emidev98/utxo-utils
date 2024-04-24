
import './NewAddress.scss';
import { IonButton, IonButtons, IonCheckbox, IonContent, IonFooter, IonHeader, IonIcon, IonInput, IonModal, IonTitle, IonToolbar } from '@ionic/react';
import { useState } from 'react';
import validate, { AddressInfo, getAddressInfo } from 'bitcoin-address-validation';
import { addOutline, closeOutline, closeSharp } from 'ionicons/icons';
import { useAddresses } from '../../hooks/useAddresses';
import { useMempoolApi } from '../../hooks/useMempoolApi';

interface NewAddressProps {
    isOpen: boolean;
    onClose: () => void;
}

const NewAddress: React.FC<NewAddressProps> = ({ isOpen, onClose }) => {
    const [isValidInputLabel, setValidInputLabel] = useState<boolean>();
    const [isTouchedInputLabel, setTouchedInputLabel] = useState(false);
    const [addressLabel, setAddressLabel] = useState("");

    const [isValidInputAddress, setValidInputAddress] = useState<boolean>();
    const [isTouchedInputAddress, setTouchedInputAddress] = useState(false);
    const [addressDetails, setAddressDetails] = useState<AddressInfo>();

    const [indexInBackgroud, setIndexInBackgroud] = useState(false);

    const { putAddress, getAddress } = useAddresses();
    const { getTxsByAddress } = useMempoolApi();

    const onImportAddress = async () => {
        if (addressDetails) {
            const isAlreadyDefined = await getAddress(addressDetails?.address);

            if (isAlreadyDefined) {
                // TODO: toast with error
            }
            else {
                putAddress({
                    ...addressDetails,
                    label: addressLabel
                });

                if (indexInBackgroud) {
                    // Index in background
                } else {
                    let txs = getTxsByAddress(addressDetails.address);
                    console.log(txs)

                }
            }
        }


    }

    const validateLabel = (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value;
        setAddressLabel(value);

        if (value?.length && value.length < 28) setValidInputLabel(true)
        else setValidInputLabel(false);
    };

    const validateBitcoinAddress = (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value;
        const isValid = validate(value);

        setValidInputAddress(isValid)

        if (isValid) {
            setAddressDetails(getAddressInfo(value));
        }
    }

    return (
        <IonModal className='NewAddress' isOpen={isOpen} onWillDismiss={onClose}>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>New address</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={onClose}>
                            <IonIcon ios={closeOutline} md={closeSharp} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                <IonInput
                    className={`InputElement ${isValidInputLabel && 'ion-valid'} ${isValidInputLabel === false && 'ion-invalid'} ${isTouchedInputLabel && 'ion-touched'}`}
                    label="* Address label"
                    labelPlacement="floating"
                    type="text"
                    helperText="Human redeable text to identify the address"
                    errorText='Label must have between 1 and 27 characters'
                    onIonInput={(event) => validateLabel(event)}
                    onIonBlur={() => setTouchedInputLabel(true)} />

                <IonInput
                    className={`InputElement ${isValidInputAddress && 'ion-valid'} ${isValidInputAddress === false && 'ion-invalid'} ${isTouchedInputAddress && 'ion-touched'}`}
                    label="* Address"
                    labelPlacement="floating"
                    type="text"
                    helperText="Required a valid Bitcoin adddres to analyze its UTXO"
                    errorText='Invalid Bitcoin address'
                    onIonInput={(event) => validateBitcoinAddress(event)}
                    onIonBlur={() => setTouchedInputAddress(true)} />

                <IonCheckbox className="InputElement"
                    labelPlacement="end"
                    value={indexInBackgroud}
                    onClick={() => setIndexInBackgroud(!indexInBackgroud)}>
                    Import data in background and notify when done
                </IonCheckbox>
            </IonContent>

            <IonFooter className='ModalFooter'>
                <IonButton
                    expand="block"
                    color="primary"
                    onClick={onImportAddress}
                    disabled={!isValidInputLabel || !isValidInputAddress}>
                    <IonIcon icon={addOutline}></IonIcon>
                    Import address
                </IonButton>
            </IonFooter>
        </IonModal>
    );
};

export default NewAddress;
