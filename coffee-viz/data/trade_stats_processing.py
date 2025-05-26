##############################
# Run this script to generate
# exports_full.csv, imports_full.csv & trades_full.csv
##############################

import pandas as pd

def merge_stats(stats: list[pd.DataFrame], sort_headers: list[str]) -> pd.DataFrame:
    return pd.concat(stats, ignore_index=True).sort_values(by=sort_headers, ascending=True)

def process_all_trade_stats():
    years = [2002, 2007, 2012, 2017, 2022]
    tables = ["trades", "exports", "imports"]
    sort_headers = {"trades": ["Exporter M.49", "Year", "Importer M.49", "Resource"],
                    "exports": ["Exporter M.49", "Year"],
                    "imports": ["Importer M.49", "Year"]}
    
    merged_stats = {}
    for table in tables:
        stats = []
        for year in years:
            df = pd.read_csv(f"resourcetradeearth_csv/{table}-{year}.csv")
            stats.append(df)
        merged_stats[table] = merge_stats(stats, sort_headers[table])
    return merged_stats

# Write full csv files as results
def write_trade_stats():
    stats = process_all_trade_stats()
    for table, df in stats.items():
        df.to_csv(f"{table}_full.csv", index=False)
        print(f"Processed {table} stats for all years.")

if __name__ == "__main__":
    write_trade_stats()
    print("Trade stats processing complete.")
