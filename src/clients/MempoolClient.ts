import { AddressInfo } from "../models/MempoolAddress";
import { Transaction, UTXO } from "../models/MempoolAddressTxs";
import { fetchWithRetry } from "./fetchWithRetry";

export interface MempoolClientConfig {
  baseUrl: string;
}

export class MempoolClient {
  constructor(private readonly baseUrl: string) {}

  async queryAddrInfo(address: string): Promise<AddressInfo | Error> {
    return fetchWithRetry(`${this.baseUrl}/address/${address}`)
      .then((response) => response.json())
      .catch((error) => error);
  }

  // Index the first 10 transactions by block height in descending order
  // for a given address. When the txId is provided, the index will start
  // from that transaction and fetch the next 10 transactions and so on until
  // no more transactions are available.
  async queryTxsByAddr(
    address: string,
    txId?: string,
  ): Promise<Array<Transaction> | Error> {
    const url = txId
      ? `${this.baseUrl}/address/${address}/txs/chain/${txId}`
      : `${this.baseUrl}/address/${address}/txs`;

    return fetchWithRetry(url)
      .then((response) => response.json())
      .catch((error) => error);
  }

  async queryUtxos(address: string): Promise<UTXO[] | Error> {
    return fetchWithRetry(`${this.baseUrl}/address/${address}/utxo`)
      .then((response) => response.json())
      .catch((error) => error);
  }
}
