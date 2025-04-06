import "./Loader.scss";
import { IonLoading } from "@ionic/react";

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
