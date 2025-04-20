import React from "react";
import "./AddressesManagementPage.scss";
import ImportAddresssesDropdown from "./components/import-addresses-dropdown/ImportAddressesDropdown";

const AddressesManagementPage: React.FC = () => {
  return (
    <div className="AddressesManagementPage">
      <ImportAddresssesDropdown />
    </div>
  );
};

export default AddressesManagementPage;
