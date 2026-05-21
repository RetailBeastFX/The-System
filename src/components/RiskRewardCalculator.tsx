'use client';

import { useState, useMemo, useEffect, useRef } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────
type FeeType   = "perLot"|"perContract"|"perShare"|"perTrade"|"percent"|"flat"|"spreadOnly";
type BrkStatus = "regulated"|"offshore"|"prop"|"varies";
type AssetKey  = "FOREX"|"STOCKS"|"OPTIONS"|"FUTURES"|"CRYPTO";

interface Broker   { name:string; status:BrkStatus; leverage:number; fee:number; feeType:FeeType; note:string; }
interface AssetCfg { label:string; icon:string; color:string; unitLabel:string; slUnit:string; symbols:string[]; defaultSymbol:string; slPH:string; slStep:string; }
interface FutSpec  { tick:number; tv:number; name:string; }

const STATUS: Record<BrkStatus,{label:string;color:string}> = {
  regulated:{label:"Regulated",color:"#00e5a0"},
  offshore: {label:"Offshore", color:"#ffb800"},
  prop:     {label:"Prop",     color:"#c084fc"},
  varies:   {label:"Varies",   color:"#94a3b8"},
};

// ─── Broker Directory ────────────────────────────────────────────────────────
const BROKERS: Record<AssetKey, Broker[]> = {
  FOREX: [
    {name:"IC Markets",       status:"regulated",leverage:500,  fee:3.50, feeType:"perLot",    note:"ASIC, CySEC — Raw spread ECN"},
    {name:"Pepperstone",      status:"regulated",leverage:500,  fee:3.50, feeType:"perLot",    note:"ASIC, FCA, DFSA"},
    {name:"OANDA",            status:"regulated",leverage:50,   fee:0,    feeType:"spreadOnly",note:"US / Canada regulated"},
    {name:"IG Group",         status:"regulated",leverage:200,  fee:0,    feeType:"spreadOnly",note:"FCA, ASIC — global"},
    {name:"Forex.com",        status:"regulated",leverage:50,   fee:0,    feeType:"spreadOnly",note:"US CFTC/NFA regulated"},
    {name:"FXCM",             status:"regulated",leverage:200,  fee:0,    feeType:"spreadOnly",note:"FCA, ASIC"},
    {name:"TD Ameritrade FX", status:"regulated",leverage:50,   fee:0,    feeType:"spreadOnly",note:"thinkorswim — US regulated"},
    {name:"Interactive Brokers FX",status:"regulated",leverage:40,fee:2.00,feeType:"perLot", note:"IBKR — tight spreads, low fee"},
    {name:"Coinexx",          status:"offshore", leverage:500,  fee:2.00, feeType:"perLot",    note:"Offshore — crypto deposits"},
    {name:"Hankotrade",       status:"offshore", leverage:500,  fee:2.00, feeType:"perLot",    note:"Offshore — no KYC tiers"},
    {name:"Hugo's Way",       status:"offshore", leverage:500,  fee:5.00, feeType:"perLot",    note:"Offshore — MT4/MT5"},
    {name:"Sway Markets",     status:"offshore", leverage:500,  fee:3.50, feeType:"perLot",    note:"Offshore — no restrictions"},
    {name:"Exness",           status:"offshore", leverage:2000, fee:3.50, feeType:"perLot",    note:"Offshore — highest leverage"},
    {name:"XM",               status:"offshore", leverage:888,  fee:0,    feeType:"spreadOnly",note:"Offshore — bonus programs"},
    {name:"FBS",              status:"offshore", leverage:3000, fee:0,    feeType:"spreadOnly",note:"Offshore — micro lots"},
    {name:"RoboForex",        status:"offshore", leverage:2000, fee:4.00, feeType:"perLot",    note:"Offshore — cent accounts"},
    {name:"Alpari",           status:"offshore", leverage:1000, fee:3.00, feeType:"perLot",    note:"Offshore — longest running"},
    {name:"FxPro",            status:"regulated",leverage:500,  fee:3.50, feeType:"perLot",    note:"FCA, CySEC — MT4/cTrader"},
    {name:"Vantage",          status:"regulated",leverage:500,  fee:3.00, feeType:"perLot",    note:"ASIC — RAW ECN"},
    {name:"EightCap",         status:"regulated",leverage:500,  fee:3.50, feeType:"perLot",    note:"ASIC — MT4/MT5"},
    {name:"ThinkMarkets",     status:"regulated",leverage:500,  fee:3.50, feeType:"perLot",    note:"FCA, ASIC — ThinkTrader"},
    {name:"Tickmill",         status:"regulated",leverage:500,  fee:2.00, feeType:"perLot",    note:"FCA — tightest commissions"},
    {name:"FTMO",             status:"prop",     leverage:100,  fee:0,    feeType:"flat",      note:"Prop — 90% split, popular"},
    {name:"The5%ers",         status:"prop",     leverage:30,   fee:0,    feeType:"flat",      note:"Prop — scaling plan"},
    {name:"E8 Funding",       status:"prop",     leverage:100,  fee:0,    feeType:"flat",      note:"Prop — 80% split"},
    {name:"MyForexFunds",     status:"prop",     leverage:100,  fee:0,    feeType:"flat",      note:"Prop — rapid eval"},
  ],
  FUTURES: [
    {name:"NinjaTrader",         status:"regulated",leverage:50,fee:0.09,feeType:"perContract",note:"NinjaTrader platform"},
    {name:"Tradovate",           status:"regulated",leverage:50,fee:0.35,feeType:"perContract",note:"Cloud-based — monthly sub"},
    {name:"AMP Futures",         status:"regulated",leverage:40,fee:0.05,feeType:"perContract",note:"Lowest NFA fees"},
    {name:"TradeStation",        status:"regulated",leverage:50,fee:1.50,feeType:"perContract",note:"Full-service US broker"},
    {name:"Optimus Futures",     status:"regulated",leverage:50,fee:0.25,feeType:"perContract",note:"Volume-tiered pricing"},
    {name:"Interactive Brokers", status:"regulated",leverage:50,fee:0.85,feeType:"perContract",note:"Global — lowest margin rates"},
    {name:"Charles Schwab",      status:"regulated",leverage:50,fee:1.50,feeType:"perContract",note:"thinkorswim platform"},
    {name:"Stage 5 Trading",     status:"regulated",leverage:50,fee:0.25,feeType:"perContract",note:"Low cost — Rithmic/CQG"},
    {name:"EdgeClear",           status:"regulated",leverage:50,fee:0.35,feeType:"perContract",note:"US — community focused"},
    {name:"Wedbush Futures",     status:"regulated",leverage:50,fee:0.50,feeType:"perContract",note:"US — FCM, low minimums"},
    {name:"Topstep",             status:"prop",     leverage:50,fee:0,   feeType:"flat",       note:"90% split · $49/mo eval"},
    {name:"Apex Trader Funding", status:"prop",     leverage:50,fee:0,   feeType:"flat",       note:"90% split · $35/mo eval"},
    {name:"TradeDay",            status:"prop",     leverage:50,fee:0,   feeType:"flat",       note:"90% split · $39/mo eval"},
    {name:"Earn2Trade",          status:"prop",     leverage:50,fee:0,   feeType:"flat",       note:"80% split — Gauntlet eval"},
    {name:"MyFundedFutures",     status:"prop",     leverage:50,fee:0,   feeType:"flat",       note:"Up to 100% split"},
    {name:"Bulenox",             status:"prop",     leverage:50,fee:0,   feeType:"flat",       note:"Prop — low cost evals"},
  ],
  CRYPTO: [
    {name:"Binance",           status:"varies",   leverage:125,fee:0.10, feeType:"percent",note:"0.10% m/t — largest CEX"},
    {name:"Coinbase Advanced", status:"regulated",leverage:1,  fee:0.60, feeType:"percent",note:"0.40/0.60% m/t — US/EU"},
    {name:"Kraken",            status:"regulated",leverage:50, fee:0.26, feeType:"percent",note:"0.16/0.26% m/t — US regulated"},
    {name:"Bybit",             status:"offshore", leverage:100,fee:0.10, feeType:"percent",note:"0.10% m/t — offshore derivatives"},
    {name:"OKX",               status:"offshore", leverage:125,fee:0.08, feeType:"percent",note:"0.08% m/t — global"},
    {name:"MEXC",              status:"offshore", leverage:200,fee:0.01, feeType:"percent",note:"0% maker / 0.01% taker"},
    {name:"Phemex",            status:"offshore", leverage:100,fee:0.06, feeType:"percent",note:"0.06% m/t — offshore"},
    {name:"BitMEX",            status:"offshore", leverage:100,fee:0.075,feeType:"percent",note:"0.075% taker — perp only"},
    {name:"KuCoin",            status:"offshore", leverage:100,fee:0.10, feeType:"percent",note:"0.10% m/t — wide altcoins"},
    {name:"Gate.io",           status:"offshore", leverage:100,fee:0.10, feeType:"percent",note:"0.10% m/t — most altcoins"},
    {name:"Bitget",            status:"offshore", leverage:125,fee:0.06, feeType:"percent",note:"0.06% m/t — copy trading"},
    {name:"dYdX",              status:"offshore", leverage:20, fee:0.05, feeType:"percent",note:"0.02/0.05% — decentralized"},
    {name:"Robinhood Crypto",  status:"regulated",leverage:1,  fee:0,    feeType:"flat",   note:"$0 — spread only, US regulated"},
    {name:"Webull Crypto",     status:"regulated",leverage:1,  fee:0,    feeType:"flat",   note:"$0 — spread only, US regulated"},
  ],
  STOCKS: [
    {name:"Charles Schwab",      status:"regulated",leverage:4,  fee:0,    feeType:"flat",    note:"$0/trade — thinkorswim"},
    {name:"Interactive Brokers", status:"regulated",leverage:4,  fee:0.005,feeType:"perShare", note:"$0.005/share — pro tools"},
    {name:"Fidelity",            status:"regulated",leverage:4,  fee:0,    feeType:"flat",    note:"$0/trade — no PFOF"},
    {name:"Webull",              status:"regulated",leverage:4,  fee:0,    feeType:"flat",    note:"$0 — Level 2 included"},
    {name:"Robinhood",           status:"regulated",leverage:2,  fee:0,    feeType:"flat",    note:"$0 — PFOF model"},
    {name:"tastytrade",          status:"regulated",leverage:4,  fee:0,    feeType:"flat",    note:"$0 stocks — options focus"},
    {name:"Moomoo",              status:"regulated",leverage:4,  fee:0,    feeType:"flat",    note:"$0 — Level 2 free"},
    {name:"Public",              status:"regulated",leverage:1,  fee:0,    feeType:"flat",    note:"$0 — no PFOF, social"},
    {name:"SoFi Invest",         status:"regulated",leverage:1,  fee:0,    feeType:"flat",    note:"$0 — fractional shares"},
    {name:"Ally Invest",         status:"regulated",leverage:4,  fee:0,    feeType:"flat",    note:"$0/trade — Ally Bank linked"},
    {name:"E*TRADE",             status:"regulated",leverage:4,  fee:0,    feeType:"flat",    note:"$0 — Morgan Stanley"},
    {name:"Merrill Edge",        status:"regulated",leverage:4,  fee:0,    feeType:"flat",    note:"$0 — BofA preferred rewards"},
    {name:"TradeZero",           status:"offshore", leverage:6,  fee:0,    feeType:"flat",    note:"No PDT — offshore"},
    {name:"CMEG",                status:"offshore", leverage:6,  fee:2.95, feeType:"perTrade",note:"No PDT — $2.95/trade"},
    {name:"Lightspeed",          status:"regulated",leverage:6,  fee:0.004,feeType:"perShare",note:"$0.004/share — DMA"},
    {name:"DAS Trader Pro",      status:"regulated",leverage:6,  fee:0.005,feeType:"perShare",note:"$0.005/share — DMA platform"},
  ],
  OPTIONS: [
    {name:"Charles Schwab",      status:"regulated",leverage:4,fee:0.65,feeType:"perContract",note:"$0.65/contract"},
    {name:"Interactive Brokers", status:"regulated",leverage:4,fee:0.65,feeType:"perContract",note:"$0.15–$0.65 tiered"},
    {name:"tastytrade",          status:"regulated",leverage:4,fee:1.00,feeType:"perContract",note:"$1 open / $0 close"},
    {name:"Fidelity",            status:"regulated",leverage:4,fee:0.65,feeType:"perContract",note:"$0.65/contract"},
    {name:"Webull",              status:"regulated",leverage:4,fee:0,   feeType:"flat",       note:"$0 options — PFOF"},
    {name:"Robinhood",           status:"regulated",leverage:4,fee:0,   feeType:"flat",       note:"$0 — PFOF model"},
    {name:"Tradier",             status:"regulated",leverage:4,fee:0.35,feeType:"perContract",note:"$0.35/contract"},
    {name:"Power E*TRADE",       status:"regulated",leverage:4,fee:0.65,feeType:"perContract",note:"$0.65 / $0.50 high vol"},
    {name:"TD Ameritrade",       status:"regulated",leverage:4,fee:0.65,feeType:"perContract",note:"$0.65/contract — thinkorswim"},
    {name:"Ally Invest",         status:"regulated",leverage:4,fee:0.50,feeType:"perContract",note:"$0.50/contract"},
    {name:"Merrill Edge",        status:"regulated",leverage:4,fee:0.65,feeType:"perContract",note:"$0.65/contract"},
    {name:"Moomoo",              status:"regulated",leverage:4,fee:0,   feeType:"flat",       note:"$0 — PFOF, Level 2 free"},
    {name:"Public",              status:"regulated",leverage:4,fee:0,   feeType:"flat",       note:"$0 — no PFOF options"},
  ],
};

