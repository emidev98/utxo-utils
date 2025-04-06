const useFormatter = () => {
  // TODO: crete a setting for the user to toggel display
  // between sats or btc
  const BTCFormatter = (value: number) => {
    return value / 100000000 + " ₿";
  };

  const addressFormatter = (address?: string) => {
    if (!address) return "";

    return `${address.substring(0, 6)}...${address.substring(address.length - 4, address.length)}`;
  };

  return {
    BTCFormatter,
    addressFormatter,
  };
};

export default useFormatter;
