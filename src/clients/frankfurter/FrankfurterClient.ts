import { UTCDate } from "@date-fns/utc";
import { fetchWithRetry } from "../fetchWithRetry";
import { Configuration, DefaultApi } from "./client";
import { FIAT_ASSETS, FiatAsset } from "./FiatAssets";

export interface FrankfurterClientConfig {
  baseUrl: string;
}

export class FrankfurterClient {
  defaultApi: DefaultApi;

  constructor(private readonly baseUrl: string) {
    const config = new Configuration({
      basePath: baseUrl,
      fetchApi: fetchWithRetry,
    });
    this.defaultApi = new DefaultApi(config);
  }

  async getPrice(
    base: FiatAsset,
    date: UTCDate,
    quotes: FiatAsset = FIAT_ASSETS.USD,
  ) {
    return this.defaultApi.getRates({
      base,
      quotes,
      date,
    });
  }
}
