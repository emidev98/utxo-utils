import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import {
  checkmarkCircleOutline,
  closeOutline,
  documentOutline,
  warningOutline,
} from "ionicons/icons";
import { useRef, useState } from "react";
import { useToastContext } from "../../context/ToastContext";
import { useExchanges } from "../../hooks/useExchanges";
import {
  CSVColumnMapping,
  ExchangeAccount,
  ParsedExchangeTx,
} from "../../models/ExchangeData";
import {
  detectParser,
  IExchangeCSVParser,
  ManualMappingParser,
  parseCSVText,
} from "../../utils/csvParsers/index";
import Loader from "../loader/Loader";
import "./ExchangeModal.scss";

interface ExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When provided the modal opens in "import CSV" mode for an existing account */
  existingExchange?: ExchangeAccount;
}

type Step = "details" | "upload" | "mapping" | "preview";

/** Canonical field definitions shown in the manual mapping UI */
const CANONICAL_FIELDS: Array<{
  key: keyof CSVColumnMapping;
  label: string;
  required: boolean;
}> = [
  { key: "timestamp", label: "Timestamp", required: true },
  { key: "amount", label: "Amount", required: true },
  { key: "currency", label: "Currency", required: true },
  { key: "type", label: "Transaction type", required: true },
  { key: "txHash", label: "Transaction hash / txid", required: false },
  { key: "fiatAmount", label: "Fiat amount", required: false },
  { key: "fiatCurrency", label: "Fiat currency", required: false },
  { key: "fee", label: "Fee", required: false },
  { key: "feeCurrency", label: "Fee currency", required: false },
  { key: "description", label: "Description", required: false },
];