// ─── Asset + Futures config ──────────────────────────────────────────────────
const ASSETS: Record<AssetKey, AssetCfg> = {
  FOREX:   {label:"Forex",   icon:"FX",  color:"#00d4ff",unitLabel:"Lots",     slUnit:"pips",       symbols:["EURUSD","GBPUSD","USDJPY","XAUUSD","GBPJPY","AUDUSD","USDCAD","EURJPY","USDCHF","NZDUSD"],defaultSymbol:"EURUSD",slPH:"20",   slStep:"0.5"},
  STOCKS:  {label:"Stocks",  icon:"EQ",  color:"#00e5a0",unitLabel:"Shares",   slUnit:"$/share",    symbols:["AAPL","MSFT","NVDA","TSLA","SPY","QQQ","GOOGL","AMZN","META","AMD"],                      defaultSymbol:"AAPL",  slPH:"2.00", slStep:"0.01"},
  OPTIONS: {label:"Options", icon:"OPT", color:"#ffb800", unitLabel:"Contracts",slUnit:"$/contract", symbols:["SPY","QQQ","AAPL","NVDA","TSLA","MSFT","AMD","META"],                                     defaultSymbol:"SPY",   slPH:"0.50", slStep:"0.01"},
  FUTURES: {label:"Futures", icon:"FUT", color:"#c084fc",unitLabel:"Contracts",slUnit:"ticks",      symbols:["ES","NQ","YM","RTY","MES","MNQ","CL","GC","SI","ZB"],                                      defaultSymbol:"ES",    slPH:"8",    slStep:"1"},
  CRYPTO:  {label:"Crypto",  icon:"₿",   color:"#fb923c",unitLabel:"Units",    slUnit:"$ move",     symbols:["BTCUSD","ETHUSD","SOLUSD","XRPUSD","AVAXUSD","BNBUSD","LINKUSD","ADAUSD"],                defaultSymbol:"BTCUSD",slPH:"500",  slStep:"10"},
};

