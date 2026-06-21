import { fetchWithRetry } from "./fetchWithRetry";

export interface CoinGeckoClientConfig {
  baseUrl: string;
}

export class CoinGeckoClient {
  constructor(private readonly baseUrl: string) {}

  async getLatestBtcPriceUsd(): Promise<number> {
    const response = await fetchWithRetry(
      `${this.baseUrl}/simple/price?ids=bitcoin&vs_currencies=usd`,
    )
      .then((res) => res.json())
      .catch(() => null);

    return response?.bitcoin?.usd ?? 0;
  }
}
