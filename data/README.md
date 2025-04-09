# Data

For the seek of simplicity and avoiding to pay an API for historical data I decided to use the dataset provided by [Novandra Anugrah in Kaggle](https://www.kaggle.com/datasets/novandraanugrah/bitcoin-historical-datasets-2018-2024/data) using the Avg price of a day and the date as a reference point.

Since I also want to avoid creating an API, the data is compressed in the following format `TTTT.MM.DD,NUMBER.DECIMAL,` and appended one after the other `2018.01.01,13284.27,2018.01.02,14181.76,2018.01.03,14728.78,2018.01.04,14599.02` to decreased the size of the file 370_623 bytes from to 52_338 bytes.

This is based on the assumption that it is easier to comput the data; instead of sending it over the network (PD: I hate apps that takes forever to load).