const ExchangeModal: React.FC<ExchangeModalProps> = ({
  isOpen,
  onClose,
  existingExchange,
}) => {
  const { putExchange, appendTransactions } = useExchanges();
  const { setOpenToast } = useToastContext();

  // Determine initial step based on mode
  const initialStep: Step = existingExchange ? "upload" : "details";

  const [step, setStep] = useState<Step>(initialStep);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1 – Exchange details
  const [exchangeName, setExchangeName] = useState(
    existingExchange?.name ?? "",
  );
  const [isTouchedName, setTouchedName] = useState(false);
  const isNameValid = exchangeName.trim().length > 0;

  // Step 2 – CSV upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [detectedParser, setDetectedParser] =
    useState<IExchangeCSVParser | null>(null);
  const [parsedTxs, setParsedTxs] = useState<ParsedExchangeTx[]>([]);

  // Step 3 – Manual column mapping
  const [columnMapping, setColumnMapping] = useState<Partial<CSVColumnMapping>>(
    {},
  );

  const resetState = () => {
    setStep(initialStep);
    setExchangeName(existingExchange?.name ?? "");
    setTouchedName(false);
    setCsvFileName("");
    setCsvHeaders([]);
    setCsvRows([]);
    setDetectedParser(null);
    setParsedTxs([]);
    setColumnMapping({});
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // ─── Step 1 handlers ────────────────────────────────────────────────────

  const onContinueToUpload = () => {
    setTouchedName(true);
    if (!isNameValid) return;
    setStep("upload");
  };

  const onSaveWithoutCSV = async () => {
    setTouchedName(true);
    if (!isNameValid) return;

    if (!existingExchange) {
      const account: ExchangeAccount = {
        id: crypto.randomUUID(),
        name: exchangeName.trim(),
        createdAt: Math.floor(Date.now() / 1000),
        transactions: [],
      };
      await putExchange(account);
      setOpenToast({
        message: `Exchange "${account.name}" created.`,
        color: "success",
      });
    } else {
      await putExchange({ ...existingExchange, name: exchangeName.trim() });
      setOpenToast({ message: "Exchange updated.", color: "success" });
    }

    handleClose();
  };

  // ─── Step 2 handlers ────────────────────────────────────────────────────

  const onPickFile = () => fileInputRef.current?.click();

  const onFileChanged = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const { headers, rows } = parseCSVText(text);
      setCsvFileName(file.name);
      setCsvHeaders(headers);
      setCsvRows(rows);
      const parser = detectParser(headers);
      setDetectedParser(parser);
      setParsedTxs([]);
      setColumnMapping({});
    } catch {
      setOpenToast({
        message: "Could not read the selected file.",
        color: "danger",
      });
    }

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onContinueAfterUpload = () => {
    if (!csvRows.length) return;

    if (detectedParser) {
      const parsed = detectedParser.parse(csvRows);
      setParsedTxs(parsed);
      setStep("preview");
    } else {
      setStep("mapping");
    }
  };

  // ─── Step 3 handlers ────────────────────────────────────────────────────

  const onMappingChange = (field: keyof CSVColumnMapping, value: string) => {
    setColumnMapping((prev) => ({ ...prev, [field]: value }));
  };

  const isMappingComplete =
    !!columnMapping.timestamp &&
    !!columnMapping.amount &&
    !!columnMapping.currency &&
    !!columnMapping.type;

  const onApplyMapping = () => {
    if (!isMappingComplete) return;
    const parser = new ManualMappingParser(columnMapping as CSVColumnMapping);
    const parsed = parser.parse(csvRows);
    setParsedTxs(parsed);
    setStep("preview");
  };

  // ─── Step 4 – Import ─────────────────────────────────────────────────────

  const onImport = async () => {
    if (!parsedTxs.length) return;
    setIsLoading(true);

    try {
      let targetId = existingExchange?.id;

      if (!targetId) {
        const newAccount: ExchangeAccount = {
          id: crypto.randomUUID(),
          name: exchangeName.trim(),
          createdAt: Math.floor(Date.now() / 1000),
          transactions: [],
        };
        await putExchange(newAccount);
        targetId = newAccount.id;
      }

      const { inserted, duplicates } = await appendTransactions(
        targetId,
        parsedTxs,
      );

      setOpenToast({
        message: `Imported ${inserted} transaction${inserted !== 1 ? "s" : ""}${duplicates > 0 ? `, skipped ${duplicates} duplicate${duplicates !== 1 ? "s" : ""}` : ""}.`,
        color: "success",
      });

      handleClose();
    } catch {
      setOpenToast({
        message: "Import failed. Please try again.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render helpers ──────────────────────────────────────────────────────

  const renderStepDetails = () => (
    <>
      <IonContent className="ExchangeModalContent ion-padding">
        <p className="StepHint">
          Give this exchange account a name. You can import a CSV in the next
          step or skip it and add transactions later.
        </p>
        <IonItem>
          <IonInput
            className={`InputElement ${isNameValid ? "ion-valid" : ""} ${!isNameValid && isTouchedName ? "ion-invalid" : ""} ${isTouchedName ? "ion-touched" : ""}`}
            label="Exchange name *"
            labelPlacement="floating"
            value={exchangeName}
            placeholder="e.g. Binance, Crypto.com, Revolut"
            helperText="A label to identify this exchange account"
            errorText="Exchange name is required"
            onIonInput={(e) => setExchangeName(e.detail.value ?? "")}
            onIonBlur={() => setTouchedName(true)}
          />
        </IonItem>
      </IonContent>
      <IonFooter>
        <div className="ExchangeModalFooter">
          <IonButton fill="outline" color="medium" onClick={handleClose}>
            Cancel
          </IonButton>
          <IonButton fill="outline" onClick={onSaveWithoutCSV}>
            Save without CSV
          </IonButton>
          <IonButton onClick={onContinueToUpload}>Continue</IonButton>
        </div>
      </IonFooter>
    </>
  );

  const renderStepUpload = () => (
    <>
      <IonContent className="ExchangeModalContent ion-padding">
        <p className="StepHint">
          Upload a CSV export from your exchange. The format will be detected
          automatically when possible.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          className="HiddenFileInput"
          onChange={onFileChanged}
        />

        <IonButton fill="outline" onClick={onPickFile}>
          <IonIcon slot="start" icon={documentOutline} />
          {csvFileName ? "Change file" : "Choose CSV file"}
        </IonButton>

        {csvFileName && (
          <div className="FileInfo">
            <span className="FileName">{csvFileName}</span>
            <span className="RowCount">{csvRows.length} rows</span>
            {detectedParser ? (
              <IonChip color="success">
                <IonIcon icon={checkmarkCircleOutline} />
                <IonLabel>Detected: {detectedParser.name}</IonLabel>
              </IonChip>
            ) : csvHeaders.length > 0 ? (
              <IonChip color="warning">
                <IonIcon icon={warningOutline} />
                <IonLabel>Unknown format — manual mapping required</IonLabel>
              </IonChip>
            ) : null}
          </div>
        )}
      </IonContent>
      <IonFooter>
        <div className="ExchangeModalFooter">
          {!existingExchange && (
            <IonButton
              fill="outline"
              color="medium"
              onClick={() => setStep("details")}
            >
              Back
            </IonButton>
          )}
          {existingExchange && (
            <IonButton fill="outline" color="medium" onClick={handleClose}>
              Cancel
            </IonButton>
          )}
          <IonButton disabled={!csvRows.length} onClick={onContinueAfterUpload}>
            {detectedParser || !csvHeaders.length ? "Preview" : "Map columns"}
          </IonButton>
        </div>
      </IonFooter>
    </>
  );

  const renderStepMapping = () => (
    <>
      <IonContent className="ExchangeModalContent ion-padding">
        <p className="StepHint">
          Map the CSV columns from <strong>{csvFileName}</strong> to the
          canonical transaction fields.
        </p>

        {CANONICAL_FIELDS.map(({ key, label, required }) => (
          <IonItem key={key}>
            <IonLabel>
              {label}
              {required && <span className="RequiredMark"> *</span>}
            </IonLabel>
            <IonSelect
              interface="popover"
              placeholder={required ? "Required" : "Skip"}
              value={columnMapping[key] ?? ""}
              onIonChange={(e) =>
                onMappingChange(key, e.detail.value as string)
              }
            >
              {!required && (
                <IonSelectOption value="">— Skip —</IonSelectOption>
              )}
              {csvHeaders.map((h) => (
                <IonSelectOption key={h} value={h}>
                  {h}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        ))}

        {columnMapping.timestamp && (
          <IonItem>
            <IonInput
              label="Timestamp format (optional)"
              labelPlacement="floating"
              placeholder="e.g. YYYY-MM-DD HH:mm:ss"
              value={columnMapping.timestampFormat ?? ""}
              helperText="Dayjs format string. Leave blank for ISO 8601."
              onIonInput={(e) =>
                onMappingChange("timestampFormat", e.detail.value ?? "")
              }
            />
          </IonItem>
        )}
      </IonContent>
      <IonFooter>
        <div className="ExchangeModalFooter">
          <IonButton
            fill="outline"
            color="medium"
            onClick={() => setStep("upload")}
          >
            Back
          </IonButton>
          <IonButton disabled={!isMappingComplete} onClick={onApplyMapping}>
            Preview
          </IonButton>
        </div>
      </IonFooter>
    </>
  );

  const renderStepPreview = () => {
    const preview = parsedTxs.slice(0, 10);
    return (
      <>
        <IonContent className="ExchangeModalContent ion-padding">
          <p className="StepHint">
            Preview of the first {preview.length} of{" "}
            <strong>{parsedTxs.length}</strong> parsed transactions.
          </p>
          <div className="PreviewTable">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Fiat</th>
                  <th>TX Hash</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((tx, idx) => (
                  <tr key={idx}>
                    <td>
                      {new Date(tx.timestamp * 1000).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`TxTypeBadge TxType-${tx.type}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={tx.amount < 0 ? "AmountNeg" : "AmountPos"}>
                      {tx.amount}
                    </td>
                    <td>{tx.currency}</td>
                    <td>
                      {tx.fiatAmount !== undefined
                        ? `${tx.fiatAmount} ${tx.fiatCurrency ?? ""}`
                        : "—"}
                    </td>
                    <td className="TxHash">
                      {tx.txHash ? `${tx.txHash.slice(0, 10)}…` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </IonContent>
        <IonFooter>
          <div className="ExchangeModalFooter">
            <IonButton
              fill="outline"
              color="medium"
              onClick={() => setStep(detectedParser ? "upload" : "mapping")}
            >
              Back
            </IonButton>
            <IonButton onClick={onImport}>
              Import {parsedTxs.length} transaction
              {parsedTxs.length !== 1 ? "s" : ""}
            </IonButton>
          </div>
        </IonFooter>
      </>
    );
  };

  const stepTitles: Record<Step, string> = {
    details: existingExchange ? "Edit Exchange" : "New Exchange",
    upload: "Import CSV",
    mapping: "Map Columns",
    preview: "Preview Transactions",
  };

  return (
    <IonModal
      isOpen={isOpen}
      onWillDismiss={handleClose}
      className="ExchangeModal"
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>{stepTitles[step]}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleClose}>
              <IonIcon icon={closeOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <Loader isOpen={isLoading} message="Importing transactions…" />

      {step === "details" && renderStepDetails()}
      {step === "upload" && renderStepUpload()}
      {step === "mapping" && renderStepMapping()}
      {step === "preview" && renderStepPreview()}
    </IonModal>
  );
};

export default ExchangeModal;
