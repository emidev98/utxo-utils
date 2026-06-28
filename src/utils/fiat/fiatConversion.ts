import { UTCDate } from "@date-fns/utc";
import {
  FIAT_ASSETS,
  FiatAsset,
  FrankfurterClient,
  isSupportedFiatAsset,
} from "../../clients/frankfurter";
import { ParsedExchangeTx } from "../../models/ExchangeData";

interface CommonFiatRate {
  base: FiatAsset;
  quote: FiatAsset;
  rate: number;
  date: Date;
}

const DEFAULT_RANGE_REQUEST_COST_IN_DAYS = 30;
const DEFAULT_MAX_RANGE_SPAN_DAYS = 366;
const DAY_MS = 24 * 60 * 60 * 1000;

const toFiatAsset = (currency: string): FiatAsset | null => {
  const upperCurrency = currency.trim().toUpperCase();

  try {
    isSupportedFiatAsset(upperCurrency);
    return upperCurrency;
  } catch {
    return null;
  }
};

const toRateDate = (date: Date) => date.toISOString().substring(0, 10);

const toDayNumber = (date: string) =>
  Math.floor(Date.parse(`${date}T00:00:00.000Z`) / DAY_MS);

const getRateCacheKey = (base: FiatAsset, quote: FiatAsset, date: string) =>
  `${base}_${quote}_${date}`;

const buildOptimizedDateRanges = (
  dates: string[],
  rangeRequestCostInDays: number,
  maxRangeSpanDays: number,
) => {
  const uniqueDays = Array.from(new Set(dates))
    .map(toDayNumber)
    .sort((a, b) => a - b);

  const rangeCount = uniqueDays.length;
  if (rangeCount === 0) {
    return [];
  }

  const costs = Array<number>(rangeCount + 1).fill(0);
  const nextRangeEnds = Array<number>(rangeCount).fill(0);

  for (let start = rangeCount - 1; start >= 0; start--) {
    costs[start] = Number.POSITIVE_INFINITY;

    for (let end = start; end < rangeCount; end++) {
      const spanDays = uniqueDays[end] - uniqueDays[start] + 1;
      if (spanDays > maxRangeSpanDays) {
        break;
      }

      const cost = rangeRequestCostInDays + spanDays + costs[end + 1];
      if (cost < costs[start]) {
        costs[start] = cost;
        nextRangeEnds[start] = end;
      }
    }
  }

  const ranges: Array<{ from: string; to: string }> = [];

  for (let start = 0; start < rangeCount; ) {
    const end = nextRangeEnds[start];
    ranges.push({
      from: new Date(uniqueDays[start] * DAY_MS).toISOString().substring(0, 10),
      to: new Date(uniqueDays[end] * DAY_MS).toISOString().substring(0, 10),
    });
    start = end + 1;
  }

  return ranges;
};

export async function convertFiatValuesToCommonCurrency(
  transactions: ParsedExchangeTx[],
): Promise<ParsedExchangeTx[]> {
  const targetCurrency = FIAT_ASSETS.USD;
  const client = new FrankfurterClient();
  const rateCache = new Map<string, CommonFiatRate>();
  const sourceCurrencies = new Set<FiatAsset>();
  const apiRateDates: string[] = [];

  for (const transaction of transactions) {
    if (
      transaction.fiatAmount === undefined ||
      !transaction.fiatCurrency?.trim()
    ) {
      continue;
    }

    const baseCurrency = toFiatAsset(transaction.fiatCurrency);
    if (!baseCurrency) {
      continue;
    }

    const rateDate = toRateDate(new UTCDate(transaction.timestamp * 1000));

    if (baseCurrency === targetCurrency) {
      rateCache.set(getRateCacheKey(baseCurrency, targetCurrency, rateDate), {
        base: baseCurrency,
        quote: targetCurrency,
        rate: 1,
        date: new UTCDate(`${rateDate}T00:00:00.000Z`),
      });
    } else {
      sourceCurrencies.add(baseCurrency);
      apiRateDates.push(rateDate);
    }
  }

  const sourceCurrencyList = Array.from(sourceCurrencies);
  if (sourceCurrencyList.length > 0) {
    const ranges = buildOptimizedDateRanges(
      apiRateDates,
      Math.max(1, DEFAULT_RANGE_REQUEST_COST_IN_DAYS),
      Math.max(1, DEFAULT_MAX_RANGE_SPAN_DAYS),
    );

    for (const range of ranges) {
      const rates = await client.getPricesForDateRange(
        targetCurrency,
        new UTCDate(`${range.from}T00:00:00.000Z`),
        new UTCDate(`${range.to}T00:00:00.000Z`),
        sourceCurrencyList.join(","),
      );

      for (const rate of rates) {
        const quote = toFiatAsset(rate.quote);
        if (!quote) {
          continue;
        }

        const rateDate = toRateDate(rate.date);
        rateCache.set(getRateCacheKey(quote, targetCurrency, rateDate), {
          base: quote,
          quote: targetCurrency,
          rate: 1 / rate.rate,
          date: rate.date,
        });
      }
    }
  }

  const getRate = async (
    base: FiatAsset,
    timestamp: number,
  ): Promise<CommonFiatRate> => {
    const date = new UTCDate(timestamp * 1000);
    const cacheKey = getRateCacheKey(base, targetCurrency, toRateDate(date));
    const cachedRate = rateCache.get(cacheKey);
    if (cachedRate) {
      return cachedRate;
    }

    const [frankfurterRate] = await client.getPrice(base, date, targetCurrency);
    if (!frankfurterRate) {
      throw new Error(`Missing fiat exchange rate for ${cacheKey}`);
    }

    const rate: CommonFiatRate = {
      base,
      quote: targetCurrency,
      rate: frankfurterRate.rate,
      date: frankfurterRate.date,
    };

    rateCache.set(cacheKey, rate);
    return rate;
  };

  const converted: ParsedExchangeTx[] = [];

  for (const transaction of transactions) {
    if (
      transaction.fiatAmount === undefined ||
      !transaction.fiatCurrency?.trim()
    ) {
      converted.push(transaction);
      continue;
    }

    const baseCurrency = toFiatAsset(transaction.fiatCurrency);
    if (!baseCurrency) {
      converted.push(transaction);
      continue;
    }

    const rate = await getRate(baseCurrency, transaction.timestamp);

    converted.push({
      ...transaction,
      convertedFiatAmount: transaction.fiatAmount * rate.rate,
      convertedFiatCurrency: targetCurrency,
      fiatExchangeRate: {
        base: rate.base,
        quote: rate.quote,
        rate: rate.rate,
        date: toRateDate(rate.date),
      },
    });
  }

  return converted;
}
