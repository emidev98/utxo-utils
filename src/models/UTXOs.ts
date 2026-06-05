import { UTXO } from "./MempoolAddressTxs";

export interface LocalUTXO {
  //unix timestamp of last update
  lastUpdated: number;
  utxos: Array<UTXO>;
}
