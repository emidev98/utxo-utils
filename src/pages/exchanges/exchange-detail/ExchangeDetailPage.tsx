import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
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
  IonTextarea,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import dayjs from "dayjs";
import {
  addOutline,
  closeOutline,
  cloudUploadOutline,
  createOutline,
  informationCircleOutline,
  linkOutline,
  refreshOutline,
  saveOutline,
  trashOutline,
  warningOutline,
} from "ionicons/icons";
import {
  MaterialReactTable,
  MRT_ColumnDef,
  useMaterialReactTable,
} from "material-react-table";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmModal from "../../../components/confirm-modal/ConfirmModal";
import DepthPageHeader from "../../../components/depth-page-header/DepthPageHeader";
import ExchangeModal from "../../../components/exchange-modal/ExchangeModal";
import Kpi from "../../../components/kpis/Kpi";
import { useToastContext } from "../../../context/ToastContext";
import { useAppSettings } from "../../../hooks/useAppSettings";
import { useExchanges } from "../../../hooks/useExchanges";
import { BTCFormatter } from "../../../hooks/useFormatter";
import { useTxs } from "../../../hooks/useTxs";
import {
  ExchangeAccount,
  ExchangeTransaction,
  ExchangeTxType,
  MatchState,
} from "../../../models/ExchangeData";
import {
  buildFingerprint,
  isBitcoinCurrency,
  normalizeBitcoinAmount,
  normalizeBitcoinFee,
} from "../../../utils/csvParsers/types";
import "./ExchangeDetailPage.scss";

type InspectorMode = "create" | "edit";
type DuplicateChoice = "replace" | "duplicate";

interface TransactionFormState {
  timestamp: string;
  type: ExchangeTxType;
  amount: string;
  currency: string;
  fiatAmount: string;
  fiatCurrency: string;
  convertedFiatAmount: string;
  convertedFiatCurrency: string;
  fee: string;
  feeCurrency: string;
  txHash: string;
  description: string;
}

interface PendingSave {
  transaction: ExchangeTransaction;
  mode: InspectorMode;
  duplicate: ExchangeTransaction;
}

const EXCHANGE_TX_TYPES: ExchangeTxType[] = [
  "buy",
  "sell",
  "reward",
  "withdrawal",
  "deposit",
  "unknown",
];

const MATCH_LABELS: Record<MatchState, string> = {
  hash_match: "Hash match",
  amount_date_match: "Amount + date",
  manual_match: "Manual match",
  unmatched: "Unmatched",
};

const MATCH_COLORS: Record<MatchState, string> = {
  hash_match: "success",
  amount_date_match: "tertiary",
  manual_match: "primary",
  unmatched: "warning",
};

const toOptionalText = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const toOptionalNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toEditorAmount = (amount: number, currency: string) => {
  return isBitcoinCurrency(currency) ? String(amount / 1e8) : String(amount);
};

const formatDateTimeInput = (timestamp: number) =>
  dayjs.unix(timestamp).format("YYYY-MM-DDTHH:mm");

const createEmptyForm = (): TransactionFormState => ({
  timestamp: dayjs().format("YYYY-MM-DDTHH:mm"),
  type: "buy",
  amount: "",
  currency: "BTC",
  fiatAmount: "",
  fiatCurrency: "USD",
  convertedFiatAmount: "",
  convertedFiatCurrency: "USD",
  fee: "",
  feeCurrency: "BTC",
  txHash: "",
  description: "",
});

const toFormState = (tx: ExchangeTransaction): TransactionFormState => ({
  timestamp: formatDateTimeInput(tx.timestamp),
  type: tx.type,
  amount: toEditorAmount(tx.amount, tx.currency),
  currency: tx.currency,
  fiatAmount: tx.fiatAmount !== undefined ? String(tx.fiatAmount) : "",
  fiatCurrency: tx.fiatCurrency ?? "",
  convertedFiatAmount:
    tx.convertedFiatAmount !== undefined ? String(tx.convertedFiatAmount) : "",
  convertedFiatCurrency: tx.convertedFiatCurrency ?? "",
  fee: tx.fee !== undefined ? toEditorAmount(tx.fee, tx.feeCurrency ?? "") : "",
  feeCurrency: tx.feeCurrency ?? "",
  txHash: tx.txHash ?? "",
  description: tx.description ?? "",
});

