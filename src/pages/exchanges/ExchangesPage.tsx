import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonIcon,
  IonLabel,
} from "@ionic/react";
import dayjs from "dayjs";
import {
  addOutline,
  chevronDownOutline,
  chevronUpOutline,
  documentTextOutline,
  refreshOutline,
  trashOutline,
} from "ionicons/icons";
import { useCallback, useEffect, useState } from "react";
import ConfirmModal from "../../components/confirm-modal/ConfirmModal";
import ExchangeModal from "../../components/exchange-modal/ExchangeModal";
import Kpi from "../../components/kpis/Kpi";
import { useToastContext } from "../../context/ToastContext";
import { useExchanges } from "../../hooks/useExchanges";
import { useTxs } from "../../hooks/useTxs";
import {
  ExchangeAccount,
  ExchangeStore,
  ExchangeTransaction,
  MatchState,
} from "../../models/ExchangeData";
import "./ExchangesPage.scss";

const MATCH_STATE_COLOR: Record<MatchState, string> = {
  hash_match: "success",
  amount_date_match: "warning",
  unmatched: "medium",
};

const MATCH_STATE_LABEL: Record<MatchState, string> = {
  hash_match: "Hash match",
  amount_date_match: "Approx match",
  unmatched: "Unmatched",
};

const ExchangesPage = () => {
  const { getExchanges, removeExchange, reconcileExchange } = useExchanges();
  const { getAllTxs } = useTxs();
  const { setOpenToast } = useToastContext();

  const [isLoading, setLoading] = useState(true);
  const [exchangeStore, setExchangeStore] = useState<ExchangeStore>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalExchange, setModalExchange] = useState<
    ExchangeAccount | undefined
  >();
  const [exchangeToDelete, setExchangeToDelete] = useState<
    ExchangeAccount | undefined
  >();

  const init = useCallback(async () => {
    const store = await getExchanges();
    setExchangeStore(store ?? {});
    setLoading(false);
  }, [getExchanges]);

  useEffect(() => {
    init();
  }, []);

  // ─── KPI derivations ─────────────────────────────────────────────────────

  const allAccounts = Object.values(exchangeStore);
  const allTxs: ExchangeTransaction[] = allAccounts.flatMap(
    (a) => a.transactions,
  );
  const matchedCount = allTxs.filter(
    (t) => t.matchState !== "unmatched",
  ).length;
  const unmatchedCount = allTxs.filter(
    (t) => t.matchState === "unmatched",
  ).length;

  // ─── Handlers ────────────────────────────────────────────────────────────

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openNewExchangeModal = () => {
    setModalExchange(undefined);
    setIsModalOpen(true);
  };

  const openImportModal = (exchange: ExchangeAccount) => {
    setModalExchange(exchange);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalExchange(undefined);
    init();
  };

  const onReconcile = async (exchange: ExchangeAccount) => {
    setReconcilingId(exchange.id);
    try {
      const txStore = await getAllTxs();
      const updated = await reconcileExchange(exchange.id, txStore);
      setExchangeStore((prev) => ({ ...prev, [exchange.id]: updated }));

      const matched = updated.transactions.filter(
        (t) => t.matchState !== "unmatched",
      ).length;
      setOpenToast({
        message: `Reconciled "${exchange.name}": ${matched} of ${updated.transactions.length} transactions matched.`,
        color: "success",
      });
    } catch {
      setOpenToast({
        message: `Reconciliation failed for "${exchange.name}".`,
        color: "danger",
      });
    } finally {
      setReconcilingId(null);
    }
  };

  const onConfirmDelete = async () => {
    if (!exchangeToDelete) return;
    try {
      await removeExchange(exchangeToDelete.id);
      setOpenToast({
        message: `Exchange "${exchangeToDelete.name}" removed.`,
        color: "success",
      });
      setExchangeToDelete(undefined);
      init();
    } catch {
      setOpenToast({
        message: `Could not remove "${exchangeToDelete?.name}".`,
        color: "danger",
      });
    }
  };

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderTransactionsTable = (txs: ExchangeTransaction[]) => {
    if (!txs.length) {
      return (
        <p className="EmptyTransactions">
          No transactions yet. Import a CSV to get started.
        </p>
      );
    }

    return (
      <div className="TxTable">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Fiat</th>
              <th>TX Hash</th>
              <th>Match</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((tx) => (
              <tr key={tx.id}>
                <td>{dayjs.unix(tx.timestamp).format("YYYY-MM-DD HH:mm")}</td>
                <td>
                  <span className={`TxTypeBadge TxType-${tx.type}`}>
                    {tx.type}
                  </span>
                </td>
                <td className={tx.amount < 0 ? "AmountNeg" : "AmountPos"}>
                  {tx.amount} {tx.currency}
                </td>
                <td>
                  {tx.fiatAmount !== undefined
                    ? `${tx.fiatAmount} ${tx.fiatCurrency ?? ""}`
                    : "—"}
                </td>
                <td className="TxHash">
                  {tx.txHash ? (
                    <span title={tx.txHash}>{tx.txHash.slice(0, 12)}…</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <IonChip
                    color={MATCH_STATE_COLOR[tx.matchState]}
                    className="MatchChip"
                  >
                    <IonLabel>{MATCH_STATE_LABEL[tx.matchState]}</IonLabel>
                  </IonChip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderExchangeCard = (account: ExchangeAccount) => {
    const isExpanded = expandedIds.has(account.id);
    const isReconciling = reconcilingId === account.id;
    const txCount = account.transactions.length;
    const matchedTxs = account.transactions.filter(
      (t) => t.matchState !== "unmatched",
    ).length;

    return (
      <IonCard key={account.id} className="ExchangeCard">
        <IonCardHeader>
          <div className="CardHeaderRow">
            <div className="CardHeaderMeta">
              <IonCardTitle>{account.name}</IonCardTitle>
              <IonCardSubtitle>
                {txCount} transaction{txCount !== 1 ? "s" : ""}
                {txCount > 0 && ` · ${matchedTxs} matched`}
                {account.lastImportedAt &&
                  ` · Last import ${dayjs.unix(account.lastImportedAt).format("YYYY-MM-DD")}`}
              </IonCardSubtitle>
            </div>
            <IonButtons>
              <IonButton
                fill="outline"
                size="small"
                onClick={() => openImportModal(account)}
              >
                <IonIcon slot="start" icon={documentTextOutline} />
                Import CSV
              </IonButton>
              <IonButton
                fill="outline"
                size="small"
                disabled={isReconciling}
                onClick={() => onReconcile(account)}
              >
                <IonIcon slot="start" icon={refreshOutline} />
                {isReconciling ? "Reconciling…" : "Reconcile"}
              </IonButton>
              <IonButton
                fill="clear"
                size="small"
                color="danger"
                onClick={() => setExchangeToDelete(account)}
              >
                <IonIcon slot="icon-only" icon={trashOutline} />
              </IonButton>
              <IonButton
                fill="clear"
                size="small"
                onClick={() => toggleExpand(account.id)}
              >
                <IonIcon
                  slot="icon-only"
                  icon={isExpanded ? chevronUpOutline : chevronDownOutline}
                />
              </IonButton>
            </IonButtons>
          </div>
        </IonCardHeader>

        {isExpanded && (
          <IonCardContent>
            {renderTransactionsTable(account.transactions)}
          </IonCardContent>
        )}
      </IonCard>
    );
  };

  return (
    <div className="ExchangesPage">
      {/* KPI row */}
      <Kpi loading={isLoading} value={allAccounts.length} title="Exchanges" />
      <Kpi
        loading={isLoading}
        value={allTxs.length}
        title="Total Transactions"
      />
      <Kpi loading={isLoading} value={matchedCount} title="Matched" />
      <Kpi loading={isLoading} value={unmatchedCount} title="Unmatched" />

      {/* Add Exchange button */}
      <div className="ExchangesActions">
        <IonButton onClick={openNewExchangeModal}>
          <IonIcon slot="start" icon={addOutline} />
          Add Exchange
        </IonButton>
      </div>

      {/* Exchange cards */}
      {!isLoading && allAccounts.length === 0 && (
        <div className="EmptyState">
          <p>No exchange accounts yet.</p>
          <p>Click "Add Exchange" to get started.</p>
        </div>
      )}

      {allAccounts.map(renderExchangeCard)}

      {/* Modals */}
      <ExchangeModal
        isOpen={isModalOpen}
        onClose={closeModal}
        existingExchange={modalExchange}
      />

      <ConfirmModal
        isOpen={exchangeToDelete !== undefined}
        title="Remove Exchange"
        message={`Remove "${exchangeToDelete?.name}" and all its ${exchangeToDelete?.transactions.length ?? 0} transactions? This cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        onCancel={() => setExchangeToDelete(undefined)}
        onConfirm={() => void onConfirmDelete()}
      />
    </div>
  );
};

export default ExchangesPage;
