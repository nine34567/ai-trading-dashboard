import os
import time
import yfinance as yf
import pandas as pd


DATA_DIR = "data"

# คู่เงินที่ใช้ใน backtest
PAIRS = {
    "EURUSD": "EURUSD=X",
    "GBPUSD": "GBPUSD=X",
    "USDJPY": "USDJPY=X",
    "AUDUSD": "AUDUSD=X",
    "USDCAD": "USDCAD=X",
}


def make_spread(symbol: str, close_price: float) -> float:
    """
    สร้างค่า spread ประมาณการไว้ก่อน
    เพราะ Yahoo Finance / yfinance ส่วนใหญ่ไม่มี bid-ask spread จริงให้
    ใช้เพื่อให้ไฟล์ CSV มี column spread ครบตามที่ backtest ต้องการ
    """

    # คู่ JPY ใช้ทศนิยมคนละแบบ
    if "JPY" in symbol:
        # ประมาณ 1.5 pips สำหรับ JPY pair
        return 0.015

    # คู่ non-JPY ประมาณ 1.2 pips
    return 0.00012


def download_pair(symbol: str, ticker: str) -> pd.DataFrame:
    print(f"Downloading {symbol} from Yahoo Finance ticker {ticker} ...")

    # ใช้ 1h แล้ว resample เป็น 4h
    # หมายเหตุ: ข้อมูล intraday ของ Yahoo/YFinance มักมีข้อจำกัดด้านช่วงย้อนหลัง
    df = yf.download(
        tickers=ticker,
        period="730d",
        interval="1h",
        auto_adjust=False,
        progress=False,
    )

    if df.empty:
        raise ValueError(f"No data downloaded for {symbol}")

    # บางเวอร์ชันของ yfinance ได้ column เป็น MultiIndex ต้อง flatten ก่อน
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [col[0] for col in df.columns]

    df = df.reset_index()

    # ชื่อ column เวลาอาจเป็น Datetime หรือ Date
    time_col = "Datetime" if "Datetime" in df.columns else "Date"

    df = df.rename(
        columns={
            time_col: "time",
            "Open": "open",
            "High": "high",
            "Low": "low",
            "Close": "close",
        }
    )

    df = df[["time", "open", "high", "low", "close"]].copy()
    df = df.dropna()

    # ตั้ง time เป็น index เพื่อ resample
    df["time"] = pd.to_datetime(df["time"])
    df = df.set_index("time")

    # แปลง 1H เป็น 4H
    h4 = df.resample("4h").agg(
        {
            "open": "first",
            "high": "max",
            "low": "min",
            "close": "last",
        }
    )

    h4 = h4.dropna().reset_index()

    # เพิ่ม spread ประมาณการ
    h4["spread"] = h4["close"].apply(lambda x: make_spread(symbol, x))

    # จัด format column
    h4 = h4[["time", "open", "high", "low", "close", "spread"]]

    return h4


def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    for symbol, ticker in PAIRS.items():
        try:
            df = download_pair(symbol, ticker)

            output_path = os.path.join(DATA_DIR, f"{symbol}_H4.csv")
            df.to_csv(output_path, index=False)

            print(f"Saved: {output_path}")
            print(f"Rows: {len(df)}")
            print("-" * 50)

            # กันยิง request ถี่เกิน
            time.sleep(2)

        except Exception as e:
            print(f"ERROR downloading {symbol}: {e}")
            print("-" * 50)

    print("Done.")


if __name__ == "__main__":
    main()
