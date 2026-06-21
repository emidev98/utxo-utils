import { IonButton, IonIcon } from "@ionic/react";
import { cloudUploadOutline, documentOutline } from "ionicons/icons";
import React, { useRef, useState } from "react";
import "./FileDropzone.scss";

interface FileDropzoneProps {
  accept?: string;
  fileName?: string;
  emptyTitle?: string;
  filledTitle?: string;
  chooseButtonLabel?: string;
  changeButtonLabel?: string;
  disabled?: boolean;
  className?: string;
  onFileSelected: (file: File) => void | Promise<void>;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({
  accept = ".csv,.txt",
  fileName,
  emptyTitle = "Drag or click to choose a file",
  filledTitle = "Replace file",
  chooseButtonLabel = "Choose file",
  changeButtonLabel = "Change file",
  disabled = false,
  className = "",
  onFileSelected,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const onPickFile = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const onFileChanged = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;

    await onFileSelected(file);

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDropFile = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;

    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    await onFileSelected(file);
  };

  const onDragOverFile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;

    if (!isDragActive) {
      setIsDragActive(true);
    }
  };

  const onDragLeaveFile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;

    setIsDragActive(false);
  };

  const dropzoneClasses = [
    "FileDropzone",
    isDragActive ? "is-active" : "",
    disabled ? "is-disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="FileDropzoneRoot">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="HiddenFileInput"
        onChange={onFileChanged}
        disabled={disabled}
      />

      <div
        className={dropzoneClasses}
        onClick={onPickFile}
        onDrop={onDropFile}
        onDragOver={onDragOverFile}
        onDragLeave={onDragLeaveFile}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPickFile();
          }
        }}
      >
        <IonIcon icon={cloudUploadOutline} className="DropzoneIcon" />
        <div className="DropzoneTitle">
          {fileName ? filledTitle : emptyTitle}
        </div>
        <IonButton
          fill="outline"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onPickFile();
          }}
          disabled={disabled}
        >
          <IonIcon slot="start" icon={documentOutline} />
          {fileName ? changeButtonLabel : chooseButtonLabel}
        </IonButton>
      </div>
    </div>
  );
};

export default FileDropzone;
