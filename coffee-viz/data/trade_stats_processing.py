##############################
# Run this script to generate
# exports_full.csv, imports_full.csv & trades_full.csv
##############################

import pandas as pd
import json

countryNameEdits = {
    "original": [
        "Russian Federation",
        "Korea, Democratic People’s Republic",
        "Korea, Republic",
        "Cote d'Ivoire",
        "United States",
        "Solomon Islands",
        "Central African Republic",
        "Falkland Islands (Malvinas)",
        "South Sudan"
    ],
    "new": [
        "Russia",
        "North Korea",
        "South Korea",
        "Côte d'Ivoire",
        "United States of America",
        "Solomon Is.",
        "Central African Rep.",
        "Falkland Is.",
        "S. Sudan"
    ]
}

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
        df = merge_stats(stats, sort_headers[table])
        df.replace(countryNameEdits["original"], countryNameEdits["new"], inplace=True)
        merged_stats[table] = df
    return merged_stats

# Write full csv files as results
def write_trade_stats():
    stats = process_all_trade_stats()
    for table, df in stats.items():
        df.to_csv(f"{table}_full.csv", index=False)
        print(f"Processed {table} stats for all years.")
    # Generate a csv file of all countries involved in coffee trading
    trades_df = stats["trades"]
    exporters = set(trades_df["Exporter"].unique()) if "Exporter" in trades_df.columns else set()
    importers = set(trades_df["Importer"].unique()) if "Importer" in trades_df.columns else set()
    all_countries = sorted(exporters.union(importers))
    pd.DataFrame({"Country": all_countries}).to_csv("trade_countries.csv", index=False)
    print("Generated trade_countries.csv with all unique importer/exporter country names.")


def load_country_coords(json_path="trade_countries.json"):
    # read trade_countries.json, which should be a list of dictionaries like [{"country": "Japan", "lat": 123, "lng": 0.5}]
    # and then flatten it into a large dictionary with country as key, lat lngs as item.
    with open(json_path, "r", encoding="utf-8") as f:
        countries = json.load(f)
    coords = {entry["country"]: [entry["lat"], entry["lng"]] for entry in countries}
    with open("country_coords_flat.json", "w", encoding="utf-8") as f:
        json.dump(coords, f, ensure_ascii=False, indent=2)
    print("Flattened country coordinates written to country_coords_flat.json.")


if __name__ == "__main__":
    write_trade_stats()
    print("Trade stats processing complete.")
    # load_country_coords()



