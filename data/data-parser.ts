import * as fs from "fs";
import csvParser from "csv-parser";
import dayjs from "dayjs";

interface Data {
  Date: string;
  Low: number;
  High: number;
}

const parseDataUntil2018 = (): Promise<Data[]> => {
  const OLD_DATA = "btc_1d_data_2013_to_2018.csv";

  return new Promise((resolve, reject) => {
    const data: Data[] = [];
    fs.createReadStream(OLD_DATA)
      .pipe(csvParser())
      .on("data", (row) => {
        data.push({
          Date: row.Date,
          High: parseFloat(row.High),
          Low: parseFloat(row.Low),
        });
      })
      .on("end", () => {
        resolve(data);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};

const parseDataFrom2018 = (): Promise<Data[]> => {
  const NOT_SO_OLD_DATA = "btc_1d_data_2018_to_2025.csv";

  return new Promise((resolve, reject) => {
    const data: Data[] = [];
    fs.createReadStream(NOT_SO_OLD_DATA)
      .pipe(csvParser())
      .on("data", (row) => {
        data.push({
          High: parseFloat(row.High),
          Low: parseFloat(row.Low),
          Date: row["Close time"],
        });
      })
      .on("end", () => {
        resolve(data);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};

const storeCompresed = async (data: Data[]) => {
  const parsedDataset: { OpenTime: string; AvgHL: string }[] = data.map(
    (item) => ({
      OpenTime: dayjs(item.Date).format("YYYYMMDD"),
      AvgHL: ((item.High + item.Low) / 2).toFixed(2).replace(".", ""),
    }),
  );
  const parsedDatasetLength = parsedDataset.length;

  // Write the new CSV to a file
  let buffer = Buffer.from([]);
  for (let i = 0; i < parsedDatasetLength; i++) {
    const row = parsedDataset[i];
    let entry = Buffer.from(`${row.OpenTime}${row.AvgHL}`, "utf-8");

    if (i != parsedDatasetLength - 1) {
      entry = Buffer.concat([entry, Buffer.from(",")]);
    }

    buffer = Buffer.concat([buffer, entry]);
  }
  fs.writeFileSync("btc-1-day-avg-historical.txt", buffer);
};

(async () => {
  const datUntil2018 = await parseDataUntil2018();
  const dataFrom2018 = await parseDataFrom2018();
  await storeCompresed([...datUntil2018, ...dataFrom2018]);
})();
