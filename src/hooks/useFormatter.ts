export const BTCFormatter = (value: number) => {
  return value / 100000000 + " ₿";
};

export const USDFormatter = (value: number) => {
  return value.toLocaleString("us-US") + " $";
};

export const addressFormatter = (address?: string) => {
  if (!address) return "";

  return `${address.substring(0, 6)}...${address.substring(address.length - 4, address.length)}`;
};