const FUTURES_SPECS: Record<string, FutSpec> = {
  ES: {tick:0.25,tv:12.50,name:"S&P 500 E-Mini"},
  MES:{tick:0.25,tv:1.25, name:"Micro S&P 500"},
  NQ: {tick:0.25,tv:5.00, name:"Nasdaq E-Mini"},
  MNQ:{tick:0.25,tv:0.50, name:"Micro Nasdaq"},
  YM: {tick:1.00,tv:5.00, name:"Dow E-Mini"},
  RTY:{tick:0.10,tv:5.00, name:"Russell 2000"},
  CL: {tick:0.01,tv:10.00,name:"Crude Oil"},
  GC: {tick:0.10,tv:10.00,name:"Gold (Comex)"},
  SI: {tick:0.005,tv:25.00,name:"Silver"},
  ZB: {tick:0.03125,tv:31.25,name:"30Y T-Bond"},
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function r2(n:number){return Math.round((n+Number.EPSILON)*100)/100;}
function fmtD(n:number){return"$"+Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});}

/** Default pip value per standard lot by symbol */
function defaultPipVal(sym:string):number {
  const s=sym.toUpperCase();
  if(s==="XAUUSD")return 1.00;
  if(s.includes("JPY"))return 6.50;
  if(s.startsWith("USD"))return 7.50;
  return 10;
}

// ─── Core Engine ─────────────────────────────────────────────────────────────
// Pure formula: Size = Risk$ ÷ (SL × PipValue)
interface CalcResult {
  size:number;       // lots / shares / contracts
  riskDollar:number; // exact $ at risk
  pipValue:number;   // $/pip or $/tick or $/unit
  fee:number;        // round-trip commission
  win1R:number;      // profit at 1:1
  win2R:number;      // profit at 2:1
  win3R:number;      // profit at 3:1
  pctRisk:number;    // % of account at risk
  rrActual:number;   // actual R:R if tp set
  tpWin:number;      // $ win at tp distance
}

