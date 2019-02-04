# Contributing

The code in this repository is very messy as a one off but I've left it in this repository incase it's useful for anyone...

## How to prepare results

Much of the results need to be manually cleaned up by hand.

1. Copy results spreadsheet
2. Remove columns with open responses for privacy
3. Download raw results from spreadsheet connected to Google Form as CSV
4. Convert CSV to JSON using: https://www.csvjson.com/csv2json
5. Run 'generate-overview-from-responses.js' on file 'responses.csv'