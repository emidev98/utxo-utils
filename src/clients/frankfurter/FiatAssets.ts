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

export const FIAT_ASSETS_SYMBOLS = {
  "€": FIAT_ASSETS.EUR,
  A$: FIAT_ASSETS.AUD,
  CA$: FIAT_ASSETS.CAD,
  CHF: FIAT_ASSETS.CHF,
  "CN¥": FIAT_ASSETS.CNY,
  Kč: FIAT_ASSETS.CZK,
  kr: FIAT_ASSETS.DKK,
  "£": FIAT_ASSETS.GBP,
  HK$: FIAT_ASSETS.HKD,
  Ft: FIAT_ASSETS.HUF,
  Rp: FIAT_ASSETS.IDR,
  "₹": FIAT_ASSETS.INR,
  "¥": FIAT_ASSETS.JPY,
  "₩": FIAT_ASSETS.KRW,
  MX$: FIAT_ASSETS.MXN,
  RM: FIAT_ASSETS.MYR,
  NZ$: FIAT_ASSETS.NZD,
  zł: FIAT_ASSETS.PLN,
  lei: FIAT_ASSETS.RON,
  SEK: FIAT_ASSETS.SEK,
  S$: FIAT_ASSETS.SGD,
  "₺": FIAT_ASSETS.TRY,
  $: FIAT_ASSETS.USD,
} as const;