function calc(
  asset:AssetKey, sym:string,
  bal:number, riskDollar:number,
  slDist:number, tpDist:number,
  customPV:number, tickTV:number,
  broker:Broker|null,
):CalcResult|null {
  if(!bal||bal<=0||!riskDollar||riskDollar<=0)return null;

  let size=0, pipValue=0;

  if(asset==="FOREX"){
    pipValue = customPV>0 ? customPV : defaultPipVal(sym);
    if(!slDist||slDist<=0)return null;
    size = r2(riskDollar/(slDist*pipValue));
    if(size<0.01)size=0.01;
  } else if(asset==="CRYPTO"){
    // cryptos: pip value = $ per unit per pip move (default 1)
    pipValue = customPV>0 ? customPV : 1;
    if(!slDist||slDist<=0)return null;
    size = r2(riskDollar/(slDist*pipValue));
    if(size<0.001)size=0.001;
  } else if(asset==="FUTURES"){
    pipValue = tickTV||12.50; // $/tick
    if(!slDist||slDist<=0)return null;
    size = Math.max(1,Math.floor(riskDollar/(slDist*pipValue)));
  } else if(asset==="STOCKS"){
    pipValue = 1; // $/share
    if(!slDist||slDist<=0)return null;
    size = Math.max(1,Math.floor(riskDollar/slDist));
  } else if(asset==="OPTIONS"){
    pipValue = 100; // 100 shares/contract
    if(!slDist||slDist<=0)return null;
    size = Math.max(1,Math.floor(riskDollar/(slDist*100)));
  } else {
    return null;
  }

  // Commission round-trip
  let fee=0;
  if(broker){
    switch(broker.feeType){
      case"perLot":case"perContract":case"perShare": fee=r2(broker.fee*size*2); break;
      case"perTrade": fee=r2(broker.fee*2); break;
      case"percent":  fee=r2((broker.fee/100)*size*2); break;
      default: break;
    }
  }

  const slLoss = r2(size*pipValue*slDist);
  const win1R  = r2(slLoss - fee);
  const win2R  = r2(slLoss*2 - fee);
  const win3R  = r2(slLoss*3 - fee);
  const tpWin  = tpDist>0 ? r2(size*pipValue*tpDist - fee) : 0;
  const rrActual = tpDist>0&&slDist>0 ? r2(tpDist/slDist) : 0;
  const pctRisk  = r2((slLoss/bal)*100);
  const rD       = r2(slLoss+fee);

  return{size,riskDollar:rD,pipValue,fee,win1R,win2R,win3R,pctRisk,rrActual,tpWin};
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function RiskRewardCalculator(){
  const[asset, setAsset]       = useState<AssetKey>("FOREX");
  const[symbol, setSymbol]     = useState("EURUSD");
  const[direction, setDir]     = useState<"Long"|"Short">("Long");
  const[balance, setBalance]   = useState("10000");
  const[riskPct, setRiskPct]   = useState("1");      // % of balance
  const[riskDollar, setRiskD]  = useState("");       // override: direct $ risk
  const[riskMode, setRMode]    = useState<"pct"|"dollar">("pct"); // toggle
  const[slPips, setSlPips]     = useState("20");
  const[quickSL, setQuickSL]   = useState<number|null>(20); // quick preset selection
  const[tpPips, setTpPips]     = useState("40");
  const[customPV, setCustPV]   = useState("");
  const[tickTV, setTickTV]     = useState("12.50");
  const[brokerName, setBroker] = useState("IC Markets");
  const[showBrokers, setShowB] = useState(false);
  const[showAddBrk, setShowAdd]= useState(false);
  const[newBrkName, setNBName] = useState("");
  const[newBrkLev,  setNBLev]  = useState("100");
  const[newBrkFee,  setNBFee]  = useState("0");
  const[newBrkType, setNBType] = useState<FeeType>("perLot");
  const[customBrokers, setCustomBrokers] = useState<Record<AssetKey,Broker[]>>(()=>{
    try{
      const s=typeof window!=="undefined"?localStorage.getItem("rbfx_custom_brokers_v1"):null;
      return s?JSON.parse(s):{FOREX:[],STOCKS:[],OPTIONS:[],FUTURES:[],CRYPTO:[]};
    }catch{return{FOREX:[],STOCKS:[],OPTIONS:[],FUTURES:[],CRYPTO:[]};}
  });
  const[toast, setToast]       = useState<string|null>(null);
  const toastTimer             = useRef<ReturnType<typeof setTimeout>|null>(null);

  const cfg      = ASSETS[asset];
  const color    = cfg.color;
  const bList    = [...(customBrokers[asset]||[]), ...(BROKERS[asset]||[])];
  const broker   = bList.find(b=>b.name===brokerName)||bList[0]||null;
  const leverage = broker?.leverage||50;
  const futSpec  = FUTURES_SPECS[symbol.toUpperCase()];
  const sym      = (symbol||cfg.defaultSymbol).toUpperCase();

  const bal   = parseFloat(balance)||0;
  const sl    = parseFloat(slPips)||0;
  const tp    = parseFloat(tpPips)||0;
  const cpv   = parseFloat(customPV)||0;
  const tv    = parseFloat(tickTV)||12.50;

  // Effective risk dollar: either % of bal or direct $ input
  const effRiskD = riskMode==="dollar"
    ? (parseFloat(riskDollar)||0)
    : r2(bal*(parseFloat(riskPct)||1)/100);

  const effectivePV = asset==="FOREX"
    ? (cpv>0?cpv:defaultPipVal(sym))
    : asset==="FUTURES"?tv
    : 1;

  const res = useMemo(
    ()=>calc(asset,sym,bal,effRiskD,sl,tp,cpv,tv,broker),
    [asset,sym,bal,effRiskD,sl,tp,cpv,tv,broker]
  );

  // Round-down sizing: always floor to nearest 0.01 (never over-risk)
  const exactSize = res?.size??0;
  const safeSize  = exactSize>0 ? Math.floor(exactSize*100)/100 : 0;
  const showExact = exactSize>0 && r2(exactSize*100)/100 !== safeSize; // true when floor changed value

  // Min-lot warning: if exactSize was below broker floor (0.01 for Forex)
  const minLot = asset==="FOREX"||asset==="CRYPTO" ? 0.01 : 1;
  const atMinLot = exactSize>0 && exactSize<minLot*1.5 && safeSize<=minLot;

  // Margin estimate (Forex only)
  const marginEst = res&&asset==="FOREX"&&leverage>0
    ? r2((safeSize*100000)/leverage)
    : null;

  // (animation key is derived from safeSize directly as JSX key — no extra state needed)

  // Toast helper
  const showToast=(msg:string)=>{
    setToast(msg);
    if(toastTimer.current)clearTimeout(toastTimer.current);
    toastTimer.current=setTimeout(()=>setToast(null),2200);
  };

  // Copy lot size
  const copySize=()=>{
    if(!safeSize)return;
    const txt=`${safeSize} ${cfg.unitLabel.toLowerCase()}`;
    navigator.clipboard.writeText(txt).then(()=>showToast(`Copied: ${txt}`));
  };
  // Copy full trade line — clean execution format
  const copyLine=()=>{
    if(!safeSize||!sl)return;
    const action = direction==="Long"?"BUY":"SELL";
    const pct = riskMode==="pct" ? `${riskPct}%` : `${r2(effRiskD/bal*100).toFixed(1)}%`;
    const tpLine = tp>0 ? `\nTP: ${tp} ${cfg.slUnit}` : "";
    const txt=`${sym} ${action} ${safeSize} ${cfg.unitLabel.toUpperCase()}\nSL: ${sl} ${cfg.slUnit}${tpLine}\nRisk: ${fmtD(res?.riskDollar??0)} (${pct})`;
    navigator.clipboard.writeText(txt).then(()=>showToast("Trade copied!"));
  };

  // Switch mode: auto-populate $ field from current effective risk
  const switchMode=(m:"pct"|"dollar")=>{
    if(m==="dollar"&&riskMode==="pct"&&effRiskD>0){
      setRiskD(effRiskD.toFixed(2));
    }
    setRMode(m);
  };

  // Custom broker helpers
  const saveCustom=(next:Record<AssetKey,Broker[]>)=>{
    setCustomBrokers(next);
    try{localStorage.setItem("rbfx_custom_brokers_v1",JSON.stringify(next));}catch{}
  };
  const addBroker=()=>{
    if(!newBrkName.trim())return;
    const nb:Broker={name:newBrkName.trim(),status:"varies",leverage:parseFloat(newBrkLev)||100,fee:parseFloat(newBrkFee)||0,feeType:newBrkType,note:"Custom"};
    const next={...customBrokers,[asset]:[nb,...(customBrokers[asset]||[])]};
    saveCustom(next);setBroker(nb.name);setNBName("");setNBLev("100");setNBFee("0");setShowAdd(false);
    showToast(`Added: ${nb.name}`);
  };
  const removeBroker=(name:string)=>{
    const next={...customBrokers,[asset]:(customBrokers[asset]||[]).filter(b=>b.name!==name)};
    saveCustom(next);
    if(brokerName===name)setBroker(bList.find(b=>b.name!==name)?.name||"");
    showToast(`Removed: ${name}`);
  };

  // Clear toast on unmount
  useEffect(()=>()=>{ if(toastTimer.current)clearTimeout(toastTimer.current); },[]);

  const switchAsset=(a:AssetKey)=>{
    setAsset(a);
    const s0=ASSETS[a].defaultSymbol;
    setSymbol(s0);
    const bl=BROKERS[a];if(bl?.length)setBroker(bl[0].name);
    if(a==="FUTURES"){const sp=FUTURES_SPECS[s0];if(sp)setTickTV(sp.tv.toString());}
  };
  const handleSym=(v:string)=>{
    const u=v.toUpperCase();setSymbol(u);
    if(asset==="FUTURES"){const sp=FUTURES_SPECS[u];if(sp)setTickTV(sp.tv.toString());}
  };

  // Styles
  const inp ="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm font-mono outline-none transition-all text-white placeholder-slate-700 focus:border-white/25 focus:bg-black/60";
  const sel ="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white outline-none cursor-pointer focus:border-white/25";

  const pctColor = (res?.pctRisk||0)>3?"#f87171":(res?.pctRisk||0)>2?"#fbbf24":"#34d399";
  const showRiskWarning = (res?.pctRisk||0) > 2;

  return(
    <div className="min-h-screen text-white"
      style={{background:"linear-gradient(160deg,#050a10 0%,#060c14 60%,#04080f 100%)",fontFamily:"'IBM Plex Mono','Courier New',monospace"}}>

      {/* Toast notification */}
      {toast&&(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold"
          style={{background:"rgba(5,10,17,0.97)",borderColor:color+"60",color,boxShadow:`0 4px 24px ${color}20`,animation:"popIn 0.2s ease both"}}>
          ✓ {toast}
        </div>
      )}

      {/* dot grid ambient */}
      <div className="fixed inset-0 pointer-events-none"
        style={{backgroundImage:"radial-gradient(circle,#ffffff05 1px,transparent 1px)",backgroundSize:"28px 28px"}}/>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{background:`radial-gradient(ellipse at 50% 0%,${color}12 0%,transparent 70%)`}}/>

      <div className="relative max-w-4xl mx-auto px-4 py-8">

        {/* ── HEADER */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:color,boxShadow:`0 0 6px ${color}`}}/>
          <span className="text-[11px] font-black uppercase tracking-[0.3em]" style={{color:color+"80"}}>RetailBeastFX</span>
          <span className="text-slate-700 mx-1">·</span>
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-600">Risk Calculator</span>
        </div>
        <h1 className="text-3xl font-black mb-1">
          Know your risk <span style={{color}}>before you click buy.</span>
        </h1>
        <p className="text-[11px] text-slate-700 mb-7 uppercase tracking-widest">
          Balance → Risk → Size. The only number that matters.
        </p>

        {/* ── ASSET TABS */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {(Object.entries(ASSETS) as [AssetKey,AssetCfg][]).map(([id,c])=>(
            <button key={id} onClick={()=>switchAsset(id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-[11px] font-black transition-all uppercase tracking-wider"
              style={asset===id
                ?{borderColor:c.color,color:c.color,background:c.color+"14",boxShadow:`0 0 12px ${c.color}18`}
                :{borderColor:"rgba(255,255,255,0.05)",color:"#334155"}}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* ── MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* ───── LEFT: INPUTS ───── */}
          <div className="lg:col-span-2 space-y-3">

            {/* Account block */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-4 flex items-center gap-2">
                <div className="w-0.5 h-3 rounded-full" style={{background:color}}/>
                Account
              </div>

              {/* Balance */}
              <div className="mb-3">
                <label className="text-[10px] uppercase tracking-widest text-slate-600 mb-1.5 block">Balance</label>
                <div className="flex items-center gap-2 bg-black/50 border border-white/[0.08] rounded-xl px-3.5 py-3.5 focus-within:border-white/20">
                  <span className="text-slate-600 font-bold">$</span>
                  {/* text-base (16px) prevents iOS auto-zoom on focus */}
                  <input value={balance} onChange={e=>setBalance(e.target.value)}
                    className="bg-transparent outline-none flex-1 text-base sm:text-xl font-black text-white placeholder-slate-800 min-w-0 tabular-nums touch-manipulation"
                    placeholder="10,000" inputMode="decimal"/>
                </div>
                <p className="text-[10px] text-slate-700 mt-1">USD account assumed · change pip value for other currencies</p>
              </div>

              {/* Risk input — pct / dollar toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-slate-600">Risk</label>
                  <div className="flex bg-black/40 border border-white/[0.06] rounded-lg p-0.5">
                    {(["pct","dollar"] as const).map(m=>(
                      <button key={m} onClick={()=>switchMode(m)}
                        className="px-2.5 py-1 rounded-md text-[10px] font-black transition-all"
                        style={riskMode===m?{color,background:color+"18"}:{color:"#475569"}}>
                        {m==="pct"?"%":"$"}
                      </button>
                    ))}
                  </div>
                </div>

                {riskMode==="pct"?(
                  <>
                    {/* Quick % presets */}
                    <div className="grid grid-cols-5 gap-1 p-1 bg-black/40 border border-white/[0.06] rounded-xl mb-2">
                      {["0.5","1","2","3","5"].map(p=>(
                        <button key={p} onClick={()=>setRiskPct(p)}
                          className="py-2 rounded-lg text-[10px] font-black transition-all"
                          style={riskPct===p?{color,background:color+"18"}:{color:"#334155"}}>
                          {p}%
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <input type="number" value={riskPct} onChange={e=>setRiskPct(e.target.value)}
                        placeholder="1" step="0.1"
                        className={inp+" text-center"} style={{borderColor:color+"30"}}/>
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 text-xs pointer-events-none">%</span>
                    </div>
                    {bal>0&&<p className="text-[10px] text-slate-600 mt-1.5 tabular-nums text-center">
                      = <span className="font-bold" style={{color}}>{fmtD(effRiskD)}</span> max risk
                    </p>}
                  </>
                ):(
                  <>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 text-sm pointer-events-none">$</span>
                      <input type="number" value={riskDollar} onChange={e=>setRiskD(e.target.value)}
                        placeholder={bal>0?r2(bal*0.01).toFixed(2):"100"}
                        className={inp+" pl-8"} style={{borderColor:color+"30"}}/>
                    </div>
                    {bal>0&&effRiskD>0&&<p className="text-[10px] text-slate-600 mt-1.5 tabular-nums text-center">
                      = <span className="font-bold" style={{color}}>{r2(effRiskD/bal*100).toFixed(2)}%</span> of account
                    </p>}
                  </>
                )}
              </div>
            </div>

            {/* Trade block */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-4 flex items-center gap-2">
                <div className="w-0.5 h-3 rounded-full" style={{background:color}}/>
                Trade
              </div>

              {/* Symbol + Direction */}
              <div className="mb-3">
                <label className="text-[10px] uppercase tracking-widest text-slate-600 mb-1.5 block">
                  {asset==="FOREX"?"Pair":"Symbol"}
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input list="sym-opts" value={symbol} onChange={e=>handleSym(e.target.value)}
                      placeholder={cfg.defaultSymbol}
                      className={inp+" uppercase font-bold tracking-wider"} style={{borderColor:color+"40"}}/>
                    <datalist id="sym-opts">{cfg.symbols.map(s=><option key={s} value={s}/>)}</datalist>
                  </div>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-black/40 border border-white/[0.06] rounded-xl shrink-0">
                    {(["Long","Short"] as const).map(d=>(
                      <button key={d} onClick={()=>setDir(d)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-black transition-all"
                        style={direction===d?{color:d==="Long"?"#00e5a0":"#f87171",background:d==="Long"?"#00e5a018":"#f8717118"}:{color:"#334155"}}>
                        {d==="Long"?"▲":"▼"}
                      </button>
                    ))}
                  </div>
                </div>
                {asset==="FUTURES"&&futSpec&&(
                  <div className="text-[10px] mt-1.5 flex items-center gap-2" style={{color:color+"80"}}>
                    <span>{futSpec.name}</span><span>·</span>
                    <span>${futSpec.tv}/tick</span>
                  </div>
                )}
              </div>

              {/* SL — quick presets for beginners, manual input for pros */}
              <div className="mb-3">
                <label className="text-[10px] uppercase tracking-widest text-slate-600 mb-1.5 block">
                  Stop Loss <span className="normal-case font-normal text-slate-700">· {cfg.slUnit}</span>
                </label>

                {/* One-tap pip presets (Forex only) */}
                {asset==="FOREX"&&(
                  <div className="grid grid-cols-6 gap-1 mb-2">
                    {[10,15,20,30,50,100].map(p=>(
                      <button
                        key={p}
                        onClick={()=>{setSlPips(p.toString());setQuickSL(p);setTpPips((p*2).toString());}}
                        className="py-2.5 rounded-xl text-[11px] font-black transition-all"
                        style={quickSL===p
                          ?{background:color+"20",color,border:`1.5px solid ${color}`}
                          :{background:"rgba(255,255,255,0.04)",color:"#475569",border:"1.5px solid transparent"}}
                      >{p}</button>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <input type="number" value={slPips} onChange={e=>{const v=e.target.value;setSlPips(v);setQuickSL(null);const n=parseFloat(v);if(n>0)setTpPips(r2(n*2).toString());}}
                    placeholder={cfg.slPH} step={cfg.slStep}
                    className={inp} style={{borderColor:sl>0?"#f8717150":undefined,paddingRight:"3.5rem"}}/>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 pointer-events-none">
                    {cfg.slUnit}
                  </span>
                </div>
                {sl>0&&<p className="text-[10px] mt-1 text-red-900 tabular-nums">
                  {asset==="FOREX"?`$${r2(sl*effectivePV).toFixed(2)}/lot at current pip val`
                   :asset==="FUTURES"?`$${r2(sl*tv).toFixed(2)}/contract`
                   :""}
                </p>}
              </div>

              {/* Advanced toggle — broker + pip value hidden by default */}
              <button onClick={()=>setShowB(!showBrokers)}
                className="w-full text-[10px] text-slate-600 hover:text-slate-400 transition-colors tracking-widest py-1.5 text-center flex items-center justify-center gap-1.5 mt-1">
                <span style={{color:showBrokers?color:undefined}}>{showBrokers?"▲":"▼"}</span>
                {showBrokers?"Hide advanced":"Broker & pip value"}
              </button>

              {showBrokers&&(
                <div className="mt-3 border-t border-white/[0.05] pt-3 space-y-3">

                  {/* Broker dropdown */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-slate-600 mb-1.5 block">Broker</label>
                    <div className="flex gap-1.5">
                      <select value={brokerName} onChange={e=>setBroker(e.target.value)}
                        title="Select broker" className={sel+" flex-1 text-xs"}>
                        {bList.map(b=><option key={b.name} value={b.name}>{b.name}</option>)}
                      </select>
                      <div className="shrink-0 bg-black/40 border border-white/[0.06] rounded-xl px-2.5 py-2 text-xs font-black text-center min-w-[58px]"
                        style={{color}}>
                        1:{leverage.toLocaleString()}
                      </div>
                    </div>
                    {broker&&(
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                          style={{background:STATUS[broker.status].color+"18",color:STATUS[broker.status].color}}>
                          {STATUS[broker.status].label}
                        </span>
                        <span className="text-[10px] text-slate-700 truncate">{broker.note}</span>
                      </div>
                    )}

                    {/* Browse all brokers */}
                    <div className="mt-2 border-t border-white/[0.05] pt-2">
                      <div className="grid grid-cols-1 gap-1 max-h-64 overflow-y-auto pr-0.5">
                        {bList.map(b=>{
                          const isCustom=(customBrokers[asset]||[]).some(c=>c.name===b.name);
                          return(
                          <div key={b.name} className="relative group">
                            <button onClick={()=>{setBroker(b.name);setShowB(false);}}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all hover:bg-white/[0.03]"
                              style={brokerName===b.name?{borderColor:color+"50",background:color+"08"}:{borderColor:"rgba(255,255,255,0.04)"}}>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-white truncate">{b.name}</span>
                                  <span className="text-[9px] px-1 py-0.5 rounded font-bold shrink-0"
                                    style={{background:STATUS[b.status].color+"15",color:STATUS[b.status].color}}>
                                    {STATUS[b.status].label}
                                  </span>
                                  {isCustom&&<span className="text-[9px] px-1 py-0.5 rounded font-bold shrink-0 bg-white/10 text-slate-500">custom</span>}
                                </div>
                                <div className="text-[10px] text-slate-700 truncate">{b.note}</div>
                              </div>
                              <div className="text-right ml-2 shrink-0">
                                <div className="text-xs font-bold" style={{color}}>1:{b.leverage.toLocaleString()}</div>
                                <div className="text-[10px] text-slate-700">
                                  {b.feeType==="flat"||b.feeType==="spreadOnly"?"$0"
                                    :b.feeType==="percent"?`${b.fee}%`
                                    :b.feeType==="perLot"?`$${b.fee}/lot`
                                    :b.feeType==="perShare"?`$${b.fee}/sh`
                                    :`$${b.fee}/ct`}
                                </div>
                              </div>
                            </button>
                            {isCustom&&(
                              <button onClick={()=>removeBroker(b.name)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-[11px] text-red-500 hover:text-red-300 transition-all px-1"
                                title="Remove custom broker">✕</button>
                            )}
                          </div>);
                        })}
                      </div>

                      {/* Add custom broker */}
                      <div className="mt-3 border-t border-white/[0.05] pt-3">
                        <button onClick={()=>setShowAdd(!showAddBrk)}
                          className="w-full text-[10px] tracking-widest py-1.5 text-center flex items-center justify-center gap-1.5 transition-colors"
                          style={{color:showAddBrk?color:"#475569"}}>
                          <span>{showAddBrk?"▲":"＋"}</span>
                          {showAddBrk?"Cancel":"Add custom broker"}
                        </button>
                        {showAddBrk&&(
                          <div className="mt-2 space-y-2">
                            <input value={newBrkName} onChange={e=>setNBName(e.target.value)}
                              placeholder="Broker name" maxLength={40}
                              className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-700 outline-none focus:border-white/20"/>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="text-[9px] text-slate-600 mb-1 uppercase tracking-widest">Leverage</div>
                                <input type="number" value={newBrkLev} onChange={e=>setNBLev(e.target.value)}
                                  placeholder="100" min="1"
                                  className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-700 outline-none focus:border-white/20"/>
                              </div>
                              <div>
                                <div className="text-[9px] text-slate-600 mb-1 uppercase tracking-widest">Commission</div>
                                <input type="number" value={newBrkFee} onChange={e=>setNBFee(e.target.value)}
                                  placeholder="0" min="0" step="0.01"
                                  className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-700 outline-none focus:border-white/20"/>
                              </div>
                            </div>
                            <select value={newBrkType} onChange={e=>setNBType(e.target.value as FeeType)}
                              className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-white/20">
                              <option value="perLot">$ per lot (Forex)</option>
                              <option value="perContract">$ per contract (Futures/Options)</option>
                              <option value="perShare">$ per share (Stocks)</option>
                              <option value="percent">% per trade (Crypto)</option>
                              <option value="flat">$0 / Free</option>
                              <option value="spreadOnly">Spread only</option>
                            </select>
                            <button onClick={addBroker}
                              className="w-full py-2 rounded-xl text-xs font-black transition-all"
                              style={{background:color+"18",color,border:`1px solid ${color}40`}}>
                              ＋ Add to {ASSETS[asset].label} list
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pip value override (Forex/Crypto only) */}
                  {(asset==="FOREX"||asset==="CRYPTO")&&(
                    <div className="pt-3 border-t border-white/[0.05]">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-600 uppercase tracking-widest shrink-0">Pip Value $</span>
                        <input type="number" value={customPV} onChange={e=>setCustPV(e.target.value)}
                          placeholder={String(defaultPipVal(sym))}
                          className="flex-1 bg-black/40 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs font-mono outline-none text-white placeholder-slate-700 focus:border-white/20"
                          style={customPV?{borderColor:color+"60",color}:{}}/>
                        {customPV&&<button onClick={()=>setCustPV("")} className="text-[10px] text-slate-600 hover:text-white transition-colors shrink-0">✕</button>}
                      </div>
                      <p className="text-[10px] text-slate-700 mt-1">${effectivePV}/pip · auto for {sym}</p>
                    </div>
                  )}

                  {/* Futures tick value */}
                  {asset==="FUTURES"&&(
                    <div className="pt-3 border-t border-white/[0.05]">
                      <label className="text-[10px] uppercase tracking-widest text-slate-600 mb-1.5 block">
                        Tick Value <span className="normal-case font-normal text-slate-700">· auto-filled</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-slate-600 text-xs">$</span>
                        <input type="number" value={tickTV} onChange={e=>setTickTV(e.target.value)}
                          placeholder="12.50" className={inp+" pl-7"}
                          style={{borderColor:tickTV?color+"50":undefined}}/>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ───── RIGHT: OUTPUT ───── */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border overflow-hidden"
              style={{borderColor:color+"30",background:"rgba(5,10,17,0.98)",boxShadow:`0 0 40px ${color}0d,inset 0 1px 0 ${color}12`}}>

              {/* Output header */}
              <div className="px-5 py-3.5 flex items-center justify-between border-b"
                style={{borderColor:color+"18",background:color+"07"}}>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.15em]" style={{color}}>Position Size</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    {cfg.label} · {sym} · {direction} · 1:{leverage.toLocaleString()} lev
                    {broker?.fee?` · $${broker.fee} ${broker.feeType==="percent"?"%":broker.feeType==="perLot"?"lot":broker.feeType==="perShare"?"sh":"ct"} commission`:""}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:color}}/>
                  <span className="text-[9px] text-slate-700 font-bold tracking-widest">LIVE</span>
                </div>
              </div>

              {/* Risk warning — only shown when pctRisk > 2% */}
              {showRiskWarning&&(
                <div className="flex items-center gap-2 px-5 py-2.5 border-b text-[11px] font-bold"
                  style={{borderColor:"#f8717130",background:"#f8717108",color:"#f87171"}}>
                  ⚠️ Most traders stay under 2% risk per trade
                </div>
              )}

              <div className="px-5 py-5">

                {res?(
                  <>
                    {/* ── THE BIG NUMBER ── */}
                    <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}`}</style>
                    <div className="flex items-end gap-4 mb-5">
                      <div className="flex-1">
                        <div className="text-[10px] uppercase tracking-widest text-slate-600 mb-1">
                          {cfg.unitLabel} to take
                        </div>
                        {/* Safe (floor) size — the one to actually use */}
                        <div key={`sz-${safeSize}`}
                          className="text-6xl font-black tabular-nums leading-none"
                          style={{color,animation:"popIn 0.25s cubic-bezier(0.22,1,0.36,1) both"}}>
                          {safeSize}
                        </div>
                        {showExact&&(
                          <div className="text-[11px] mt-1 text-slate-600 tabular-nums">
                            exact: <span className="font-bold">{exactSize}</span>
                            <span className="text-slate-700 ml-1">· floored down</span>
                          </div>
                        )}
                        {atMinLot&&(
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-amber-500/15 text-amber-400">⚠ MIN LOT</span>
                            <span className="text-[10px] text-amber-900">broker floor · verify before entry</span>
                          </div>
                        )}
                        <div className="text-[11px] mt-1.5 tabular-nums font-bold" style={{color:pctColor}}>
                          {res.pctRisk.toFixed(2)}% of balance at risk
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 pb-1">
                        {/* Copy lot size */}
                        <button onClick={copySize}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all hover:bg-white/[0.04] active:scale-95"
                          style={{borderColor:color+"40",color}}>
                          ⎘ Copy size
                        </button>
                        {/* Copy full line */}
                        <button onClick={copyLine}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all hover:bg-white/[0.04] active:scale-95"
                          style={{borderColor:"rgba(255,255,255,0.08)",color:"#475569"}}>
                          ⎘ Copy line
                        </button>
                      </div>
                    </div>
                    {/* Risk bar */}
                    <div className="h-1 rounded-full bg-white/5 mb-1 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{width:`${Math.min(100,res.pctRisk*25)}%`,background:pctColor}}/>
                    </div>
                    <div className="text-[9px] text-slate-700 text-right mb-5">4% max recommended</div>

                    {/* ── RISK / PIP VALUE ── */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="rounded-xl p-4 border border-red-500/[0.12] bg-red-500/[0.04]">
                        <div className="text-[9px] text-red-900 uppercase tracking-widest mb-2">$ At Risk</div>
                        <div className="text-2xl font-black text-red-400 tabular-nums leading-none font-mono">
                          {fmtD(res.riskDollar)}
                        </div>
                        {res.fee>0&&<div className="text-[10px] text-red-900/70 mt-1.5">
                          incl. {fmtD(res.fee)} commission RT
                        </div>}
                      </div>
                      <div className="rounded-xl p-4 border border-white/[0.05] bg-white/[0.02]">
                        <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-2"
                          title="Auto-calculated for major pairs. Override in Pip Value field below for crosses or metals.">
                          Pip / Tick Value ⓘ
                        </div>
                        <div className="text-2xl font-black tabular-nums leading-none font-mono" style={{color}}>
                          {fmtD(res.pipValue)}
                        </div>
                        <div className="text-[10px] text-slate-700 mt-1.5">
                          per {asset==="FUTURES"?"tick":"pip"} · {safeSize} {cfg.unitLabel.toLowerCase()}
                        </div>
                      </div>
                    </div>

                    {/* ── TP INPUT + QUICK RR ── */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase tracking-widest text-slate-600">
                          Take Profit <span className="normal-case font-normal text-slate-700">· {cfg.slUnit}</span>
                        </span>
                        {sl>0&&tp>0&&(
                          <span className="text-[10px] font-bold tabular-nums" style={{color:res.rrActual>=2?"#00e5a0":res.rrActual>=1?"#fbbf24":"#f87171"}}>
                            {res.rrActual>=2?"✓":"⚠"} Actual 1:{res.rrActual.toFixed(2)} R:R
                          </span>
                        )}
                      </div>

                      {/* Quick R:R */}
                      <div className="grid grid-cols-5 gap-1 p-1 bg-black/40 border border-white/[0.06] rounded-xl mb-2">
                        {(["1","1.5","2","3","5"] as const).map(r=>{
                          const ratio=parseFloat(r);
                          const active=sl>0&&tp>0&&Math.abs(tp/sl-ratio)<0.05;
                          return(
                            <button key={r} onClick={()=>{if(sl>0)setTpPips(r2(sl*ratio).toString());}}
                              className="py-2 rounded-lg text-[10px] font-bold transition-all"
                              style={active?{color,background:color+"18"}:{color:"#334155"}}>
                              1:{r}
                            </button>
                          );
                        })}
                      </div>

                      <div className="relative">
                        <input type="number" value={tpPips} onChange={e=>setTpPips(e.target.value)}
                          placeholder={sl>0?String(sl*2):cfg.slPH} step={cfg.slStep}
                          className={inp} style={{borderColor:tp>0?"#00e5a030":undefined,paddingRight:"3.5rem"}}/>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 pointer-events-none">
                          {cfg.slUnit}
                        </span>
                      </div>
                    </div>

                    {/* ── R:R PROFIT TARGETS ── */}
                    <div className="rounded-xl border border-white/[0.05] overflow-hidden mb-4">
                      <div className="px-4 py-2 border-b border-white/[0.04]">
                        <span className="text-[10px] uppercase tracking-widest text-slate-600">Profit Targets</span>
                      </div>
                      {[
                        {label:`TP (${tp>0?tp:sl} ${cfg.slUnit})`,win:tp>0?res.tpWin:null,tag:tp>0?`1:${res.rrActual.toFixed(1)}`:null,primary:true},
                        {label:"1R",win:res.win1R,tag:"break-even min",primary:false},
                        {label:"2R",win:res.win2R,tag:"target",primary:false},
                        {label:"3R",win:res.win3R,tag:"home run",primary:false},
                      ].map(({label,win,tag,primary},i,arr)=>(
                        <div key={label}
                          className={`flex items-center justify-between px-4 py-2.5 ${i<arr.length-1?"border-b border-white/[0.04]":""}`}>
                          <div>
                            <span className="text-[11px] text-slate-500">{label}</span>
                            {tag&&<span className="text-[10px] text-slate-700 ml-2">{tag}</span>}
                          </div>
                          <span className={`text-sm font-black font-mono tabular-nums ${primary?"":"text-emerald-400"}`}
                            style={primary&&win&&win>0?{color}:primary?{color:"#334155"}:{}}>
                            {win&&win>0?`+${fmtD(win)}`:"—"}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* ── R:R bar (if TP set) ── */}
                    {res.rrActual>0&&(
                      <div className="mb-4">
                        <div className="flex justify-between text-[10px] mb-1.5">
                          <span className="text-red-900/60">Risk {fmtD(res.riskDollar)}</span>
                          <span className="text-emerald-900/60">Reward {res.tpWin>0?fmtD(res.tpWin):"—"}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 flex overflow-hidden gap-px">
                          <div className="h-full rounded-l-full bg-red-500/40 transition-all duration-500"
                            style={{width:`${Math.min(50,100/(1+res.rrActual))}%`}}/>
                          <div className="h-full rounded-r-full bg-emerald-400/40 transition-all duration-500"
                            style={{width:`${Math.min(85,100*res.rrActual/(1+res.rrActual))}%`}}/>
                        </div>
                      </div>
                    )}

                    {/* ── Detail row ── */}
                    <div className="rounded-xl border border-white/[0.05] overflow-hidden">
                      {([
                        {label:"SL Distance",  value:sl>0?`${sl} ${cfg.slUnit}`:"—",   sub:sl>0&&asset==="FOREX"?`$${r2(sl*effectivePV).toFixed(2)}/lot`:undefined, tip:undefined},
                        {label:"Commission RT",value:res.fee>0?`−${fmtD(res.fee)}`:"$0.00", sub:res.fee>0?"round-trip · both sides":undefined, tip:"Round-trip commission: entry + exit, both sides (ECN standard)"},
                        marginEst?{label:"Margin Est.",value:fmtD(marginEst),sub:`${safeSize} lot × 100k ÷ 1:${leverage} · USD account`,tip:"Approximate margin at current leverage. Verify with your broker."}:null,
                        {label:"Broker",       value:broker?.name??"—",               sub:`1:${leverage} leverage · ${STATUS[broker?.status??"regulated"].label}`, tip:undefined},
                      ] as ({label:string;value:string;sub:string|undefined;tip:string|undefined}|null)[]).filter(Boolean).map((row,i,arr)=>{
                        const{label,value,sub,tip}=row!;
                        return(
                          <div key={label}
                            className={`flex items-start justify-between px-4 py-2.5 ${i<arr.length-1?"border-b border-white/[0.04]":""}`}>
                            <span className="text-[11px] text-slate-600 mt-0.5" title={tip}>
                              {label}{tip?" ⓘ":""}
                            </span>
                            <div className="text-right ml-3">
                              <div className="text-sm font-bold font-mono tabular-nums text-slate-400">{value}</div>
                              {sub&&<div className="text-[10px] text-slate-700 mt-0.5">{sub}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ):(
                  /* Empty state */
                  <div className="py-16 text-center">
                    <div className="text-5xl mb-4" style={{filter:`drop-shadow(0 0 16px ${color})`}}>⚡</div>
                    <div className="text-slate-600 text-sm font-bold uppercase tracking-widest mb-2">
                      Enter your numbers
                    </div>
                    <div className="text-slate-700 text-[11px] max-w-[220px] mx-auto leading-relaxed">
                      Set a balance, risk amount, and stop loss distance to see your position size.
                    </div>
                    <div className="mt-6 inline-flex flex-col gap-1.5 text-left">
                      {[
                        {n:"1",t:"Enter account balance"},
                        {n:"2",t:"Set risk % or $ amount"},
                        {n:"3",t:"Set stop loss distance"},
                      ].map(({n,t})=>(
                        <div key={n} className="flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                            style={{background:color+"18",color}}>
                            {n}
                          </div>
                          <span className="text-[11px] text-slate-600">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-800 uppercase tracking-[0.2em] mt-8">
          For planning only · Not financial advice · Verify all figures with your broker
        </p>
      </div>
    </div>
  );
}
