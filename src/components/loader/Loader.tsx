import { IonLoading } from "@ionic/react";
import "./Loader.scss";

interface LoaderProps {
  isOpen: boolean;
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ isOpen, message }) => {
  return (
    <IonLoading
      className="AppLoader"
      spinner="circles"
      isOpen={isOpen}
      message={message}
    />
  );
};

export default Loader;
