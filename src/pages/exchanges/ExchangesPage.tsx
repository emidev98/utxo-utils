import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../components/confirm-modal/ConfirmModal";
import ExchangeModal from "../../components/exchange-modal/ExchangeModal";
import Kpi from "../../components/kpis/Kpi";
import { useToastContext } from "../../context/ToastContext";
import { useAppSettings } from "../../hooks/useAppSettings";
import { useExchanges } from "../../hooks/useExchanges";
import {
  ExchangeAccount,
  ExchangeStore,
  ExchangeTransaction,
} from "../../models/ExchangeData";
import ExchangesTable from "./components/exchanges-table/ExchangesTable";
import "./ExchangesPage.scss";

const ExchangesPage = () => {
  const navigate = useNavigate();
  const { getExchanges, removeExchange } = useExchanges();
  const { getSettings } = useAppSettings();
  const { setOpenToast } = useToastContext();

  const [isLoading, setLoading] = useState(true);
  const [exchangeStore, setExchangeStore] = useState<ExchangeStore>({});

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exchangeToDelete, setExchangeToDelete] = useState<
    ExchangeAccount | undefined
  >();
  const [confirmDestructiveActions, setConfirmDestructiveActions] =
    useState(true);

  const init = useCallback(async () => {
    const [store, settings] = await Promise.all([
      getExchanges(),
      getSettings(),
    ]);
    setExchangeStore(store ?? {});
    setConfirmDestructiveActions(settings.confirmDestructiveActions);
    setLoading(false);
  }, [getExchanges, getSettings]);

  useEffect(() => {
    init();
  }, []);

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

  const openNewExchangeModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    init();
  };

  const removeExchangeAccount = async (
    accountToDelete: ExchangeAccount | undefined,
  ) => {
    if (!accountToDelete) return;
    try {
      await removeExchange(accountToDelete.id);
      setOpenToast({
        message: `Exchange "${accountToDelete.name}" removed.`,
        color: "success",
      });
      setExchangeToDelete(undefined);
      setExchangeStore((prev) => {
        const next = { ...prev };
        delete next[accountToDelete.id];
        return next;
      });
      init();
    } catch {
      setOpenToast({
        message: `Could not remove "${accountToDelete?.name}".`,
        color: "danger",
      });
    }
  };

  const onConfirmDelete = async () => {
    await removeExchangeAccount(exchangeToDelete);
  };

  const onDeleteExchange = (id: string) => {
    const account = exchangeStore[id];
    if (!account) {
      setOpenToast({
        message: "Could not find the selected exchange.",
        color: "danger",
      });
      return;
    }

    if (!confirmDestructiveActions) {
      void removeExchangeAccount(account);
      return;
    }

    setExchangeToDelete(account);
  };

  const onViewExchange = (id: string) => {
    navigate(`/exchanges/${id}`);
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

      <ExchangesTable
        exchangeStore={exchangeStore}
        loading={isLoading}
        onAddExchange={openNewExchangeModal}
        onViewExchange={onViewExchange}
        onDeleteExchange={onDeleteExchange}
      />

      <ExchangeModal isOpen={isModalOpen} onClose={closeModal} />

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
