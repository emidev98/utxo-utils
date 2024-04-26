

import './Toast.scss';
import { IonToast } from '@ionic/react';

interface ToastProps {
    isOpen: boolean;
    message: string;
    color: string;
    onClick: () => void;
}

const AppToast: React.FC<ToastProps> = ({ isOpen, message, onClick, color }) => {
    return (
        <IonToast
            className="AppToast"
            isOpen={isOpen}
            onClick={onClick}
            message={message}
            color={color}
            position='top' />
    );
};

export default AppToast;
