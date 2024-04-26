
import './NewAddress.scss';
import { IonButton, IonButtons, IonCheckbox, IonContent, IonFooter, IonHeader, IonIcon, IonInput, IonModal, IonTitle, IonToolbar } from '@ionic/react';
import { useState } from 'react';
import validate, { AddressInfo, getAddressInfo } from 'bitcoin-address-validation';
import { addOutline, closeOutline, closeSharp } from 'ionicons/icons';
import { useAddresses } from '../../hooks/useAddresses';
import { useMempoolApi } from '../../hooks/useMempoolApi';
import Loader from '../loader/Loader';
import AppToast from '../toast/Toast';

interface NewAddressProps {
    isOpen: boolean;
    onClose: () => void;
}

const TOAST_DURATION = 4000;

const NewAddress: React.FC<NewAddressProps> = ({ isOpen, onClose }) => {
    const [isValidInputLabel, setValidInputLabel] = useState<boolean>();
    const [isTouchedInputLabel, setTouchedInputLabel] = useState(false);
    const [addressLabel, setAddressLabel] = useState("");

    const [isValidInputAddress, setValidInputAddress] = useState<boolean>();
    const [isTouchedInputAddress, setTouchedInputAddress] = useState(false);
    const [addressDetails, setAddressDetails] = useState<AddressInfo>();

    const [indexInBackgroud, setIndexInBackgroud] = useState(false);
    const [displayError, setDisplayError] = useState(false);
    const [amountOfTxsToIndex, setAmountOfTxsToIndex] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { putTransactions, queryAllTxsGivenAddrInfo, queryAddrInfo } = useMempoolApi();

    const { putAddress, getAddress, trimAddress} = useAddresses();

    const onImportAddress = async () => {
        setIsLoading(true);
        if (addressDetails) {
            const isAlreadyDefined = await getAddress(addressDetails?.address);
            const addrInfo = await queryAddrInfo(addressDetails?.address);
            setAmountOfTxsToIndex(addrInfo.chain_stats.tx_count.toString())

            if (isAlreadyDefined) {
                setDisplayError(true);
                setValidInputAddress(false);
                setTimeout(() => setDisplayError(false), TOAST_DURATION);
            }
            else {
                putAddress({ ...addressDetails, label: addressLabel });

                if (indexInBackgroud) {
                    // TODO: Index in background
                } else {
                    const res = await queryAllTxsGivenAddrInfo(addrInfo);
                    await putTransactions(addrInfo.address, res)
                    console.log("res", res);
                }
            }
        }
        setIsLoading(false);
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

                {
                    /*
                    <IonCheckbox className="InputElement"
                    labelPlacement="end"
                    value={indexInBackgroud}
                    onClick={() => setIndexInBackgroud(!indexInBackgroud)}>
                    Import data in background and notify when done
                </IonCheckbox>
                    */
                }
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

            <Loader isOpen={isLoading}
                message={`Indexing ${amountOfTxsToIndex} txs for address ${trimAddress(addressDetails?.address)}`} />

            <AppToast isOpen={displayError}
                onClick={() => setDisplayError(false)}
                message={`Address ${trimAddress(addressDetails?.address)} already exists. Try providing a different address.`}
                color="warning"/>
        </IonModal>
    );
};

export default NewAddress;