const formatFiat = (amount?: number, currency?: string) => {
  if (amount === undefined || !Number.isFinite(amount)) {
    return "-";
  }

  return `${amount.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })} ${currency ?? ""}`.trim();
};

const formatTxAmount = (tx: ExchangeTransaction) => {
  if (isBitcoinCurrency(tx.currency)) {
    return BTCFormatter(tx.amount);
  }

  return `${tx.amount.toLocaleString()} ${tx.currency}`;
};

const formatTxFee = (tx: ExchangeTransaction) => {
  if (tx.fee === undefined) {
    return "-";
  }

  if (tx.feeCurrency && isBitcoinCurrency(tx.feeCurrency)) {
    return BTCFormatter(tx.fee);
  }

  return `${tx.fee.toLocaleString()} ${tx.feeCurrency ?? ""}`.trim();
};

const formatTxHash = (txHash?: string) => {
  if (!txHash) {
    return "-";
  }

  return `${txHash.slice(0, 10)}...${txHash.slice(-8)}`;
};

const buildManualRawData = (form: TransactionFormState) => {
  const now = new Date().toISOString();
  const rawData: Record<string, string> = {
    source: "manual-entry",
    createdAt: now,
    timestamp: form.timestamp,
    type: form.type,
    amount: form.amount,
    currency: form.currency,
  };

  const optionalFields: Array<[string, string]> = [
    ["fiatAmount", form.fiatAmount],
    ["fiatCurrency", form.fiatCurrency],
    ["convertedFiatAmount", form.convertedFiatAmount],
    ["convertedFiatCurrency", form.convertedFiatCurrency],
    ["fee", form.fee],
    ["feeCurrency", form.feeCurrency],
    ["txHash", form.txHash],
    ["description", form.description],
  ];

  optionalFields.forEach(([key, value]) => {
    if (value.trim()) {
      rawData[key] = value.trim();
    }
  });

  return rawData;
};

interface ExchangeDetailColumnsProps {
  onEditTransaction: (tx: ExchangeTransaction) => void;
  onDeleteTransaction: (tx: ExchangeTransaction) => void;
  onLinkTransaction: () => void;
}

