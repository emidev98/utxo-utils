# Data

For the seek of simplicity and avoiding to pay an API for historical data I decided to use the dataset provided by [Novandra Anugrah in Kaggle](https://www.kaggle.com/datasets/novandraanugrah/bitcoin-historical-datasets-2018-2024/data) using the Avg price of a day and the date as a reference point.

Since I also want to avoid creating an API, the data is compressed in the following format `TTTTMMDDNUMBERDECIMAL,` and appended one after the other `201801011328427,201801021418176,201801031472878...` to decreased the size of the file 370_623 bytes from to 41_713 bytes.

This is based on the assumption that it is easier to comput the data; instead of sending it over the network (PD: I hate apps that takes forever to load).
