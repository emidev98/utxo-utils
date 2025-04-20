import React, { useState } from "react";
import "./ImportAddressesDropdown.scss";
import { IonButton, IonIcon } from "@ionic/react";
import { ButtonGroup, Menu, MenuItem } from "@mui/material";
import bitboxLogo from "/wallets-logos/bitbox-logo.png";
import trezorLogo from "/wallets-logos/trezor-logo.png";
import { addOutline, addSharp } from "ionicons/icons";
import NewManualAddress from "../../../../components/new-manual-address/NewManualAddress";

enum ImportAddressesDropdownEnum {
  MANUAL = "MANUAL",
  BITBOX = "BITBOX",
  TREZOR = "TREZOR",
}

const ImportAddressesDropdown: React.FC = () => {
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [openModal, setOpenModal] =
    useState<ImportAddressesDropdownEnum | null>(null);

  const openManualModal = () => {
    setOpenModal(ImportAddressesDropdownEnum.MANUAL);
    setIsOpenMenu(false);
  };
  const openBitBoxModal = () => {
    // Logic to add a new address
    console.log("Add New Address");
  };
  const openTrezorModal = () => {
    // Logic to add a new address
    console.log("Add New Address");
  };

  return (
    <ButtonGroup className="ImportAddressesDropdown">
      <IonButton
        id="ImportAddressesDropdownButton"
        variant="contained"
        onClick={() => setIsOpenMenu(!isOpenMenu)}
      >
        Import Addresses
      </IonButton>

      <Menu
        open={isOpenMenu}
        anchorEl={document.getElementById("ImportAddressesDropdownButton")}
        onClose={() => setIsOpenMenu(false)}
        className="ImportAddressesDropdownMenu"
      >
        <MenuItem onClick={openManualModal}>
          <IonIcon
            className="ImportAddressesIcon"
            md={addSharp}
            ios={addOutline}
          />
          <span>Manually</span>
        </MenuItem>

        <MenuItem onClick={openBitBoxModal}>
          <img className="ImportAddressesDropdownImg" src={bitboxLogo} />
          <span>BitBox Wallet</span>
        </MenuItem>

        <MenuItem onClick={openTrezorModal}>
          <img className="ImportAddressesDropdownImg" src={trezorLogo} />
          <span>Trezor Wallet</span>
        </MenuItem>
      </Menu>

      <NewManualAddress
        isOpen={openModal === ImportAddressesDropdownEnum.MANUAL}
        onClose={() => setOpenModal(null)}
      />
    </ButtonGroup>
  );
};

export default ImportAddressesDropdown;
