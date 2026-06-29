import { useCallback, useEffect, useState } from "react";
import AddressModal from "../../components/address-modal/AddressModal";
import ConfirmModal from "../../components/confirm-modal/ConfirmModal";
import Kpi from "../../components/kpis/Kpi";
import { useLatestPricingContext } from "../../context/LatestPriceContext";
import { useToastContext } from "../../context/ToastContext";
import {
  AddressInfoExtended,
  AddressStateObject,
  useAddresses,
} from "../../hooks/useAddresses";
import { useAppSettings } from "../../hooks/useAppSettings";
import {
  addressFormatter,
  BTCFormatter,
  USDFormatter,
} from "../../hooks/useFormatter";
import { TransactionsStorage, useTxs } from "../../hooks/useTxs";
import { useUTXOs } from "../../hooks/useUTXOs";
import { Transaction } from "../../models/MempoolAddressTxs";
import "./AddressesPage.scss";
import AddressesTable from "./components/addresses-table/AddressesTable";
import HoldingsDistributionChart from "./components/holdings-distribution-chart/HoldingsDistributionChart";

const AddressesPage = () => {
  const { getAllTxs, removeTx } = useTxs();
  const { deleteUTXOs } = useUTXOs();
  const { getAddresses, sumBalances, removeAddress } = useAddresses();
  const { getSettings } = useAppSettings();

  const [isLoading, setLoading] = useState(true);

  const [addrCount, setAddrCount] = useState(0);
  const [txsCount, setTxsCount] = useState(0);
  const { setOpenToast } = useToastContext();

  const [txStore, setTxStore] = useState<TransactionsStorage>();
  const [addrStore, setAddrStore] = useState<AddressStateObject>();
  const [spendableBalance, setSpendableBalance] = useState(0);
  const [spendableBalanceUSD, setSpendableBalanceUSD] = useState(0);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<
    AddressInfoExtended | undefined
  >();
  const { latestPrice } = useLatestPricingContext();
  const [addressToRemove, setAddressToRemove] = useState<string>();
  const [confirmDestructiveActions, setConfirmDestructiveActions] =
    useState(true);

  const init = useCallback(async () => {
    const [_txStore, _addrStore, settings] = await Promise.all([
      getAllTxs(),
      getAddresses(),
      getSettings(),
    ]);
    const flattenTxs: Array<Transaction> = Object.values(_txStore).flat();
    if (flattenTxs.length !== 0) {
      setTxsCount(flattenTxs.filter((tx) => tx?.status?.confirmed).length);
    }
    setAddrCount(Object.keys(_addrStore).length);

    const spendableBalance = sumBalances(_addrStore);

    setSpendableBalance(spendableBalance);
    setSpendableBalanceUSD((spendableBalance / 1e8) * latestPrice);

    setTxStore(_txStore);
    setAddrStore(_addrStore);
    setConfirmDestructiveActions(settings.confirmDestructiveActions);

    setLoading(false);
  }, [latestPrice, getAllTxs, getAddresses, getSettings, sumBalances]);

  const openNewAddressModal = () => {
    setAddressToEdit(undefined);
    setIsAddressModalOpen(true);
  };

  const removeAddressData = async (address: string | undefined) => {
    if (!address) {
      console.error("No address selected for deletion");
      return;
    }

    try {
      await Promise.all([
        removeTx(address),
        removeAddress(address),
        deleteUTXOs(address),
      ]);
      setOpenToast({
        message: `Address ${addressFormatter(address)} removed successfully!`,
        color: "success",
      });
      setAddressToRemove(undefined);
      init();
    } catch {
      setOpenToast({
        message: `Could not remove address ${addressFormatter(address)}`,
        color: "danger",
      });
    }
  };

  const onConfirmRemoveAddress = async () => {
    await removeAddressData(addressToRemove);
  };

  const onDeleteAddress = (address: string) => {
    if (!confirmDestructiveActions) {
      void removeAddressData(address);
      return;
    }

    setAddressToRemove(address);
  };

  const onEditAddress = (address: string) => {
    if (addrStore && addrStore[address]) {
      setAddressToEdit(addrStore[address]);
      setIsAddressModalOpen(true);
    } else {
      console.error("Address not found in store for editing:", address);
    }
  };

  const closeAddressModal = () => {
    setIsAddressModalOpen(false);
    setAddressToEdit(undefined);
    init();
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <div className="AddressesPage">
      <Kpi loading={isLoading} value={addrCount} title="Addresses" />
      <Kpi loading={isLoading} value={txsCount} title="Confirmed Tx" />
      <Kpi
        loading={isLoading}
        value={spendableBalance}
        formatter={BTCFormatter}
        title="BTC Balance"
      />
      <Kpi
        loading={isLoading}
        value={spendableBalanceUSD}
        formatter={USDFormatter}
        title="USD Balance"
      />
      <HoldingsDistributionChart loading={isLoading} addrStore={addrStore} />
      <AddressesTable
        loading={isLoading}
        addrStore={addrStore}
        txStore={txStore}
        onAddAddress={openNewAddressModal}
        onEditAddress={onEditAddress}
        onDeleteAddress={onDeleteAddress}
      />
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={closeAddressModal}
        addressToEdit={addressToEdit}
      />
      <ConfirmModal
        isOpen={addressToRemove !== undefined}
        title="Remove address"
        message={`Are you sure you want to remove ${addressFormatter(addressToRemove)}?`}
        confirmText="Yes, remove"
        cancelText="Cancel"
        onCancel={() => setAddressToRemove(undefined)}
        onConfirm={onConfirmRemoveAddress}
      />
    </div>
  );
};

export default AddressesPage;
