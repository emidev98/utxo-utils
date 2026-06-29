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
  warningOutline,
} from "ionicons/icons";
import React, { useState } from "react";
import { useToastContext } from "../../context/ToastContext";
import { useExchanges } from "../../hooks/useExchanges";
import { BTCFormatter } from "../../hooks/useFormatter";
import {
  CSVColumnMapping,
  ExchangeAccount,
  ParsedExchangeTx,
} from "../../models/ExchangeData";
import {
  detectParser,
  IExchangeCSVParser,
  isBitcoinCurrency,
  ManualMappingParser,
  parseCSVText,
} from "../../utils/csvParsers/index";
import { convertFiatValuesToCommonCurrency } from "../../utils/fiat";
import FileDropzone from "../file-dropzone/FileDropzone";
import Loader from "../loader/Loader";
import "./ExchangeModal.scss";

interface ExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  exchangeId?: string;
  exchangeName?: string;
}

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
  exchangeId,
  exchangeName: existingExchangeName,
}) => {
  const { putExchange, appendTransactions } = useExchanges();
  const { setOpenToast } = useToastContext();

  const [isLoading, setIsLoading] = useState(false);

  const [exchangeName, setExchangeName] = useState("");
  const [isTouchedName, setTouchedName] = useState(false);
  const isNameValid = exchangeName.trim().length > 0;
  const [csvFileName, setCsvFileName] = useState("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [detectedParser, setDetectedParser] =
    useState<IExchangeCSVParser | null>(null);
  const [parsedTxs, setParsedTxs] = useState<ParsedExchangeTx[]>([]);
  const [skippedNonBtcRows, setSkippedNonBtcRows] = useState(0);

  const [columnMapping, setColumnMapping] = useState<Partial<CSVColumnMapping>>(
    {},
  );

  const resetState = () => {
    setExchangeName("");
    setTouchedName(false);
    setCsvFileName("");
    setCsvHeaders([]);
    setCsvRows([]);
    setDetectedParser(null);
    setParsedTxs([]);
    setSkippedNonBtcRows(0);
    setColumnMapping({});
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const isMappingCompleteFor = (mapping: Partial<CSVColumnMapping>) =>
    !!mapping.timestamp &&
    !!mapping.amount &&
    !!mapping.currency &&
    !!mapping.type;

  const formatPreviewAmount = (tx: ParsedExchangeTx) =>
    tx.currency.trim().toUpperCase() === "BTC"
      ? BTCFormatter(tx.amount)
      : tx.amount;

  const addCommonFiatValues = async (
    transactions: ParsedExchangeTx[],
  ): Promise<ParsedExchangeTx[]> => {
    try {
      return await convertFiatValuesToCommonCurrency(transactions);
    } catch {
      setOpenToast({
        message:
          "CSV parsed, but fiat currency conversion failed. Original fiat values were kept.",
        color: "warning",
      });
      return transactions;
    }
  };

  const normalizeParsedTransactions = async (
    transactions: ParsedExchangeTx[],
  ): Promise<ParsedExchangeTx[]> => {
    const btcTransactions = transactions.filter((tx) =>
      isBitcoinCurrency(tx.currency),
    );
    setSkippedNonBtcRows(transactions.length - btcTransactions.length);
    return addCommonFiatValues(btcTransactions);
  };

  const onSave = async () => {
    setTouchedName(true);
    if (!exchangeId && !isNameValid) return;

    setIsLoading(true);

    try {
      const account: ExchangeAccount | undefined = exchangeId
        ? undefined
        : {
            id: crypto.randomUUID(),
            name: exchangeName.trim(),
            createdAt: Math.floor(Date.now() / 1000),
            lastModifiedAt: Math.floor(Date.now() / 1000),
            transactions: [],
          };

      if (account) {
        await putExchange(account);
      }

      if (parsedTxs.length > 0) {
        const { inserted, duplicates } = await appendTransactions(
          exchangeId ?? account!.id,
          parsedTxs,
        );

        setOpenToast({
          message: `${exchangeId ? "Imported" : "Saved exchange and imported"} ${inserted} transaction${inserted !== 1 ? "s" : ""}${duplicates > 0 ? `, skipped ${duplicates} duplicate${duplicates !== 1 ? "s" : ""}` : ""}${skippedNonBtcRows > 0 ? `, skipped ${skippedNonBtcRows} non-BTC row${skippedNonBtcRows !== 1 ? "s" : ""}` : ""}.`,
          color: "success",
        });
      } else if (
        csvRows.length > 0 &&
        !detectedParser &&
        !isMappingCompleteFor(columnMapping)
      ) {
        setOpenToast({
          message:
            "Exchange saved. Complete required mapping fields to import CSV transactions.",
          color: "warning",
        });
      } else {
        setOpenToast({
          message: exchangeId
            ? skippedNonBtcRows > 0
              ? `No BTC transactions were imported. Skipped ${skippedNonBtcRows} non-BTC row${skippedNonBtcRows !== 1 ? "s" : ""}.`
              : "No transactions were imported."
            : `Exchange "${account!.name}" created.`,
          color: "success",
        });
      }

      handleClose();
    } catch {
      setOpenToast({
        message: "Save failed. Please try again.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processCSVFile = async (file: File) => {
    setIsLoading(true);

    try {
      const text = await file.text();
      const { headers, rows } = parseCSVText(text);
      setCsvFileName(file.name);
      setCsvHeaders(headers);
      setCsvRows(rows);
      const parser = detectParser(headers);
      setDetectedParser(parser);
      setColumnMapping({});

      if (parser) {
        console.log("rows", rows);
        const parsed = await normalizeParsedTransactions(parser.parse(rows));
        console.log("parsed", parsed);
        setParsedTxs(parsed);
      } else {
        setParsedTxs([]);
        setSkippedNonBtcRows(0);
      }

      if (!exchangeId && exchangeName.trim() === "") {
        const nameFromFile = file.name.replace(/\.[^/.]+$/, "");
        setExchangeName(nameFromFile);
      }
    } catch {
      setOpenToast({
        message: "Could not read the selected file.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onMappingChange = async (
    field: keyof CSVColumnMapping,
    value: string,
  ) => {
    const next = { ...columnMapping, [field]: value };
    setColumnMapping(next);

    if (detectedParser || csvRows.length === 0) {
      return;
    }

    if (!isMappingCompleteFor(next)) {
      setParsedTxs([]);
      return;
    }

    setIsLoading(true);
    try {
      const parser = new ManualMappingParser(next as CSVColumnMapping);
      const parsed = await normalizeParsedTransactions(parser.parse(csvRows));
      setParsedTxs(parsed);
    } catch {
      setParsedTxs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderInlinePreview = () => {
    if (!csvRows.length) {
      return null;
    }

    if (!detectedParser && parsedTxs.length === 0) {
      return (
        <p className="StepHint">
          Preview will appear after mapping required fields.
        </p>
      );
    }

    const preview = parsedTxs.slice(0, 5);
    return (
      <>
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
                  <td>{new Date(tx.timestamp * 1000).toLocaleDateString()}</td>
                  <td>
                    <span className={`TxTypeBadge TxType-${tx.type}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className={tx.amount < 0 ? "AmountNeg" : "AmountPos"}>
                    {formatPreviewAmount(tx)}
                  </td>
                  <td>{tx.currency}</td>
                  <td>
                    {tx.convertedFiatAmount !== undefined
                      ? `${tx.convertedFiatAmount.toFixed(2)} ${tx.convertedFiatCurrency ?? ""}`
                      : tx.fiatAmount !== undefined
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
      </>
    );
  };

  return (
    <IonModal
      isOpen={isOpen}
      onWillDismiss={handleClose}
      className="ExchangeModal"
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {exchangeId
              ? `Import ${existingExchangeName ?? "exchange"} CSV`
              : "Add exchange data"}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleClose}>
              <IonIcon icon={closeOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <Loader isOpen={isLoading} message="Importing transactions…" />
      <IonContent className="ion-padding">
        {!exchangeId && (
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
        )}

        <p className="StepHint">
          Upload a CSV export from your exchange. The format will be detected
          automatically when possible.
        </p>

        <FileDropzone
          accept=".csv,.txt"
          fileName={csvFileName}
          emptyTitle="Drag or click to choose a CSV file"
          filledTitle="Replace CSV file"
          chooseButtonLabel="Choose file"
          changeButtonLabel="Change file"
          onFileSelected={processCSVFile}
        />

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
          {skippedNonBtcRows > 0 && (
            <IonChip color="warning">
              <IonIcon icon={warningOutline} />
              <IonLabel>
                Skipped {skippedNonBtcRows} non-BTC row
                {skippedNonBtcRows !== 1 ? "s" : ""}
              </IonLabel>
            </IonChip>
          )}
        </div>

        {!detectedParser && csvHeaders.length > 0 && (
          <>
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
                  onIonChange={(e) => onMappingChange(key, e.detail.value)}
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
          </>
        )}

        {renderInlinePreview()}
      </IonContent>
      <IonFooter>
        <div className="ExchangeModalFooter">
          <IonButton fill="outline" color="medium" onClick={handleClose}>
            Cancel
          </IonButton>
          <IonButton onClick={onSave}>Save</IonButton>
        </div>
      </IonFooter>
    </IonModal>
  );
};

export default ExchangeModal;
