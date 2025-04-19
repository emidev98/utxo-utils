export const BTCFormatter = (value: number | string) => {
  return Number(value) / 1e8 + " ₿";
};

export const SATSFormatter = (value: number | string) => {
  return value.toLocaleString() + " SAT";
};

const _usdFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
export const USDFormatter = (value: number | string) => {
  return _usdFormat.format(Number(value));
};

export const addressFormatter = (address?: string) => {
  if (!address) return "";

  return `${address.substring(0, 6)}...${address.substring(address.length - 4, address.length)}`;
};
