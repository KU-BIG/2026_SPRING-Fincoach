"""Generate web/public/stocks.json — the full KRX (KOSPI + KOSDAQ) universe plus a
curated set of popular US tickers, for the portfolio holdings autocomplete.

KRX names/tickers come from pykrx (back-tracking to the latest trading day, like
portfolio_analyzer.ticker_matcher). US symbols are a hand-picked list of the names
Korean retail investors actually hold. Re-run when the listing changes:

    python scripts/gen_stocks.py
"""

from __future__ import annotations

import json
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")

OUT = Path(__file__).resolve().parents[1] / "web" / "public" / "stocks.json"

# Popular US tickers for Korean retail investors (megacaps, semis, software, ETFs, etc.).
US = [
    ("NVDA", "NVIDIA"), ("AAPL", "Apple"), ("MSFT", "Microsoft"), ("GOOGL", "Alphabet (A)"),
    ("GOOG", "Alphabet (C)"), ("AMZN", "Amazon"), ("META", "Meta Platforms"), ("TSLA", "Tesla"),
    ("AVGO", "Broadcom"), ("AMD", "AMD"), ("NFLX", "Netflix"), ("PLTR", "Palantir"),
    ("MU", "Micron"), ("INTC", "Intel"), ("QCOM", "Qualcomm"), ("TSM", "TSMC"),
    ("ASML", "ASML"), ("ARM", "Arm Holdings"), ("SMCI", "Super Micro"), ("MRVL", "Marvell"),
    ("CRM", "Salesforce"), ("ORCL", "Oracle"), ("ADBE", "Adobe"), ("NOW", "ServiceNow"),
    ("SNOW", "Snowflake"), ("CRWD", "CrowdStrike"), ("PANW", "Palo Alto"), ("UBER", "Uber"),
    ("ABNB", "Airbnb"), ("SHOP", "Shopify"), ("COIN", "Coinbase"), ("MSTR", "MicroStrategy"),
    ("HOOD", "Robinhood"), ("SOFI", "SoFi"), ("RIVN", "Rivian"), ("LCID", "Lucid"),
    ("F", "Ford"), ("GM", "General Motors"), ("DIS", "Disney"), ("SBUX", "Starbucks"),
    ("NKE", "Nike"), ("MCD", "McDonald's"), ("KO", "Coca-Cola"), ("PEP", "PepsiCo"),
    ("COST", "Costco"), ("WMT", "Walmart"), ("JPM", "JPMorgan"), ("BAC", "Bank of America"),
    ("V", "Visa"), ("MA", "Mastercard"), ("PYPL", "PayPal"), ("BRK-B", "Berkshire Hathaway B"),
    ("JNJ", "Johnson & Johnson"), ("LLY", "Eli Lilly"), ("UNH", "UnitedHealth"), ("PFE", "Pfizer"),
    ("XOM", "Exxon Mobil"), ("CVX", "Chevron"), ("BA", "Boeing"), ("CAT", "Caterpillar"),
    ("GE", "GE Aerospace"), ("DE", "Deere"), ("T", "AT&T"), ("VZ", "Verizon"),
    ("SPY", "S&P 500 ETF"), ("QQQ", "Nasdaq 100 ETF"), ("VOO", "Vanguard S&P 500 ETF"),
    ("VTI", "Vanguard Total Market ETF"), ("SCHD", "Schwab Dividend ETF"), ("DIA", "Dow Jones ETF"),
    ("IWM", "Russell 2000 ETF"), ("SOXX", "Semiconductor ETF"), ("SMH", "Semiconductor ETF"),
    ("TQQQ", "3x Nasdaq ETF"), ("JEPI", "JPMorgan Equity Premium ETF"), ("VT", "Vanguard Total World ETF"),
]


def load_krx() -> list[dict]:
    """Full KOSPI + KOSDAQ listing via FinanceDataReader (reachable where pykrx's KRX
    endpoint is not). KONEX is skipped — yfinance has no quotes for it."""
    import FinanceDataReader as fdr

    suffix = {"KOSPI": ".KS", "KOSDAQ": ".KQ"}
    df = fdr.StockListing("KRX")
    rows: list[dict] = []
    for _, r in df.iterrows():
        sfx = suffix.get(str(r.get("Market", "")))
        if not sfx:
            continue
        code = str(r["Code"]).zfill(6)
        name = str(r["Name"]).strip()
        if name and name.lower() != "nan":
            rows.append({"ticker": f"{code}{sfx}", "name": name, "currency": "KRW"})
    if not rows:
        raise SystemExit("FinanceDataReader returned no KRX listings")
    print(f"KRX (FDR): {len(rows)} KOSPI+KOSDAQ listings")
    return rows


def main() -> None:
    rows = load_krx()
    rows += [{"ticker": t, "name": n, "currency": "USD"} for t, n in US]
    # De-dup by ticker, preserve order.
    seen: set[str] = set()
    unique = []
    for r in rows:
        if r["ticker"] not in seen:
            seen.add(r["ticker"])
            unique.append(r)
    OUT.write_text(json.dumps(unique, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {len(unique)} stocks -> {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
