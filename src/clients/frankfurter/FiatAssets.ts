// Assets list respecting the ISO-4217 standard can be extended
// when needed but must be supported by the Frankfurter API

export type FiatAsset = (typeof FIAT_ASSETS)[keyof typeof FIAT_ASSETS];

export function isSupportedFiatAsset(
  asset: string,
): asserts asset is FiatAsset {
  if (!Object.values(FIAT_ASSETS).includes(asset as FiatAsset)) {
    throw new Error(`Invalid fiat asset: ${asset}`);
  }
}

export const FIAT_ASSETS = {
  EUR: "EUR",
  AUD: "AUD",
  CAD: "CAD",
  CHF: "CHF",
  CNY: "CNY",
  CZK: "CZK",
  DKK: "DKK",
  GBP: "GBP",
  HKD: "HKD",
  HUF: "HUF",
  IDR: "IDR",
  INR: "INR",
  JPY: "JPY",
  KRW: "KRW",
  MXN: "MXN",
  MYR: "MYR",
  NZD: "NZD",
  PLN: "PLN",
  RON: "RON",
  SEK: "SEK",
  SGD: "SGD",
  TRY: "TRY",
  USD: "USD",
};
