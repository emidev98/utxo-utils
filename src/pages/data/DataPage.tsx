import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import React, { useEffect, useRef, useState } from "react";
import ConfirmModal from "../../components/confirm-modal/ConfirmModal";
import Loader from "../../components/loader/Loader";
import AppToast from "../../components/toast/Toast";
import { useAppSettings } from "../../hooks/useAppSettings";
import { useDataManagement } from "../../hooks/useDataManagement";
import { addressFormatter } from "../../hooks/useFormatter";
import {
  ConflictResolution,
  ImportMode,
  ProgressiveConflictConfig,
} from "../../models/DataExport";
import "./DataPage.scss";

type ConfirmAction = "replace-import" | "reset" | null;

const DataPage: React.FC = () => {
  const { syncFromAPI, exportDataToJson, importDataFromJson, resetCoreData } =
    useDataManagement();
  const { getSettings } = useAppSettings();

  const [isLoading, setIsLoading] = useState(false);
  const [currentAddr, setCurrentAddr] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [toast, setToastData] = useState({
    isOpen: false,
    message: "",
    color: "",
  });

  const [importMode, setImportMode] = useState<ImportMode>("replace");
  const [importFileName, setImportFileName] = useState("");
  const [pendingImportContent, setPendingImportContent] = useState<
    string | null
  >(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmDestructiveActions, setConfirmDestructiveActions] =
    useState(true);

  const [addressConflict, setAddressConflict] = useState<
    ConflictResolution | ""
  >("");
  const [txConflict, setTxConflict] = useState<ConflictResolution | "">("");
  const [utxoConflict, setUtxoConflict] = useState<ConflictResolution | "">("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initSettings = async () => {
      const settings = await getSettings();
      setConfirmDestructiveActions(settings.confirmDestructiveActions);
    };

    void initSettings();
  }, []);

  const setToast = (message: string, color: string) => {
    setToastData({ isOpen: true, message, color });
  };

  const onSyncFromAPI = async () => {
    setIsLoading(true);
    setLoadingMessage("Syncing blockchain data...");
    setCurrentAddr("");

    try {
      const summary = await syncFromAPI((addr) => {
        setCurrentAddr(addr);
        setLoadingMessage(
          `Syncing new transactions for address ${addressFormatter(addr)}`,
        );
      });

      setToast(
        `Sync complete. Synced ${summary.syncedAddresses} addresses and appended ${summary.appendedTransactions} transactions.`,
        "success",
      );
    } catch {
      setToast(
        `Error syncing data for address ${addressFormatter(currentAddr)}. Please try again later.`,
        "warning",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onExportData = async () => {
    setIsLoading(true);
    setLoadingMessage("Preparing data export...");

    try {
      const { content, fileName, payload } = await exportDataToJson();
      const blob = new Blob([content], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);

      setToast(
        `Exported ${payload.metadata.addressCount} addresses, ${payload.metadata.txCount} transactions, ${payload.metadata.utxoCount} UTXOs, ${payload.metadata.exchangeCount ?? 0} exchanges and ${payload.metadata.exchangeTxCount ?? 0} exchange transactions.`,
        "success",
      );
    } catch {
      setToast("Could not export local data.", "danger");
    } finally {
      setIsLoading(false);
    }
  };

  const onPickImportFile = () => {
    fileInputRef.current?.click();
  };

  const onImportFileChanged = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      setImportFileName(file.name);
      setPendingImportContent(content);
      setToast(`Loaded import file ${file.name}.`, "medium");
    } catch {
      setToast("Could not read selected import file.", "danger");
    }
  };

  const getProgressiveConfig = (): ProgressiveConflictConfig | null => {
    if (!addressConflict || !txConflict || !utxoConflict) {
      return null;
    }

    return {
      addresses: addressConflict,
      transactions: txConflict,
      utxos: utxoConflict,
    };
  };

  const canRunImport = () => {
    if (!pendingImportContent) {
      return false;
    }

    if (importMode === "replace") {
      return true;
    }

    return Boolean(getProgressiveConfig());
  };

  const onImportClick = () => {
    if (!pendingImportContent) {
      setToast("Select a JSON file before importing.", "warning");
      return;
    }

    if (importMode === "progressive" && !getProgressiveConfig()) {
      setToast(
        "Define all progressive conflict rules before importing.",
        "warning",
      );
      return;
    }

    if (importMode === "replace") {
      if (!confirmDestructiveActions) {
        void runImport();
        return;
      }

      setConfirmAction("replace-import");
      return;
    }

    void runImport();
  };

  const runImport = async () => {
    if (!pendingImportContent) {
      return;
    }

    const progressiveConfig =
      importMode === "progressive" ? getProgressiveConfig() : undefined;

    setIsLoading(true);
    setLoadingMessage("Importing data...");

    try {
      const summary = await importDataFromJson(
        pendingImportContent,
        importMode,
        progressiveConfig ?? undefined,
      );

      setToast(
        `Import complete. Addresses +${summary.insertedAddresses}/${summary.replacedAddresses} replaced, transactions +${summary.insertedTransactions}/${summary.replacedTransactions} replaced, UTXOs +${summary.insertedUtxos}/${summary.replacedUtxos} replaced, exchanges +${summary.insertedExchanges}/${summary.insertedExchangeTransactions} txs merged.`,
        "success",
      );
    } catch (error) {
      if (error instanceof Error) {
        setToast(error.message, "danger");
      } else {
        setToast("Import failed. Please verify the JSON file.", "danger");
      }
    } finally {
      setIsLoading(false);
      setConfirmAction(null);
    }
  };

  const onResetData = async () => {
    setIsLoading(true);
    setLoadingMessage("Resetting local data...");

    try {
      await resetCoreData();
      setToast(
        "Data reset successfully! The app is now in the initial state.",
        "success",
      );
    } catch {
      setToast("Could not reset local data.", "danger");
    } finally {
      setIsLoading(false);
      setConfirmAction(null);
    }
  };

  return (
    <div className="DataPage">
      <div className="DataPageIntro">
        <h2>Data center</h2>
        <p>
          Keep your local dataset healthy with quick tools for syncing,
          exporting, importing, and resetting.
        </p>
      </div>

      <IonCard className="DataFeatureCard">
        <IonCardTitle>Sync data</IonCardTitle>
        <IonCardContent className="DataCardContent">
          <div className="FeatureText">
            <p className="FeatureSummary">
              Pull only new blockchain activity into your local storage.
            </p>
            <p className="FeatureHint">
              Best used after adding new addresses or after a long offline
              session.
            </p>
          </div>
          <div className="AlignFooterEnd">
            <IonButton onClick={onSyncFromAPI}>Sync</IonButton>
          </div>
        </IonCardContent>
      </IonCard>

      <IonCard className="DataFeatureCard">
        <IonCardTitle>Export data</IonCardTitle>
        <IonCardContent className="DataCardContent">
          <div className="FeatureText">
            <p className="FeatureSummary">
              Download a JSON backup of addresses, transactions, UTXOs, and
              exchanges.
            </p>
            <p className="FeatureHint">
              Use this before changing devices or before risky operations.
            </p>
          </div>
          <div className="AlignFooterEnd">
            <IonButton onClick={onExportData}>Export</IonButton>
          </div>
        </IonCardContent>
      </IonCard>

      <IonCard className="DataFeatureCard">
        <IonCardTitle>Import data</IonCardTitle>
        <IonCardContent>
          <p className="FeatureSummary ImportSummaryText">
            Restore from a JSON backup using replace or progressive mode.
          </p>

          <IonItem lines="none">
            <IonLabel>Import mode</IonLabel>
            <IonSelect
              value={importMode}
              interface="popover"
              onIonChange={(event) =>
                setImportMode(event.detail.value as ImportMode)
              }
            >
              <IonSelectOption value="replace">Replace</IonSelectOption>
              <IonSelectOption value="progressive">Progressive</IonSelectOption>
            </IonSelect>
          </IonItem>

          <p className="FeatureHint">
            Replace: overwrites the current dataset. Progressive: inserts only
            new items and resolves duplicates by your selected rules.
          </p>

          {importMode === "progressive" && (
            <div className="ConflictSection">
              <p className="FeatureHint ConflictTitle">
                Conflict handling for existing records
              </p>
              <IonItem lines="none" className="ConflictSelector">
                <IonLabel>Addresses</IonLabel>
                <IonSelect
                  value={addressConflict}
                  interface="popover"
                  onIonChange={(event) =>
                    setAddressConflict(
                      event.detail.value as ConflictResolution | "",
                    )
                  }
                >
                  <IonSelectOption value="replace-imported">
                    Replace with imported
                  </IonSelectOption>
                  <IonSelectOption value="keep-existing">
                    Keep existing app data
                  </IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonItem lines="none" className="ConflictSelector">
                <IonLabel>Transactions</IonLabel>
                <IonSelect
                  value={txConflict}
                  interface="popover"
                  onIonChange={(event) =>
                    setTxConflict(event.detail.value as ConflictResolution | "")
                  }
                >
                  <IonSelectOption value="replace-imported">
                    Replace with imported
                  </IonSelectOption>
                  <IonSelectOption value="keep-existing">
                    Keep existing app data
                  </IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonItem lines="none" className="ConflictSelector">
                <IonLabel>UTXOs</IonLabel>
                <IonSelect
                  value={utxoConflict}
                  interface="popover"
                  onIonChange={(event) =>
                    setUtxoConflict(
                      event.detail.value as ConflictResolution | "",
                    )
                  }
                >
                  <IonSelectOption value="replace-imported">
                    Replace with imported
                  </IonSelectOption>
                  <IonSelectOption value="keep-existing">
                    Keep existing app data
                  </IonSelectOption>
                </IonSelect>
              </IonItem>
            </div>
          )}

          <div className="DataCardContent ImportStatus">
            <div className="ImportFileLabel">
              {importFileName
                ? `Selected file: ${importFileName}`
                : "No file selected"}
            </div>
            <div className="AlignFooterEnd">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="HiddenFileInput"
                onChange={onImportFileChanged}
              />
              <IonButton fill="outline" onClick={onPickImportFile}>
                Choose
              </IonButton>
              <IonButton onClick={onImportClick} disabled={!canRunImport()}>
                Import
              </IonButton>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      <IonCard className="DataFeatureCard DangerFeatureCard">
        <IonCardTitle>Reset data</IonCardTitle>
        <IonCardContent className="DataCardContent">
          <div className="FeatureText">
            <p className="FeatureSummary">
              Remove all local addresses, transactions, UTXOs, and exchanges.
            </p>
            <p className="FeatureHint">
              This action is irreversible and should be used only when starting
              from scratch.
            </p>
          </div>
          <div className="AlignFooterEnd">
            <IonButton
              color="danger"
              onClick={() => {
                if (!confirmDestructiveActions) {
                  void onResetData();
                  return;
                }

                setConfirmAction("reset");
              }}
            >
              Reset data
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>

      <ConfirmModal
        isOpen={confirmAction !== null}
        title={confirmAction === "reset" ? "Reset data" : "Replace data"}
        message={
          confirmAction === "reset"
            ? "This will delete all current local data. This action is irreversible."
            : "This will replace your current local dataset with the selected file. Continue?"
        }
        confirmText={confirmAction === "reset" ? "Reset" : "Replace"}
        cancelText="Cancel"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction === "reset") {
            void onResetData();
            return;
          }

          void runImport();
        }}
      />

      <AppToast
        isOpen={toast.isOpen}
        onClick={() => setToastData({ isOpen: false, message: "", color: "" })}
        onDidDismiss={() =>
          setToastData({ isOpen: false, message: "", color: "" })
        }
        message={toast.message}
        color={toast.color}
      />

      <Loader isOpen={isLoading} message={loadingMessage} />
    </div>
  );
};

export default DataPage;
