# Data

For the seek of simplicity and avoiding to pay an API for historical prices I decided to use the datasets provided by [Novandra Anugrah](https://www.kaggle.com/datasets/novandraanugrah/bitcoin-historical-datasets-2018-2024/data) and [SRK](https://www.kaggle.com/datasets/sudalairajkumar/cryptocurrencypricehistory?select=coin_Bitcoin.csv) in Kaggle, using the Avg price of a day and the date as a reference point.

Since I also want to avoid creating an API, the data is compressed in the following format `TTTTMMDDNUMBERDECIMAL,` and appended one after the other `201801011328427,201801021418176,201801031472878...` to decreased the size of the file from 483_699 bytes to 70_101 bytes.

This is based on the assumption that it is easier to comput the data; instead of sending it over the network.
