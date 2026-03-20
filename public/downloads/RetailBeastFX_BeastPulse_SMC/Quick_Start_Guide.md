# BeastPulse SMC – Quick Start Guide (Absolute Beginners)

Get running in under 2 minutes. No guesswork.

---

## Ultra-easy setup (recommended)

1. **Profile:** `Intraday`  
   → Balanced for 5–15 min charts.

2. **Mode:** `Auto`  
   → Strategy picks SMC / ORB / Standard for you.

3. **Asset Type:** Choose your market  
   → `Commodities` (Gold, etc.), `Forex`, `Indices`, or `Crypto`.

4. **Session:** `New York`  
   → Leave as is unless you trade Sydney/London/Crypto only.

5. **HTF Trend Filter:** `ON`  
   → Only trades with the higher-timeframe trend.

6. **Lunch Filter:** `ON`  
   → Avoids 12:00–13:00 NY (choppy).

7. **Enforce Session:** `ON`  
   → Trades only in the main session (off for Crypto 24/7).

**That’s it.** Save, add to chart, and run. The rest is automatic.

---

## What each profile does

| Profile   | Best chart   | Fast MA | Style        |
|----------|--------------|---------|--------------|
| **Scalp**   | 1–5 min      | 5       | Tight, quick |
| **Intraday**| 5–15 min     | 9       | Balanced     |
| **Swing**   | 1H+         | 21      | Wider, HTF   |
| **Custom**  | Your choice | Your inputs | Full control |

- **Scalp:** Short-term, strict session, tighter stops.  
- **Intraday:** Default; good for most beginners.  
- **Swing:** Slower MAs, wider stops, HTF focus.  
- **Custom:** You set Fast/Slow MA in inputs.

---

## What each mode does

| Mode       | When it’s used (Auto)      | Best for              |
|------------|----------------------------|------------------------|
| **SMC**    | High volatility (ATR)      | Scalps, 1m, Crypto    |
| **ORB**    | NY open (9–11)             | Index/FX breakouts     |
| **Standard** | Rest of day             | Trend, 5m–15m         |
| **Auto**   | Switches between above    | Beginners (no choice)  |
| **Custom** | Your rules                | Advanced               |

- **Auto:** Strategy switches mode by time and volatility.  
- **SMC:** Order blocks, FVGs, confluence; session filter off.  
- **ORB:** Opening range breakout + retests; session filter on.  
- **Standard:** Trend + pullbacks; session filter on.

---

## Asset type (why it matters)

- **Crypto:** Suggests SMC, turns off session filter (24/7).  
- **Indices:** Suggests ORB for NY open.  
- **Forex:** Suggests Standard or London ORB.  
- **Commodities:** Suggests SMC on 1m, ORB on 5m–15m.

The **Mode Advisor** (dashboard row 13) shows a short tip for your current Asset + Mode + timeframe.

---

## Filters that protect you

- **HTF Trend Filter:** No longs in HTF downtrend, no shorts in HTF uptrend.  
- **Lunch Filter:** No new trades 12:00–13:00 NY.  
- **News Filter:** Optional block around news (e.g. 08:25–08:35).  
- **Low ATR Filter:** No new trades when volatility is too low (choppy).

Alerts you may see:

- *“HTF Trend Bearish - No Longs”*  
- *“Low ATR - Waiting for Volatility”*  
- *“Market Consolidating - Avoid Entries”*

---

## Suggested first backtests

1. **Gold 5m, Auto, Intraday, Commodities**  
2. **BTC 1m, SMC, Scalp, Crypto**  
3. **SPY 15m, ORB, Intraday, Indices**

Use **Strategy Tester** in TradingView; aim for quality (fewer, higher-quality trades) rather than max number of trades.

---

## Minimal chart (less clutter)

- **Minimal SMC Labels:** ON → fewer SMC labels.  
- **Minimal TP/SL Lines:** ON → TP/SL only when in a position.

---

## Alerts you can create in TradingView

- **Long/Short entries** (with price, SL, TP)  
- **Market Consolidating**  
- **ORB Retest Opportunity**  
- **Snapback Detected**  
- **Reversal Confirmed**  
- **HTF Trend Bearish/Bullish - No Longs/Shorts**  
- **Low ATR - Waiting for Volatility**

Right-click chart → Add alert → Condition: Your strategy → Choose the alert message.

---

## One-line cheat sheet

**Beginner:** Profile = Intraday, Mode = Auto, Asset = your market, HTF + Lunch filter ON.  
**Advanced:** Profile = Custom, Mode = SMC or ORB, tune the rest in inputs.

For full feature list and logic, see the strategy’s in-script comments and the README in this folder.
