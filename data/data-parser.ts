import * as fs from "fs";
import csvParser from "csv-parser";
import dayjs from "dayjs";

interface Data {
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
  CloseTime: string;
}

const parseCsv = (filePath: string): Promise<Data[]> => {
  return new Promise((resolve, reject) => {
    const data: Data[] = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => {
        data.push({
          Open: parseFloat(row.Open),
          High: parseFloat(row.High),
          Low: parseFloat(row.Low),
          Close: parseFloat(row.Close),
          Volume: parseFloat(row.Volume),
          CloseTime: row["Close time"],
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
      OpenTime: dayjs(item.CloseTime).format("YYYYMMDD"),
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
  fs.writeFileSync(dayjs().format("YYYY-MM-DD") + ".bin", buffer);
};

parseCsv("btc_1d_data_2018_to_2025.csv")
  .then(storeCompresed)
  .catch((err) => console.error(err));
