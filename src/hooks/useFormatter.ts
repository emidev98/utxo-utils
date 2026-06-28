export const BTCFormatter = (value: number | string) => {
  const amount = typeof value === "string" ? Number(value) : value;

  return (
    (amount / 1e8).toLocaleString(undefined, {
      maximumFractionDigits: 8,
      minimumFractionDigits: 0,
    }) + " ₿"
  );
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