const getExchangeDetailColumns = ({
  onEditTransaction,
  onDeleteTransaction,
  onLinkTransaction,
}: ExchangeDetailColumnsProps): MRT_ColumnDef<ExchangeTransaction>[] => [
  {
    accessorKey: "actions",
    header: "",
    size: 120,
    enableColumnActions: false,
    enableColumnFilter: false,
    enableSorting: false,
    Cell: ({ row }) => (
      <div className="ExchangeTxActions">
        <IonButton
          fill="clear"
          className="ExchangeTxActionButton"
          onClick={(event) => {
            event.stopPropagation();
            onEditTransaction(row.original);
          }}
        >
          <IonIcon icon={createOutline} slot="icon-only" />
        </IonButton>
        <IonButton
          fill="clear"
          className="ExchangeTxActionButton"
          onClick={(event) => {
            event.stopPropagation();
            onLinkTransaction();
          }}
        >
          <IonIcon icon={linkOutline} slot="icon-only" />
        </IonButton>
        <IonButton
          fill="clear"
          color="danger"
          className="ExchangeTxActionButton"
          onClick={(event) => {
            event.stopPropagation();
            onDeleteTransaction(row.original);
          }}
        >
          <IonIcon icon={trashOutline} slot="icon-only" />
        </IonButton>
      </div>
    ),
  },
  {
    accessorKey: "timestamp",
    header: "Date",
    size: 170,
    Cell: ({ row }) =>
      dayjs.unix(row.original.timestamp).format("YYYY-MM-DD HH:mm"),
  },
  {
    accessorKey: "type",
    header: "Type",
    size: 130,
    Cell: ({ row }) => (
      <IonChip className={`TxTypeChip TxType-${row.original.type}`}>
        {row.original.type}
      </IonChip>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    size: 160,
    Cell: ({ row }) => (
      <span className={row.original.amount < 0 ? "AmountNeg" : "AmountPos"}>
        {formatTxAmount(row.original)}
      </span>
    ),
  },
  {
    accessorKey: "convertedFiatAmount",
    header: "Fiat",
    size: 150,
    Cell: ({ row }) =>
      formatFiat(
        row.original.convertedFiatAmount,
        row.original.convertedFiatCurrency,
      ),
  },
  {
    accessorKey: "fee",
    header: "Fee",
    size: 130,
    Cell: ({ row }) => formatTxFee(row.original),
  },
  {
    accessorKey: "matchState",
    header: "Match",
    size: 170,
    Cell: ({ row }) => (
      <IonChip color={MATCH_COLORS[row.original.matchState]}>
        {MATCH_LABELS[row.original.matchState]}
      </IonChip>
    ),
  },
  {
    accessorKey: "flags",
    header: "Flags",
    size: 190,
    enableSorting: false,
    Cell: ({ row }) => (
      <div className="ExchangeTxFlags">
        {row.original.isManuallyEdited && (
          <IonChip color="primary">Edited</IonChip>
        )}
        {row.original.isIntentionalDuplicate && (
          <IonChip color="warning">Duplicate</IonChip>
        )}
        {!row.original.isManuallyEdited &&
          !row.original.isIntentionalDuplicate &&
          "-"}
      </div>
    ),
  },
  {
    accessorKey: "txHash",
    header: "TX Hash",
    size: 190,
    Cell: ({ row }) => formatTxHash(row.original.txHash),
  },
  {
    accessorKey: "description",
    header: "Description",
    size: 260,
  },
];

const ExchangeDetailPage = () => {
  const navigate = useNavigate();
  const { exchangeId } = useParams();
  const { getExchange, putExchange, reconcileExchange, updateExchangeName } =
    useExchanges();
  const { getAllTxs } = useTxs();
  const { getSettings } = useAppSettings();
  const { setOpenToast } = useToastContext();

  const [loading, setLoading] = useState(true);
  const [exchange, setExchange] = useState<ExchangeAccount | undefined>();
  const [exchangeName, setExchangeName] = useState("");
  const [confirmDestructiveActions, setConfirmDestructiveActions] =
    useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>("create");
  const [editingTransaction, setEditingTransaction] = useState<
    ExchangeTransaction | undefined
  >();
  const [formState, setFormState] = useState<TransactionFormState | undefined>(
    undefined,
  );
  const [dirty, setDirty] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<
    ExchangeTransaction | undefined
  >();
  const [pendingDuplicateSave, setPendingDuplicateSave] =
    useState<PendingSave>();

  const loadExchange = async () => {
    setLoading(true);

    if (!exchangeId) {
      setExchange(undefined);
      setExchangeName("");
      setLoading(false);
      return;
    }

    const [account, settings] = await Promise.all([
      getExchange(exchangeId),
      getSettings(),
    ]);
    setExchange(account);
    setExchangeName(account?.name ?? "");
    setConfirmDestructiveActions(settings.confirmDestructiveActions);
    setLoading(false);
  };

  useEffect(() => {
    void loadExchange();
  }, [exchangeId]);

  const transactions = useMemo(
    () => exchange?.transactions ?? [],
    [exchange?.transactions],
  );

  const filteredTransactions = transactions;

  const selectedIndex = useMemo(() => {
    if (!editingTransaction) {
      return -1;
    }

    return filteredTransactions.findIndex(
      (tx) => tx.id === editingTransaction.id,
    );
  }, [editingTransaction, filteredTransactions]);

  const kpis = useMemo(() => {
    return transactions.reduce(
      (totals, tx) => {
        const amount = Math.abs(tx.amount);
        const convertedFiatAmount = Math.abs(tx.convertedFiatAmount ?? 0);

        if (tx.type === "buy") {
          totals.bought += amount;
          totals.fiatSpent += convertedFiatAmount;
        }

        if (tx.type === "sell") {
          totals.sold += amount;
          totals.fiatReceived += convertedFiatAmount;
        }

        if (tx.type === "withdrawal") {
          totals.withdrawn += amount;
        }

        if (tx.type === "deposit") {
          totals.deposited += amount;
        }

        if (tx.matchState === "unmatched") {
          totals.unmatched += 1;
        }

        if (tx.fee !== undefined && tx.feeCurrency) {
          if (isBitcoinCurrency(tx.feeCurrency)) {
            totals.btcFees += Math.abs(tx.fee);
          }
        }

        return totals;
      },
      {
        bought: 0,
        sold: 0,
        withdrawn: 0,
        deposited: 0,
        fiatSpent: 0,
        fiatReceived: 0,
        btcFees: 0,
        unmatched: 0,
      },
    );
  }, [transactions]);

  const updateForm = (
    key: keyof TransactionFormState,
    value: string | ExchangeTxType,
  ) => {
    setFormState((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [key]: value,
      };
    });
    setDirty(true);
  };

  const openCreateInspector = () => {
    setInspectorMode("create");
    setEditingTransaction(undefined);
    setFormState(createEmptyForm());
    setDirty(true);
  };

  const openEditInspector = (tx: ExchangeTransaction) => {
    setInspectorMode("edit");
    setEditingTransaction(tx);
    setFormState(toFormState(tx));
    setDirty(false);
  };

  const closeInspector = () => {
    setEditingTransaction(undefined);
    setFormState(undefined);
    setDirty(false);
    setInspectorMode("create");
  };

  const buildTransactionFromForm = (): ExchangeTransaction | undefined => {
    if (!exchange || !formState) {
      return undefined;
    }

    const amountValue = Number(formState.amount);
    const timestamp = dayjs(formState.timestamp).unix();
    const currency = formState.currency.trim().toUpperCase();
    const feeCurrency = formState.feeCurrency.trim().toUpperCase();

    if (
      !Number.isFinite(amountValue) ||
      !Number.isFinite(timestamp) ||
      !currency ||
      !isBitcoinCurrency(currency)
    ) {
      return undefined;
    }

    const amount = normalizeBitcoinAmount(amountValue, currency);
    const fee = normalizeBitcoinFee(
      toOptionalNumber(formState.fee),
      feeCurrency,
    );
    const txHash = toOptionalText(formState.txHash);
    const existing = editingTransaction;
    const matchRelevantChanged =
      !existing ||
      existing.timestamp !== timestamp ||
      existing.amount !== amount ||
      existing.currency !== currency ||
      existing.type !== formState.type ||
      (existing.txHash ?? "") !== (txHash ?? "");

    const matchState =
      existing?.matchState === "manual_match"
        ? existing.matchState
        : matchRelevantChanged
          ? "unmatched"
          : (existing?.matchState ?? "unmatched");

    return {
      id: existing?.id ?? crypto.randomUUID(),
      exchangeId: exchange.id,
      fingerprint: buildFingerprint(
        timestamp,
        amount,
        currency,
        formState.type,
        txHash,
      ),
      timestamp,
      type: formState.type,
      amount,
      currency,
      fiatAmount: toOptionalNumber(formState.fiatAmount),
      fiatCurrency: toOptionalText(formState.fiatCurrency),
      convertedFiatAmount: toOptionalNumber(formState.convertedFiatAmount),
      convertedFiatCurrency: toOptionalText(formState.convertedFiatCurrency),
      fiatExchangeRate: existing?.fiatExchangeRate,
      fee,
      feeCurrency: feeCurrency || undefined,
      txHash,
      description: toOptionalText(formState.description),
      rawData: existing?.rawData ?? buildManualRawData(formState),
      matchState,
      matchedTxId:
        matchState === "unmatched" && matchRelevantChanged
          ? undefined
          : existing?.matchedTxId,
      isManuallyEdited: true,
      isIntentionalDuplicate: existing?.isIntentionalDuplicate,
    };
  };

  const duplicateFor = (tx: ExchangeTransaction) =>
    transactions.find(
      (candidate) =>
        candidate.fingerprint === tx.fingerprint && candidate.id !== tx.id,
    );

  const persistExchange = async (updated: ExchangeAccount) => {
    await putExchange(updated);
    setExchange(updated);
  };

  const persistTransaction = async (
    tx: ExchangeTransaction,
    mode: InspectorMode,
    duplicateChoice?: DuplicateChoice,
    duplicate?: ExchangeTransaction,
  ) => {
    if (!exchange) {
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    let updatedTransactions = [...exchange.transactions];
    let txToSave = { ...tx };

    if (duplicateChoice === "duplicate") {
      txToSave = {
        ...txToSave,
        isIntentionalDuplicate: true,
      };
    }

    if (duplicateChoice === "replace" && duplicate) {
      txToSave = {
        ...txToSave,
        id: duplicate.id,
        isIntentionalDuplicate: false,
      };
      updatedTransactions = updatedTransactions.filter(
        (candidate) =>
          candidate.id !== duplicate.id &&
          (mode === "edit" ? candidate.id !== tx.id : true),
      );
      updatedTransactions.push(txToSave);
    } else if (mode === "create") {
      updatedTransactions.push(txToSave);
    } else {
      updatedTransactions = updatedTransactions.map((candidate) =>
        candidate.id === tx.id ? txToSave : candidate,
      );
    }

    const updated = {
      ...exchange,
      lastModifiedAt: now,
      transactions: updatedTransactions.sort(
        (a, b) => b.timestamp - a.timestamp,
      ),
    };

    await persistExchange(updated);
    closeInspector();
    setPendingDuplicateSave(undefined);
    setOpenToast({
      message:
        mode === "create"
          ? "Exchange transaction added."
          : "Exchange transaction updated.",
      color: "success",
    });
  };

  const onSaveInspector = async () => {
    const tx = buildTransactionFromForm();
    if (!tx) {
      setOpenToast({
        message:
          "Complete the required transaction fields before saving. Currency must be BTC or XBT.",
        color: "warning",
      });
      return;
    }

    const duplicate = duplicateFor(tx);
    if (duplicate && !tx.isIntentionalDuplicate) {
      setPendingDuplicateSave({
        transaction: tx,
        mode: inspectorMode,
        duplicate,
      });
      return;
    }

    await persistTransaction(tx, inspectorMode);
  };

  const onDuplicateChoice = async (choice: DuplicateChoice) => {
    if (!pendingDuplicateSave) {
      return;
    }

    await persistTransaction(
      pendingDuplicateSave.transaction,
      pendingDuplicateSave.mode,
      choice,
      pendingDuplicateSave.duplicate,
    );
  };

  const onSaveName = async () => {
    if (!exchange || exchangeName.trim().length === 0) {
      return;
    }

    try {
      const updated = await updateExchangeName(
        exchange.id,
        exchangeName.trim(),
      );
      setExchange(updated);
      setOpenToast({
        message: "Exchange name updated.",
        color: "success",
      });
    } catch {
      setOpenToast({
        message: "Could not update the exchange name.",
        color: "danger",
      });
    }
  };

  const removeTransaction = async (tx: ExchangeTransaction) => {
    if (!exchange) {
      return;
    }

    const updated = {
      ...exchange,
      lastModifiedAt: Math.floor(Date.now() / 1000),
      transactions: exchange.transactions.filter(
        (candidate) => candidate.id !== tx.id,
      ),
    };

    await persistExchange(updated);
    if (editingTransaction?.id === tx.id) {
      closeInspector();
    }
    setTransactionToDelete(undefined);
    setOpenToast({
      message: "Exchange transaction removed.",
      color: "success",
    });
  };

  const onDeleteTransaction = (tx: ExchangeTransaction) => {
    if (!confirmDestructiveActions) {
      void removeTransaction(tx);
      return;
    }

    setTransactionToDelete(tx);
  };

  const onRunReconciliation = async () => {
    if (!exchange) {
      return;
    }

    try {
      const txStore = (await getAllTxs()) ?? {};
      const updated = await reconcileExchange(exchange.id, txStore);
      setExchange(updated);
      setOpenToast({
        message: "Exchange reconciliation complete.",
        color: "success",
      });
    } catch {
      setOpenToast({
        message: "Could not reconcile this exchange.",
        color: "danger",
      });
    }
  };

  const showLinkPlaceholder = () => {
    setOpenToast({
      message: "Manual on-chain linking will be added in the next iteration.",
      color: "medium",
    });
  };

  const goToAdjacentTransaction = (direction: -1 | 1) => {
    if (selectedIndex < 0) {
      return;
    }

    const next = filteredTransactions[selectedIndex + direction];
    if (next) {
      openEditInspector(next);
    }
  };

  const transactionPreview = buildTransactionFromForm();
  const formPreviewDuplicate = transactionPreview
    ? duplicateFor(transactionPreview)
    : undefined;

  const columns = getExchangeDetailColumns({
    onEditTransaction: openEditInspector,
    onDeleteTransaction,
    onLinkTransaction: showLinkPlaceholder,
  });

  const table = useMaterialReactTable({
    columns,
    data: filteredTransactions,
    enableFullScreenToggle: false,
    enableColumnFilters: true,
    enableGlobalFilter: true,
    enableDensityToggle: true,
    initialState: {
      pagination: { pageSize: 25, pageIndex: 0 },
      density: "compact",
      sorting: [{ id: "timestamp", desc: true }],
    },
    muiPaginationProps: {
      rowsPerPageOptions: [25, 50, 100],
    },
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => openEditInspector(row.original),
      className:
        editingTransaction?.id === row.original.id ? "SelectedTxRow" : "",
    }),
    renderDetailPanel: ({ row }) => (
      <div className="RawDataPreview">
        <div className="RawDataPreviewTitle">
          <IonIcon icon={informationCircleOutline} />
          Imported raw data
        </div>
        <pre>{JSON.stringify(row.original.rawData, null, 2)}</pre>
      </div>
    ),
    renderTopToolbarCustomActions: () => (
      <div className="ExchangeTxToolbar">
        <IonButton fill="clear" color="dark" onClick={openCreateInspector}>
          <IonIcon icon={addOutline} slot="start" />
          Add transaction
        </IonButton>
        <IonButton
          fill="clear"
          color="dark"
          onClick={() => setIsImportOpen(true)}
        >
          <IonIcon icon={cloudUploadOutline} slot="start" />
          Import CSV
        </IonButton>
        <IonButton fill="clear" color="dark" onClick={onRunReconciliation}>
          <IonIcon icon={refreshOutline} slot="start" />
          Run reconciliation
        </IonButton>
        <IonButton fill="clear" color="medium" onClick={showLinkPlaceholder}>
          <IonIcon icon={linkOutline} slot="start" />
          Link on-chain
        </IonButton>
      </div>
    ),
  });

  if (loading) {
    return (
      <div className="ExchangeDetailPage">
        <DepthPageHeader
          backLabel="Exchanges"
          onBack={() => navigate("/exchanges")}
        >
          <div className="ExchangeNameEditor">
            <IonInput
              className="ExchangeNameInput"
              label="Exchange name"
              labelPlacement="floating"
              disabled={true}
              value="Loading exchange..."
            />
          </div>
        </DepthPageHeader>
        <section className="ExchangeKpis">
          <Kpi loading={true} title="Loading" />
          <Kpi loading={true} title="Loading" />
          <Kpi loading={true} title="Loading" />
          <Kpi loading={true} title="Loading" />
          <Kpi loading={true} title="Loading" />
        </section>
        <IonCard className="ExchangeDetailLoadingCard" />
      </div>
    );
  }

  if (!exchange) {
    return (
      <div className="ExchangeDetailPage">
        <DepthPageHeader
          backLabel="Exchanges"
          onBack={() => navigate("/exchanges")}
        >
          <div className="ExchangeNameEditor">
            <IonInput
              className="ExchangeNameInput"
              label="Exchange name"
              labelPlacement="floating"
              disabled={true}
              value="Exchange not found"
            />
          </div>
        </DepthPageHeader>
        <IonCard className="ExchangeNotFoundCard">
          <IonCardHeader>
            <IonCardTitle>Exchange not found</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>The selected exchange account is not available locally.</p>
            <IonButton fill="outline" onClick={() => navigate("/exchanges")}>
              Back to exchanges
            </IonButton>
          </IonCardContent>
        </IonCard>
      </div>
    );
  }

  const nameDirty = exchangeName.trim() !== exchange.name;

  return (
    <div className="ExchangeDetailPage">
      <DepthPageHeader
        backLabel="Exchanges"
        onBack={() => navigate("/exchanges")}
        meta={
          <>
            <span>
              Created {dayjs.unix(exchange.createdAt).format("YYYY-MM-DD")}
            </span>
            <span>
              Last import{" "}
              {exchange.lastImportedAt
                ? dayjs.unix(exchange.lastImportedAt).format("YYYY-MM-DD")
                : "-"}
            </span>
            <span>
              Last change{" "}
              {exchange.lastModifiedAt
                ? dayjs.unix(exchange.lastModifiedAt).format("YYYY-MM-DD")
                : "-"}
            </span>
          </>
        }
      >
        <div className="ExchangeNameEditor">
          <IonInput
            className="ExchangeNameInput"
            label="Exchange name"
            labelPlacement="floating"
            value={exchangeName}
            onIonInput={(event) => setExchangeName(event.detail.value ?? "")}
          />
          <IonButton
            disabled={!nameDirty || exchangeName.trim().length === 0}
            onClick={onSaveName}
          >
            <IonIcon icon={saveOutline} slot="start" />
            Save
          </IonButton>
        </div>
      </DepthPageHeader>

      <section className="ExchangeKpis">
        <Kpi
          value={`${BTCFormatter(kpis.bought)} / ${formatFiat(kpis.fiatSpent, "USD")}`}
          title="BTC bought / fiat spent"
        />
        <Kpi
          value={`${BTCFormatter(kpis.sold)} / ${formatFiat(kpis.fiatReceived, "USD")}`}
          title="BTC sold / fiat received"
        />
        <Kpi
          value={`${BTCFormatter(kpis.withdrawn)} / ${BTCFormatter(kpis.deposited)}`}
          title="Withdrawn / deposited"
        />
        <Kpi value={BTCFormatter(kpis.btcFees)} title="BTC fees" />
        <Kpi value={kpis.unmatched} title="Unmatched" />
      </section>

      <section
        className={`ExchangeWorkbench${formState ? " InspectorOpen" : ""}`}
      >
        <IonCard className="ExchangeTransactionsTable TableData">
          <MaterialReactTable table={table} />
        </IonCard>

        {formState && (
          <aside className="TransactionInspector">
            <div className="InspectorHeader">
              <div>
                <h3>
                  {inspectorMode === "create"
                    ? "Add transaction"
                    : "Edit transaction"}
                </h3>
                <p>{dirty ? "Unsaved changes" : "No pending changes"}</p>
              </div>
              <IonButton fill="clear" color="medium" onClick={closeInspector}>
                <IonIcon icon={closeOutline} slot="icon-only" />
              </IonButton>
            </div>

            <div className="InspectorForm">
              {formPreviewDuplicate && (
                <div className="DuplicateWarning">
                  <IonIcon icon={warningOutline} />
                  This fingerprint already exists. You can choose how to handle
                  it when saving.
                </div>
              )}

              <IonInput
                label="Date and time"
                labelPlacement="floating"
                type="datetime-local"
                value={formState.timestamp}
                onIonInput={(event) =>
                  updateForm("timestamp", event.detail.value ?? "")
                }
              />

              <IonItem lines="none" className="InspectorSelectItem">
                <IonLabel>Type</IonLabel>
                <IonSelect
                  interface="popover"
                  value={formState.type}
                  onIonChange={(event) =>
                    updateForm("type", event.detail.value as ExchangeTxType)
                  }
                >
                  {EXCHANGE_TX_TYPES.map((type) => (
                    <IonSelectOption key={type} value={type}>
                      {type}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <div className="InspectorTwoCols">
                <IonInput
                  label="Amount"
                  labelPlacement="floating"
                  type="number"
                  value={formState.amount}
                  onIonInput={(event) =>
                    updateForm("amount", event.detail.value ?? "")
                  }
                />
                <IonInput
                  label="Currency"
                  labelPlacement="floating"
                  value={formState.currency}
                  onIonInput={(event) =>
                    updateForm("currency", event.detail.value ?? "")
                  }
                />
              </div>

              <div className="InspectorTwoCols">
                <IonInput
                  label="Fiat amount"
                  labelPlacement="floating"
                  type="number"
                  value={formState.fiatAmount}
                  onIonInput={(event) =>
                    updateForm("fiatAmount", event.detail.value ?? "")
                  }
                />
                <IonInput
                  label="Fiat currency"
                  labelPlacement="floating"
                  value={formState.fiatCurrency}
                  onIonInput={(event) =>
                    updateForm("fiatCurrency", event.detail.value ?? "")
                  }
                />
              </div>

              <div className="InspectorTwoCols">
                <IonInput
                  label="Converted fiat"
                  labelPlacement="floating"
                  type="number"
                  value={formState.convertedFiatAmount}
                  onIonInput={(event) =>
                    updateForm("convertedFiatAmount", event.detail.value ?? "")
                  }
                />
                <IonInput
                  label="Converted currency"
                  labelPlacement="floating"
                  value={formState.convertedFiatCurrency}
                  onIonInput={(event) =>
                    updateForm(
                      "convertedFiatCurrency",
                      event.detail.value ?? "",
                    )
                  }
                />
              </div>

              <div className="InspectorTwoCols">
                <IonInput
                  label="Fee"
                  labelPlacement="floating"
                  type="number"
                  value={formState.fee}
                  onIonInput={(event) =>
                    updateForm("fee", event.detail.value ?? "")
                  }
                />
                <IonInput
                  label="Fee currency"
                  labelPlacement="floating"
                  value={formState.feeCurrency}
                  onIonInput={(event) =>
                    updateForm("feeCurrency", event.detail.value ?? "")
                  }
                />
              </div>

              <IonInput
                label="Transaction hash / txid"
                labelPlacement="floating"
                value={formState.txHash}
                onIonInput={(event) =>
                  updateForm("txHash", event.detail.value ?? "")
                }
              />

              <IonTextarea
                label="Description"
                labelPlacement="floating"
                value={formState.description}
                autoGrow={true}
                onIonInput={(event) =>
                  updateForm("description", event.detail.value ?? "")
                }
              />

              {editingTransaction && (
                <div className="InspectorReadonly">
                  <span>Match state</span>
                  <IonChip color={MATCH_COLORS[editingTransaction.matchState]}>
                    {MATCH_LABELS[editingTransaction.matchState]}
                  </IonChip>
                </div>
              )}

              <div className="InspectorNavigation">
                <IonButton
                  fill="outline"
                  disabled={selectedIndex <= 0}
                  onClick={() => goToAdjacentTransaction(-1)}
                >
                  Previous
                </IonButton>
                <IonButton
                  fill="outline"
                  disabled={
                    selectedIndex < 0 ||
                    selectedIndex >= filteredTransactions.length - 1
                  }
                  onClick={() => goToAdjacentTransaction(1)}
                >
                  Next
                </IonButton>
              </div>

              <div className="InspectorFooter">
                <IonButton
                  fill="outline"
                  color="medium"
                  onClick={closeInspector}
                >
                  Cancel
                </IonButton>
                <IonButton onClick={() => void onSaveInspector()}>
                  <IonIcon icon={saveOutline} slot="start" />
                  Save
                </IonButton>
              </div>
            </div>
          </aside>
        )}
      </section>

      <ExchangeModal
        isOpen={isImportOpen}
        exchangeId={exchange.id}
        exchangeName={exchange.name}
        onClose={() => {
          setIsImportOpen(false);
          void loadExchange();
        }}
      />

      <ConfirmModal
        isOpen={transactionToDelete !== undefined}
        title="Remove transaction"
        message={`Remove this ${transactionToDelete?.type ?? ""} transaction from ${exchange.name}?`}
        confirmText="Remove"
        cancelText="Cancel"
        onCancel={() => setTransactionToDelete(undefined)}
        onConfirm={() => {
          if (transactionToDelete) {
            void removeTransaction(transactionToDelete);
          }
        }}
      />

      <IonModal
        isOpen={pendingDuplicateSave !== undefined}
        onWillDismiss={() => setPendingDuplicateSave(undefined)}
        className="DuplicateResolutionModal"
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Duplicate transaction</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setPendingDuplicateSave(undefined)}>
                <IonIcon icon={closeOutline} slot="icon-only" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>
            Another row already has the same fingerprint. Choose whether to
            replace the existing row, keep both rows as an intentional
            duplicate, or cancel without saving.
          </p>
        </IonContent>
        <IonFooter>
          <div className="DuplicateResolutionFooter">
            <IonButton
              fill="outline"
              color="medium"
              onClick={() => setPendingDuplicateSave(undefined)}
            >
              Cancel
            </IonButton>
            <IonButton
              fill="outline"
              color="warning"
              onClick={() => void onDuplicateChoice("duplicate")}
            >
              Add duplicated row
            </IonButton>
            <IonButton onClick={() => void onDuplicateChoice("replace")}>
              Replace existing row
            </IonButton>
          </div>
        </IonFooter>
      </IonModal>
    </div>
  );
};

export default ExchangeDetailPage;
