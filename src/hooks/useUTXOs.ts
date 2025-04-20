import _ from "lodash";
import { useTxs } from "./useTxs";
import { VoutWithBlockTime } from "../models/MempoolAddressTxs";
import dayjs from "dayjs";

export const useUTXOs = () => {
  const { getAllTxs } = useTxs();

  // return all UTXO's from your addresses, sorted ascending
  const getAllUTXOs = async (): Promise<Array<VoutWithBlockTime>> => {
    const txs = await getAllTxs();

    if (Object.keys(txs).length === 0) {
      return [];
    }

    return _.chain(txs)
      .map((txs, key) => {
        return txs.map((tx) => {
          const block_time = tx.status.block_time;
          const vouts: Array<VoutWithBlockTime> = [];

          for (const vo of tx.vout) {
            if (vo.scriptpubkey_address === key) {
              vouts.push({
                ...vo,
                block_time: dayjs(block_time * 1000),
              });
            }
          }

          return vouts;
        });
      })
      .flatten()
      .flatten()
      .sort((a, b) => a.block_time.diff(b.block_time))
      .value();
  };

  return {
    getAllUTXOs,
  };
};
