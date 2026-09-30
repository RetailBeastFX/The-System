// AQTApp.tsx — patched for Vercel (lucide icon prop type fix) and inline Firebase.
// - Uses permissive IconType (size?: string | number) for lucide icons
// - No 'title' prop passed to lucide icons (avoids type error on Vercel)
// - Firebase initialized from NEXT_PUBLIC_* env vars (works locally & on Vercel)
// - Safe "Local Mode" if env vars are missing

'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
} from "react";
import {
  TrendingUp,
  DollarSign,
  Target,
  Shield,
  Download,
  Upload,
  Brain,
  Trash2,
  Calculator,
  PieChart as PieIcon,
  ChevronDown,
  ChevronUp,
  WifiOff,
  Sun,
  Edit3,
  X,
  Settings as SettingsIcon,
  AlertTriangle,
  Printer,
  BarChart2,
  Clock,
  ClipboardCopy,
  Trophy,
  QrCode,
  HelpCircle,
  Wallet,
  Cloud,
  CloudOff,
  Twitter,
  Lock,
  Flame,
  Zap,
  Eye,
  EyeOff,
  CheckCircle,
  Check,
  MoreVertical,
  Image as ImageIcon,
  User as UserIcon,
  Calendar,
} from "lucide-react";
import { MascotPeek } from "./Mascot/MascotPeek";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Component imports for integration
import HelpGuide from "./HelpGuide";
import WeeklyGoals from "./WeeklyGoals";
import StreakTracker from "./StreakTracker";
import { useStreakCalculator } from "../hooks/useStreakCalculator";
import AnalyticsDashboard from "./Analytics/AnalyticsDashboard";
import { quickExportPDF } from "../utils/pdfExport";
import ServiceWorkerRegistrar from "./ServiceWorkerRegistrar";
import CommunityLeaderboard from "./CommunityLeaderboard";
import ShareWithLLM from "./AIInsights";

// Phase 1-5: New Component Imports
import SettingsManager from "./Settings/SettingsManager";
import BackupManager from "./BackupManager";
import TagManager from "./Tags/TagManager";
import TradeSearch, { SearchFilters } from "./TradeSearch/TradeSearch";
import VoiceNoteRecorder from "./VoiceNoteRecorder";
import NotificationManager, { Notification as AppNotification, createNotification } from "./Notifications/NotificationManager";
import SmartInsights from "./Analytics/SmartInsights";
import ExpectancyChart from "./Analytics/ExpectancyChart";
import SessionHeatmap from "./Analytics/SessionHeatmap";
import RMultipleECDF from "./Analytics/RMultipleECDF";
import StrategyLibrary from "./Strategies/StrategyLibrary";
import GoalTracker from "./Goals/GoalTracker";
import ShortcutManager, { createDefaultShortcuts } from "./ShortcutManager";
import FocusMode from "./FocusMode";
import InstallPrompt from "./InstallPrompt";
import EmptyState, { DemoDataBanner, DemoModeIndicator } from "./EmptyState";
import ImportWizard from "./Import/ImportWizard";
import WelcomeModal from "./Onboarding/WelcomeModal";
import OnboardingChecklist from "./Onboarding/OnboardingChecklist";
import FlipModeSettings from "./FlipMode/FlipModeSettings";
import AccountManager from "./Account/AccountManager";
import VirtualizedTradeTable from "./VirtualizedTradeTable";

// Demo Data
import { DEMO_TRADES, DEMO_STATS } from "../data/demoTrades";

// Utilities
import { InsightsEngine } from "../utils/insightsEngine";
import { registerServiceWorker, setupInstallPrompt } from "../utils/pwa";

// Types
import { Tag } from "../types/tags";
import { Strategy } from "../types/strategies";
import { TradingAccount, BalanceOperation } from "../types";
import { MT5AccountInfo } from "../utils/importPipeline";

/* ---------------- Firebase (inlined) ---------------- */
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  signOut,
  type User,
  type Auth,
  GoogleAuthProvider,
  TwitterAuthProvider,
  signInWithPopup,
  signInWithRedirect, // Keep import but don't use - has session storage issues
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, type FirebaseStorage } from "firebase/storage";
const APP_ID = "aqt-journal";

// Pull config from env; if missing, we will run in Local Mode safely.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAMovKnvBtj_4MI5K7jMtgpgZkhTe6S77Q",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "retailbeastfx.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "retailbeastfx",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "retailbeastfx.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1065146187462",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1065146187462:web:6a2bab89c37d1e605161c7",
};

// Initialize only if config looks valid (has apiKey & projectId)
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let firebaseReady = false;

try {
  const hasConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId);
  if (hasConfig) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    firebaseReady = true;
  } else {
    console.warn(
      "[AQT] Firebase config not found. Running in Local Mode. Set NEXT_PUBLIC_FIREBASE_* in .env.local to enable cloud sync."
    );
  }
} catch (e) {
  console.warn("[AQT] Firebase init failed; running in Local Mode:", e);
  firebaseReady = false;
}

/* ---------------- Types ---------------- */
type Direction = "Long" | "Short";
type Tier = { name: string; min: number; max: number; pairs: number; suggestedPairs: string; desc: string };
type TaxBracket = { rate: number; label: string; minIncome: number };
type PricingModel = { label: string; commission: boolean; note?: string };
type BrokerInfo = {
  minLot: number;
  leverage: string[];
  default: string;
  regulation?: string;
  /** Estimated breakeven buffer in pips for spread+commission ECN/Raw style accounts */
  beBufferPips?: number;
  /** Optional list of account-type pricing models for display */
  models?: PricingModel[];
};
type BrokerMap = Record<string, BrokerInfo>;

// SMC-Quant Hybrid Strategy Presets (2026)
// Based on 6-pillar institutional framework:
// Pillar I: ADX Gate | Pillar II: SMA Alignment | Pillar III: SMC Precision
const TRADE_SETUPS = [
  // === SMC-Quant Institutional ===
  "Liquidity Sweep + OTE",    // Sweep → ChoCh → OB/FVG → 62-79% fib
  "ADX Gate Breakout",        // ADX > 25 + SMA aligned trend entry
  "FVG Retracement",          // Fair Value Gap with EMA confluence
  "Order Block Demand",       // Bullish OB with trend confirmation
  "Order Block Supply",       // Bearish OB with trend confirmation
  "Silver Bullet",            // 10-11 AM / 2-3 PM EST ICT model
  "MSS Reversal",             // Market Structure Shift at extremes
  "ATR Pyramid Add",          // ADX > 30 scale-in on 1:1 hit

  // === Classic Setups ===
  "Breakout",
  "Pullback",
  "Reversal",
  "Trend Continuation",
  "Range Fade",

  // === Custom ===
  "Other"
] as const;

// Trade templates for quick trade entry
const TRADE_TEMPLATES: { name: string; pair: string; setup: string }[] = [
  { name: "EUR/USD Breakout", pair: "EURUSD", setup: "Breakout" },
  { name: "GBP/USD Trend", pair: "GBPUSD", setup: "Trend" },
  { name: "USD/JPY Scalp", pair: "USDJPY", setup: "Scalp" },
  { name: "Gold Reversal", pair: "XAUUSD", setup: "Reversal" },
];

type TradeInput = {
  pair: string;
  direction: Direction;
  entry: string;
  exit: string;
  lots: string; // User override for lots
  setup: string; // Can be preset or custom
  emotion: string;
  notes: string;
};
type Trade = {
  id: string;
  pair: string;
  direction: Direction;
  entry: number;
  exit: number;
  date: string;
  time: string;
  ts: number;
  lots: number;
  pnl: number;
  setup: string;
  emotion: string;
  notes: string;
  imageUrl?: string;
};
type GlobalSettings = {
  pipValue: number;
  stopLoss: number;
  profitTarget: number;
  dailyGrowth: number;
  maxDailyLoss?: number;
  maxTradesPerDay?: number;
  startBalance?: number;
  targetBalance?: number;
  showWeeklyGoals?: boolean;
  showStreakDetails?: boolean;
  tradingStyle?: 'scalper' | 'day' | 'swing';
};

type PairMeta = { placeholder: string; step: number; multiplier: number; isYen?: boolean; isGold?: boolean; isCrypto?: boolean; isIndex?: boolean };
type RiskMetrics = {
  winRate: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  maxDrawdownPct: number;
  currentStreak: number;
  bestStreak: number;
  worstStreak: number;
  expectancy: number;
};

const TIERS: Tier[] = [
  { name: "SURVIVAL", min: 10, max: 19, pairs: 2, suggestedPairs: "EURUSD, GBPUSD", desc: "Capital preservation mode" },
  { name: "BUILDING", min: 20, max: 49, pairs: 3, suggestedPairs: "EURUSD, GBPUSD, USDJPY", desc: "Steady growth phase" },
  { name: "SCALING", min: 50, max: 99, pairs: 4, suggestedPairs: "Majors + 1 Cross", desc: "Accelerated scaling" },
  { name: "GROWTH", min: 100, max: 249, pairs: 5, suggestedPairs: "Majors + 2 Crosses", desc: "Sustained growth" },
  { name: "EXPANSION", min: 250, max: 499, pairs: 6, suggestedPairs: "Majors + Crosses + Gold", desc: "Portfolio expansion" },
  { name: "ADVANCED", min: 500, max: 999, pairs: 7, suggestedPairs: "Full Forex + Gold", desc: "Advanced strategies" },
  { name: "MASTERY", min: 1000, max: 2499, pairs: 8, suggestedPairs: "Forex, Gold, Indices", desc: "Full system mastery" },
  { name: "ELITE", min: 2500, max: 4999, pairs: 10, suggestedPairs: "Any Liquid Asset", desc: "Elite trader status" },
  { name: "LEGEND", min: 5000, max: 999999, pairs: 12, suggestedPairs: "Full Market Access", desc: "Legendary performance" },
];

const TAX_BRACKETS_2025: TaxBracket[] = [
  { rate: 0.1, label: "10% (< $11,925)", minIncome: 0 },
  { rate: 0.12, label: "12% ($11,925 - $48,475)", minIncome: 11925 },
  { rate: 0.22, label: "22% ($48,475 - $103,350)", minIncome: 48475 },
  { rate: 0.24, label: "24% ($103,350 - $197,300)", minIncome: 103350 },
  { rate: 0.32, label: "32% ($197,300 - $250,525)", minIncome: 197300 },
  { rate: 0.35, label: "35% ($250,525 - $626,350)", minIncome: 250525 },
  { rate: 0.37, label: "37% (> $626,350)", minIncome: 626350 },
];

const BROKERS: BrokerMap = {
  "PlexyTrade": { minLot: 0.01, leverage: ["1:100", "1:200", "1:400", "1:500", "1:1000", "1:2000"], default: "1:2000", regulation: "Offshore (Max 1:2000)" },
  "Hugo's Way": { minLot: 0.01, leverage: ["1:100", "1:200", "1:300", "1:500"], default: "1:500", regulation: "Offshore (Max 1:500)" },
  "Coinexx": { minLot: 0.01, leverage: ["1:100", "1:200", "1:300", "1:400", "1:500"], default: "1:500", regulation: "Offshore (Max 1:500)" },
  "HankoTrade": { minLot: 0.01, leverage: ["1:100", "1:200", "1:400", "1:500"], default: "1:500", regulation: "Offshore (Max 1:500)" },
  "Fyntura": { minLot: 0.01, leverage: ["1:100", "1:200", "1:400", "1:500"], default: "1:500", regulation: "Offshore (Max 1:500)" },
  "DuraMarkets": { minLot: 0.01, leverage: ["1:100", "1:200", "1:400", "1:500"], default: "1:500", regulation: "Offshore (Max 1:500)" },
  "OctaFX": { minLot: 0.01, leverage: ["1:100", "1:200", "1:500"], default: "1:500", regulation: "Offshore (Max 1:500)" },
  "HFM": { minLot: 0.01, leverage: ["1:100", "1:200", "1:400", "1:500"], default: "1:500", regulation: "Offshore (Max 1:500)" },
  "OANDA": { minLot: 0.001, leverage: ["1:20", "1:30", "1:50"], default: "1:50", regulation: "US Regulated (Max 1:50)" },
  "Forex.com": { minLot: 0.01, leverage: ["1:20", "1:30", "1:50"], default: "1:50", regulation: "US Regulated (Max 1:50)" },
  "tastyfx": { minLot: 0.01, leverage: ["1:20", "1:30", "1:50"], default: "1:50", regulation: "US Regulated (Max 1:50)" },
  "TD Ameritrade": { minLot: 0.01, leverage: ["1:20", "1:30", "1:50"], default: "1:50", regulation: "US Regulated (Max 1:50)" },
  "IG US": { minLot: 0.5, leverage: ["1:20", "1:30", "1:50"], default: "1:50", regulation: "US Regulated (Max 1:50)" },
  "Interactive Brokers": { minLot: 1, leverage: ["1:20", "1:30", "1:40", "1:50"], default: "1:50", regulation: "US Regulated (Max 1:50)" },
  "Ally Invest": { minLot: 0.01, leverage: ["1:20", "1:30", "1:50"], default: "1:50", regulation: "US Regulated (Max 1:50)" },
  "ATC Brokers": { minLot: 0.01, leverage: ["1:20", "1:30", "1:50"], default: "1:50", regulation: "US Regulated (Max 1:50)" },
};

/** Heuristic/placeholder BE buffers in pips (spread+commission) */
const BROKER_BE_BUFFER: Record<string, number> = {
  "Coinexx": 0.5,
  "HankoTrade": 0.5,
  "Hugo's Way": 0.5,
  "PlexyTrade": 0.5,
  "Fyntura": 0.5,
  "DuraMarkets": 0.5,
  // Regulated US desks typically spread-only or lower fixed costs; default to 0
  // Override per your experience.
};

/** Display-only list of common commission vs spread-only models */
const BROKER_MODELS: { name: string; models: PricingModel[] }[] = [
  {
    name: "OANDA", models: [
      { label: "Core", commission: true, note: "Spread + commission" },
      { label: "Standard", commission: false, note: "Spread-only" },
    ]
  },
  {
    name: "FOREX.com", models: [
      { label: "RAW", commission: true, note: "Spread + commission" },
      { label: "Standard", commission: false, note: "Spread-only" },
    ]
  },
  {
    name: "Pepperstone", models: [
      { label: "Razor", commission: true, note: "Spread + commission" },
      { label: "Standard", commission: false, note: "Spread-only" },
    ]
  },
  {
    name: "IC Markets", models: [
      { label: "Raw/ECN", commission: true, note: "Spread + commission" },
      { label: "Standard", commission: false, note: "Spread-only" },
    ]
  },
  {
    name: "XM", models: [
      { label: "Zero", commission: true, note: "Spread + commission" },
      { label: "Standard/Micro", commission: false, note: "Spread-only" },
    ]
  },
  {
    name: "Exness", models: [
      { label: "Raw/Zero", commission: true, note: "Spread + commission" },
      { label: "Standard", commission: false, note: "Spread-only" },
    ]
  },
  {
    name: "BlackBull Markets", models: [
      { label: "ECN", commission: true, note: "Spread + commission" },
      { label: "Standard", commission: false, note: "Spread-only" },
    ]
  },
  {
    name: "Eightcap", models: [
      { label: "Raw", commission: true, note: "Spread + commission" },
      { label: "Standard", commission: false, note: "Spread-only" },
    ]
  },
  {
    name: "HankoTrade", models: [
      { label: "ECN", commission: true, note: "Spread + commission" },
    ]
  },
  {
    name: "Coinexx", models: [
      { label: "ECN", commission: true, note: "Spread + commission" },
    ]
  },
  {
    name: "IG US", models: [
      { label: "Standard", commission: false, note: "Spread-only (CFDs/FX)" },
    ]
  },
  {
    name: "AvaTrade", models: [
      { label: "Standard", commission: false, note: "Spread-only" },
    ]
  },
  {
    name: "eToro", models: [
      { label: "Standard", commission: false, note: "Spread-only" },
    ]
  },
];

const COMMON_PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "USDCAD", "BTCUSD", "ETHUSD", "US30", "NAS100", "SPX500"];
const isBrowser = typeof window !== "undefined";

/* ---------------- Utils ---------------- */
const fmtUSD = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

const safeSettings = (s: any): Partial<GlobalSettings> =>
  typeof s === 'object' && s ? ['pipValue', 'stopLoss', 'profitTarget', 'dailyGrowth']
    .reduce((a, k) => (typeof s[k] === 'number' ? { ...a, [k]: s[k] } : a), {} as any) : {};

const getPairMetadata = (rawPair: string): PairMeta => {
  const pair = (rawPair || "").toUpperCase();
  if (pair.includes("JPY")) return { placeholder: "145.50", step: 0.01, multiplier: 100, isYen: true };
  if (pair.includes("XAU")) return { placeholder: "2350.10", step: 0.01, multiplier: 100, isGold: true };
  if (pair.includes("BTC") || pair.includes("ETH")) return { placeholder: "62000", step: 1, multiplier: 1, isCrypto: true };
  if (pair.includes("US30") || pair.includes("NAS") || pair.includes("SPX")) return { placeholder: "35000", step: 1, multiplier: 1, isIndex: true };
  return { placeholder: "1.0850", step: 0.0001, multiplier: 10000 };
};

const getContractSize = (meta: PairMeta) => {
  if (meta.isGold) return 100;
  if (meta.isIndex) return 1;
  if (meta.isCrypto) return 1;
  return 100000;
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const safeParseNumber = (v: string | number): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

// Stable local day key (YYYY-MM-DD)
const localDayKey = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const getHourFromTimeString = (time: string): number | null => {
  const m12 = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m12) {
    let h = parseInt(m12[1], 10) % 12;
    if (m12[3].toUpperCase() === "PM") h += 12;
    return h;
  }
  const m24 = time.match(/^(\d{1,2}):\d{2}/);
  if (m24) return Math.min(23, Math.max(0, parseInt(m24[1], 10)));
  return null;
};

/* ---------------- Calculations ---------------- */
const normalizeTrade = (trade: TradeInput, lotSize: number): Omit<Trade, "pnl"> => {
  const ts = Date.now();
  return {
    id: generateId(),
    entry: safeParseNumber(trade.entry),
    exit: safeParseNumber(trade.exit),
    date: localDayKey(new Date(ts)),
    time: formatTime(ts),
    ts,
    lots: lotSize,
    pair: trade.pair.toUpperCase(),
    direction: trade.direction,
    setup: trade.setup,
    emotion: trade.emotion,
    notes: trade.notes,
  };
};

const calculateTradingMetrics = (
  balance: number,
  broker: string,
  safeMode: boolean,
  brokerList: BrokerMap,
  settings: GlobalSettings,
  leverage: string
) => {
  const safeBal = Number.isFinite(balance) ? balance : 0;
  const currentTier = TIERS.find((t) => safeBal >= t.min && safeBal <= t.max) ?? TIERS[0];
  const brokerData = brokerList[broker] ?? brokerList["PlexyTrade"] ?? Object.values(brokerList)[0];
  const baseLot = Math.max(brokerData.minLot, parseFloat((Math.floor(currentTier.min / 10) * 0.01).toFixed(2)));
  const lotSize = safeMode ? Math.max(brokerData.minLot, parseFloat((baseLot * 0.5).toFixed(2))) : baseLot;
  const dailyGoal = round2(safeBal * (settings.dailyGrowth / 100));
  const pipValueForLot = lotSize * settings.pipValue;

  const maxLoss = round2(pipValueForLot * settings.stopLoss);
  const targetWin = round2(pipValueForLot * settings.profitTarget);
  const riskRewardRatio = settings.stopLoss > 0 ? (settings.profitTarget / settings.stopLoss).toFixed(1) : "0";

  const levNum = Math.max(1, parseInt(leverage.replace("1:", "").replace("Unlimited", "2000"), 10) || 500);
  const pairMeta = getPairMetadata("EURUSD"); // Default for generic calculations
  const proxyPrice = safeParseNumber(pairMeta.placeholder);
  const contractSize = getContractSize(pairMeta);

  const marginRequired = safeBal > 0 && lotSize > 0 ? round2((lotSize * contractSize * proxyPrice) / levNum) : 0;

  const nextTierIndex = TIERS.indexOf(currentTier) + 1;
  const nextTier = TIERS[nextTierIndex];
  let progress = 100;
  if (nextTier) {
    const range = nextTier.min - currentTier.min || 1;
    const current = safeBal - currentTier.min;
    progress = Math.min(100, Math.max(0, (current / range) * 100));
  }
  return { currentTier, lotSize, dailyGoal, maxLoss, targetWin, riskRewardRatio, nextTier, progress, pipValueForLot };
};

const calculatePnL = (
  trade: { entry: string | number; exit: string | number; pair: string; direction: Direction },
  pipValueForLot: number,
  beBufferPips = 0
) => {
  const entryNum = safeParseNumber(trade.entry);
  const exitNum = safeParseNumber(trade.exit);
  if (!entryNum || !exitNum || entryNum === exitNum) return 0;

  const meta = getPairMetadata(trade.pair);
  const dirMult = trade.direction === "Long" ? 1 : -1;

  const grossDollars = (exitNum - entryNum) * dirMult * meta.multiplier * pipValueForLot;
  const costDollars = beBufferPips * pipValueForLot; // spread+commission expressed in pips
  return round2(grossDollars - costDollars);
};

const validateTradeInputs = (trade: TradeInput, minLot: number) => {
  const errors: string[] = [];
  const pair = trade.pair.trim().toUpperCase();
  if (!/^[A-Z0-9]{3,8}$/.test(pair)) errors.push("Invalid pair format (3-8 alphanumeric)");
  const entry = safeParseNumber(trade.entry);
  const exit = safeParseNumber(trade.exit);
  if (entry <= 0) errors.push("Entry must be positive");
  if (exit <= 0) errors.push("Exit must be positive");
  const meta = getPairMetadata(pair);
  if (Math.abs(exit - entry) < meta.step) errors.push(`Entry and exit too close (min step ${meta.step} for ${pair})`);

  const lotsNum = safeParseNumber(trade.lots);
  if (trade.lots) {
    if (lotsNum <= 0) errors.push("Lots must be greater than 0");
    if (lotsNum > 0 && lotsNum < minLot) errors.push(`Lots must be ≥ broker min lot (${minLot})`);
  }

  return errors;
};

const calculateMaxDrawdown = (series: { balance: number }[]): number => {
  let peak = series[0]?.balance ?? 0;
  let maxDD = 0;
  for (const p of series) {
    peak = Math.max(peak, p.balance);
    const dd = peak > 0 ? (peak - p.balance) / peak : 0;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD * 100;
};

const calculateRiskMetrics = (trades: Trade[], balanceHistory: { balance: number }[]): RiskMetrics => {
  const total = trades.length;
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);
  const sumWins = wins.reduce((s, t) => s + t.pnl, 0);
  const sumLosses = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));

  const winRate = total ? (wins.length / total) * 100 : 0;
  const averageWin = wins.length ? sumWins / wins.length : 0;
  const averageLoss = losses.length ? -sumLosses / losses.length : 0;
  const profitFactor = sumLosses ? sumWins / sumLosses : (sumWins ? Infinity : 0);
  const maxDrawdownPct = calculateMaxDrawdown(balanceHistory);

  const largestWin = wins.length > 0 ? Math.max(...wins.map((t) => t.pnl)) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses.map((t) => t.pnl)) : 0;

  const cronTrades = [...trades].reverse();
  let currentStreak = 0, bestStreak = 0, worstStreak = 0;
  cronTrades.forEach((t) => {
    if (t.pnl > 0) {
      if (currentStreak < 0) currentStreak = 0;
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else if (t.pnl < 0) {
      if (currentStreak > 0) currentStreak = 0;
      currentStreak--;
      worstStreak = Math.min(worstStreak, currentStreak);
    }
  });

  const expectancy = (winRate / 100) * averageWin - ((100 - winRate) / 100) * Math.abs(averageLoss);
  return { winRate, averageWin, averageLoss, largestWin, largestLoss, profitFactor, maxDrawdownPct, currentStreak, bestStreak, worstStreak, expectancy };
};

const activeTaxRate = (is1256: boolean, bracketRate: number) =>
  is1256 ? 0.60 * 0.15 + 0.40 * bracketRate : bracketRate;

/* ---------------- UI Components ---------------- */
const WithdrawalAlert = React.memo<{ balance: number }>(({ balance }) => {
  const milestones = [100000, 250000, 500000, 1000000];
  const milestone = [...milestones].reverse().find(m => balance >= m);
  if (!milestone) return null;

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border border-amber-200 dark:border-amber-700 rounded-xl flex items-center justify-between animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-200 dark:bg-amber-800 rounded-full text-amber-800 dark:text-amber-100">
          <Wallet size={24} />
        </div>
        <div>
          <h3 className="font-bold text-amber-900 dark:text-amber-100">Wealth Milestone Reached!</h3>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Your balance has crossed <strong>{fmtUSD(milestone)}</strong>.
            It's a great time to withdraw some profits and pay yourself.
          </p>
        </div>
      </div>
      <button
        onClick={() => alert("Processing withdrawal request... (Simulation)")}
        className="hidden sm:block px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-sm transition-colors"
      >
        Request Payout
      </button>
    </div>
  );
});

const PerformanceSummary = React.memo<{ metrics: RiskMetrics }>(({ metrics }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div className="glass-card stat-card p-5 rounded-xl" style={{ animationDelay: '0ms' }}>
      <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Win Rate</div>
      <div className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.winRate.toFixed(1)}%</div>
    </div>
    <div className="glass-card stat-card p-5 rounded-xl" style={{ animationDelay: '50ms' }}>
      <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Profit Factor</div>
      <div className="text-3xl font-bold text-slate-900 dark:text-white">{Number.isFinite(metrics.profitFactor) ? metrics.profitFactor.toFixed(2) : "∞"}</div>
    </div>
    <div className="glass-card stat-card p-5 rounded-xl" style={{ animationDelay: '100ms' }}>
      <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Best Trade</div>
      <div className="text-3xl font-bold text-green-500">{fmtUSD(metrics.largestWin)}</div>
    </div>
    <div className="glass-card stat-card p-5 rounded-xl" style={{ animationDelay: '150ms' }}>
      <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Worst Trade</div>
      <div className="text-3xl font-bold text-red-500">{fmtUSD(metrics.largestLoss)}</div>
    </div>
  </div>
));

const EnhancedTradeHeatmap = React.memo<{ trades: Trade[] }>(({ trades }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const hourData = hours.map((hour) => {
    const hourTrades = trades.filter((t) => {
      if (t.ts) return new Date(t.ts).getHours() === hour;
      const h = getHourFromTimeString(t.time);
      return h === hour;
    });
    const profits = hourTrades.map((t) => t.pnl);
    const winRate = profits.length ? (profits.filter((p) => p > 0).length / profits.length) * 100 : 0;
    return {
      hour,
      count: hourTrades.length,
      profit: profits.reduce((sum, p) => sum + p, 0),
      winRate,
      label: `${hour}:00`,
      session: hour < 9 ? "Tokyo" : hour < 17 ? "London" : "New York",
    };
  });

  const maxCount = Math.max(...hourData.map((h) => h.count), 1);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-white/10">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <Clock size={16} /> Trading Hours Analysis
        </h4>
        <div className="text-xs text-slate-500 flex gap-2">
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded">Tokyo</span>
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded">London</span>
          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded">New York</span>
        </div>
      </div>

      <div className="grid grid-cols-6 md:grid-cols-12 gap-1">
        {hourData.map((h) => {
          const sizeIntensity = Math.min(1, h.count / maxCount);
          const isProfitable = h.profit > 0;
          return (
            <div key={h.hour} role="listitem" className="relative group" title={`${h.label} (${h.session}) - ${h.count} trades, P&L: ${fmtUSD(h.profit)}, WR: ${h.winRate.toFixed(1)}%`}>
              <div
                className={`p-2 rounded text-center transition-all duration-200 ${h.session === "Tokyo" ? "bg-blue-50 dark:bg-blue-900/20" : h.session === "London" ? "bg-green-50 dark:bg-green-900/20" : "bg-purple-50 dark:bg-purple-900/20"
                  } ${h.count > 0 ? "border-2" : "border"} ${isProfitable ? "border-green-300 dark:border-green-700" : h.profit < 0 ? "border-red-300 dark:border-red-700" : "border-slate-200 dark:border-white/10"
                  }`}
              >
                <div className="text-[10px] text-slate-500">{h.hour}</div>
                <div className={`font-bold text-slate-800 dark:text-white ${h.count > 0 ? "text-lg" : "text-sm"}`}>{h.count > 0 ? h.count : "-"}</div>
              </div>
              {h.count > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b overflow-hidden">
                  <div className={`h-full ${isProfitable ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${sizeIntensity * 100}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 text-center">Color = session • Size = trade count • Border = profitability</div>
    </div>
  );
});

const SetupPerformanceAnalysis = React.memo<{ trades: Trade[] }>(({ trades }) => {
  // Calculate enhanced stats per setup including expectancy
  const setupGroups = trades.reduce((acc, trade) => {
    const s = trade.setup || "Unspecified";
    if (!acc[s]) acc[s] = { count: 0, wins: 0, losses: 0, pnl: 0, totalWinPnl: 0, totalLossPnl: 0 };
    acc[s].count++;
    acc[s].pnl += trade.pnl;
    if (trade.pnl > 0) {
      acc[s].wins++;
      acc[s].totalWinPnl += trade.pnl;
    } else {
      acc[s].losses++;
      acc[s].totalLossPnl += Math.abs(trade.pnl);
    }
    return acc;
  }, {} as Record<string, { count: number; wins: number; losses: number; pnl: number; totalWinPnl: number; totalLossPnl: number }>);

  const data = Object.entries(setupGroups)
    .map(([name, stats]) => {
      const winRate = stats.count > 0 ? (stats.wins / stats.count) * 100 : 0;
      const avgWin = stats.wins > 0 ? stats.totalWinPnl / stats.wins : 0;
      const avgLoss = stats.losses > 0 ? stats.totalLossPnl / stats.losses : 0;
      // Expectancy = (Win% × Avg Win) - (Loss% × Avg Loss)
      const expectancy = ((winRate / 100) * avgWin) - ((1 - winRate / 100) * avgLoss);
      // Capital Saved: if negative P&L, this is how much higher balance would be without these trades
      const capitalSaved = stats.pnl < 0 ? Math.abs(stats.pnl) : 0;
      return {
        name,
        winRate,
        avgPnl: stats.pnl / stats.count,
        expectancy,
        capitalSaved,
        ...stats
      };
    })
    .sort((a, b) => b.expectancy - a.expectancy); // Sort by expectancy instead of total P&L

  // Identify Golden Setup (highest expectancy) and Leaky Bucket (lowest expectancy)
  const goldenSetup = data.length > 0 && data[0].expectancy > 0 ? data[0].name : null;
  const leakyBucket = data.length > 0 && data[data.length - 1].expectancy < 0 ? data[data.length - 1].name : null;

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-white/10">
      <h4 className="font-bold mb-3 flex items-center gap-2 text-slate-800 dark:text-white">
        <BarChart2 size={16} /> Setup Performance
      </h4>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {data.length === 0 ? <div className="text-sm text-slate-500 text-center py-4">No data</div> : data.map(item => {
          const isGolden = item.name === goldenSetup;
          const isLeaky = item.name === leakyBucket;
          return (
            <div
              key={item.name}
              className={`flex items-center justify-between p-2 rounded border transition-all ${isGolden
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/50'
                : isLeaky
                  ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700 ring-2 ring-rose-500/50'
                  : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5'
                }`}
            >
              <div>
                <div className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                  {isGolden && <span title="Golden Setup - Highest Expectancy">⭐</span>}
                  {isLeaky && <span title="Leaky Bucket - Consider Removing">🩸</span>}
                  {item.name}
                </div>
                <div className="text-[10px] text-slate-500">{item.count} trades • {item.winRate.toFixed(0)}% WR</div>
                {isGolden && <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Focus Here!</div>}
                {isLeaky && item.capitalSaved > 0 && (
                  <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-0.5" title={`Your account would be $${item.capitalSaved.toFixed(2)} higher if you skipped these trades`}>
                    Capital Saved: ${item.capitalSaved.toFixed(0)}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${item.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>${item.pnl.toFixed(0)}</div>
                <div className={`text-[10px] font-mono ${item.expectancy >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  E[${item.expectancy.toFixed(2)}]
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const PairPerformanceSummary: React.FC<{ trades: Trade[] }> = ({ trades }) => {
  const pairStats = trades.reduce((acc, trade) => {
    if (!acc[trade.pair]) acc[trade.pair] = { count: 0, pnl: 0 };
    acc[trade.pair].count++;
    acc[trade.pair].pnl += trade.pnl;
    return acc;
  }, {} as Record<string, { count: number; pnl: number }>);

  const topPairs = Object.entries(pairStats)
    .map(([pair, stats]) => ({ pair, ...stats }))
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 5);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-white/10">
      <h4 className="font-bold mb-3 flex items-center gap-2 text-slate-800 dark:text-white">
        <TrendingUp size={16} /> Top Pairs
      </h4>
      <div className="space-y-2">
        {topPairs.length === 0 ? <div className="text-sm text-slate-500 text-center py-4">No data</div> : topPairs.map(p => (
          <div key={p.pair} className="flex justify-between items-center text-sm">
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{p.pair}</span>
            <span className={`font-bold ${p.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmtUSD(p.pnl)} <span className="text-[10px] font-normal text-slate-400">({p.count})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const RiskOfRuinCalculator: React.FC<{ winRate: number; riskPerTradePct: number }> = ({ winRate, riskPerTradePct }) => {
  const p = winRate / 100;
  const q = 1 - p;
  const units = 100 / (riskPerTradePct || 1);

  let ror = 0;
  if (p <= 0.5) {
    ror = 100;
  } else {
    ror = Math.pow(q / p, units) * 100;
  }

  const displayRoR = ror > 100 ? 100 : ror < 0.01 ? "< 0.01" : ror.toFixed(2);
  const isSafe = ror < 1;

  return (
    <div className={`mt-4 p-3 rounded border ${isSafe ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">Risk of Ruin</span>
        <span className={`text-sm font-bold ${isSafe ? 'text-green-600' : 'text-red-600'}`}>{displayRoR}%</span>
      </div>
      <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
        Probability of hitting 0 balance given {winRate.toFixed(0)}% WR & {riskPerTradePct.toFixed(1)}% risk.
      </div>
    </div>
  );
};

const DailyGoalTracker: React.FC<{ current: number; target: number }> = ({ current, target }) => {
  const pct = Math.min(100, Math.max(0, target ? (current / target) * 100 : 0));
  const isMet = current >= target && target > 0;
  return (
    <div className="flex-1 bg-white dark:bg-white/10 rounded-xl p-4 border border-slate-200 dark:border-white/10 relative overflow-hidden flex flex-col justify-center">
      <div className="flex justify-between items-end mb-2 relative z-10">
        <span className="text-xs text-slate-500 dark:text-slate-300 font-bold uppercase">Daily Goal</span>
        <span className={`text-lg font-bold ${isMet ? "text-green-500" : "text-slate-700 dark:text-white"}`} aria-live="polite">
          {Math.round(current)} <span className="text-xs text-slate-400">/ {Math.round(target)}</span>
        </span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-black/30 h-2 rounded-full overflow-hidden relative z-10">
        <div className={`h-full transition-all duration-1000 ${isMet ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const PerformanceBenchmarks: React.FC<{ winRate: number; profitFactor: number; tradesCount: number }> = ({ winRate, profitFactor, tradesCount }) => {
  const benchmarks = [
    { label: "Novice", winRate: 0, profitFactor: 0, trades: 0, color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800" },
    { label: "Beginner", winRate: 40, profitFactor: 1.2, trades: 20, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/20" },
    { label: "Intermediate", winRate: 50, profitFactor: 1.5, trades: 50, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/20" },
    { label: "Advanced", winRate: 60, profitFactor: 2.0, trades: 100, color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/20" },
    { label: "Professional", winRate: 70, profitFactor: 3.0, trades: 200, color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/20" },
    { label: "Elite", winRate: 80, profitFactor: 4.0, trades: 500, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/20" },
  ];
  let currentLevel = benchmarks[0];
  for (const level of benchmarks) {
    if (winRate >= level.winRate && profitFactor >= level.profitFactor && tradesCount >= level.trades) currentLevel = level;
  }
  return (
    <div className={`rounded-xl p-4 border ${currentLevel.bg} border-slate-200 dark:border-white/10 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Performance Rank</div>
          <div className={`text-xl font-bold ${currentLevel.color}`}>{currentLevel.label}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 dark:text-slate-300">WR: {winRate.toFixed(1)}%</div>
          <div className="text-xs text-slate-500 dark:text-slate-300">PF: {profitFactor.toFixed(2)}</div>
        </div>
      </div>
      <div className="w-full bg-slate-200 dark:bg-black/40 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-1000 ${currentLevel.color.replace("text-", "bg-")}`}
          style={{ width: `${Math.min(100, (winRate / 80) * 100)}%` }}
        />
      </div>
      <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 text-center">
        {currentLevel.label !== "Elite" && `Next: ${benchmarks[benchmarks.indexOf(currentLevel) + 1]?.label || "Max"}`}
      </div>
    </div>
  );
};

const PerformanceMilestones: React.FC<{ trades: Trade[]; balance: number }> = ({ trades, balance }) => {
  const milestones = [
    { target: 10, label: "First 10 Trades", reward: "Consistency Badge" },
    { target: 1000, label: "$1k Profit", reward: "Grand Master" },
    { target: 50, label: "50 Trades", reward: "Experience Unlocked" },
    { target: 5000, label: "$5k Account", reward: "Pro Trader" },
  ];
  const totalPnL = trades.reduce((a, t) => a + t.pnl, 0);
  const accountValue = balance;
  const achieved = milestones.filter((m) => (m.target < 100 && trades.length >= m.target) || (m.target >= 100 && (m.target % 100 === 0 ? totalPnL >= m.target : accountValue >= m.target)));
  const nextMilestone = milestones.find((m) => !achieved.includes(m));
  if (achieved.length === 0) return null;
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="text-yellow-500" size={20} />
        <h4 className="font-bold text-blue-800 dark:text-blue-300">Achievements</h4>
      </div>
      <div className="flex flex-wrap gap-2">
        {achieved.map((m) => (
          <span key={m.label} className="px-3 py-1 bg-white dark:bg-slate-800 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-700 dark:text-white">
            {m.label} ✓
          </span>
        ))}
      </div>
      {nextMilestone && <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">Next: {nextMilestone.label} • {nextMilestone.reward}</div>}
    </div>
  );
};

// Helper component for Clear All
const ClearAllTradesButton: React.FC<{ onClear: () => void }> = ({ onClear }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const handleClear = () => {
    if (showConfirm) {
      onClear();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 3000);
    }
  };
  return (
    <button
      type="button"
      onClick={handleClear}
      className={`h-8 px-3 rounded text-xs font-medium transition-all ${showConfirm
        ? 'bg-red-600 text-white'
        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30'
        }`}
    >
      {showConfirm ? 'Confirm Clear?' : 'Clear All'}
    </button>
  );
};

/* ---------------- Helpers: export/backup ---------------- */
const exportToCSV = (trades: Trade[]) => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const headers = ["Date", "Time", "Pair", "Direction", "Lots", "PnL", "Setup", "Emotion", "Notes"];
  const rows = trades.map((t) => [t.date, t.time, t.pair, t.direction, t.lots, t.pnl.toFixed(2), t.setup, t.emotion, (t.notes || "").replace(/\n/g, " ")]);
  const csv = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aqt_journal_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const backupJSON = (state: any) => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aqt_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

/* ---------------- Collapsible / Modals / Drawers ---------------- */

// very permissive icon type that works with lucide on Vercel
type IconType = React.ComponentType<{ size?: string | number; className?: string }>;

const CollapsibleSection: React.FC<{
  title: string;
  icon?: IconType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="glass-card rounded-2xl overflow-hidden mb-6 transition-all duration-300 hover:shadow-xl">
      <button
        onClick={() => setIsOpen((s) => !s)}
        className="w-full flex justify-between items-center p-5 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-200 focus:outline-none"
        aria-label={`Toggle ${title}`}
      >
        <div className="flex items-center gap-3 font-bold text-lg text-slate-800 dark:text-white">
          {Icon && <Icon size={22} className="text-blue-500 dark:text-blue-400" />}
          {title}
        </div>
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          <ChevronDown size={20} className="text-slate-400" />
        </div>
      </button>
      <div
        className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}
        style={{ overflow: 'hidden' }}
      >
        <div className="p-6 border-t border-slate-200/50 dark:border-slate-700/50">{children}</div>
      </div>
    </div>
  );
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { console.error("Component error:", error); }
  render() {
    if (this.state.hasError) return <div className="p-4 text-red-500">Error in component.</div>;
    return this.props.children;
  }
}

const TradingViewTicker: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const c = containerRef.current;
    if (!c) return;
    c.innerHTML = "";
    try {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
      script.async = true;
      script.onerror = () => setError(true);
      script.innerHTML = JSON.stringify({
        symbols: [
          { proName: "FOREXCOM:SPX500", title: "S&P 500" },
          { proName: "FX_IDC:EURUSD", title: "EUR/USD" },
          { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
          { proName: "OANDA:XAUUSD", title: "Gold" },
        ],
        showSymbolLogo: true,
        colorTheme: darkMode ? "dark" : "light",
        isTransparent: true,
        displayMode: "adaptive",
        locale: "en",
      });
      c.appendChild(script);
    } catch {
      setError(true);
    }
    return () => { if (c) c.innerHTML = ""; };
  }, [darkMode]);
  if (error)
    return (
      <div className="w-full h-12 mb-6 flex items-center justify-center bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs border-b border-red-200 dark:border-red-500/20">
        <WifiOff size={14} className="mr-2" /> Live Feed Offline
      </div>
    );
  return <div className="tradingview-widget-container w-full h-12 mb-6 pointer-events-none"><div ref={containerRef} /></div>;
};

const TradeNotesModal: React.FC<{
  trade: Trade | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (tradeId: string, data: { notes: string; imageUrl?: string }) => Promise<void>;
  onUpload: (file: File) => Promise<string>;
}> = ({ trade, isOpen, onClose, onSave, onUpload }) => {
  const [notes, setNotes] = useState(trade?.notes ?? "");
  const [imageUrl, setImageUrl] = useState(trade?.imageUrl ?? "");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setNotes(trade?.notes ?? "");
    setImageUrl(trade?.imageUrl ?? "");
  }, [trade]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        const url = await onUpload(e.target.files[0]);
        setImageUrl(url);
      } catch (error) {
        alert("Upload failed. Try again.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  if (!isOpen || !trade) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full border border-slate-200 dark:border-white/10 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold dark:text-white">Trade Details: {trade.pair}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-white"><X size={18} /></button>
        </div>

        {/* Image Section */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Screenshot</label>
          {imageUrl ? (
            <div className="relative group">
              <img src={imageUrl} alt="Trade Screenshot" className="w-full h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
              <button
                onClick={() => setImageUrl("")}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove Image"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              {isUploading ? (
                <div className="text-blue-500 font-bold animate-pulse">Uploading...</div>
              ) : (
                <div className="text-slate-500 dark:text-slate-400">
                  <Upload className="mx-auto mb-2 opacity-50" size={24} />
                  <span className="text-sm">Click to upload screenshot</span>
                </div>
              )}
            </div>
          )}
        </div>

        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full h-32 p-3 border dark:border-white/10 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white mb-4 text-sm"
          placeholder="Add analysis, lessons, emotions..."
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors dark:text-white text-sm font-bold">Cancel</button>
          <button onClick={() => onSave(trade.id, { notes, imageUrl })} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors text-sm font-bold">Save Details</button>
        </div>
      </div>
    </div>
  );
};

const SettingsDrawer: React.FC<{ isOpen: boolean; onClose: () => void; settings: GlobalSettings; onSave: (s: GlobalSettings) => void; balance?: number; onSetBalance?: (b: number) => void }> = ({ isOpen, onClose, settings, onSave, balance = 0, onSetBalance }) => {
  const [local, setLocal] = useState(settings);
  const [balanceInput, setBalanceInput] = useState(balance.toString());
  useEffect(() => { setLocal(settings); setBalanceInput(balance.toString()); }, [settings, balance, isOpen]);
  if (!isOpen) return null;

  const handleSave = () => {
    const newBalance = parseFloat(balanceInput.replace(/[,$]/g, ''));
    if (!isNaN(newBalance) && newBalance > 0 && onSetBalance) {
      onSetBalance(newBalance);
    }
    onSave(local);
    onClose();
  };

  const settingLabels = {
    pipValue: { label: 'Pip Value ($)', icon: DollarSign, description: 'Value per pip per lot' },
    stopLoss: { label: 'Stop Loss (pips)', icon: Shield, description: 'Max loss per trade' },
    profitTarget: { label: 'Profit Target (pips)', icon: Target, description: 'Expected take profit' },
    dailyGrowth: { label: 'Daily Growth (%)', icon: TrendingUp, description: 'Target daily % gain' },
  } as const;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <SettingsIcon className="text-white" size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Settings</h3>
                <p className="text-white/70 text-xs">Trading configuration</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="text-white" size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Balance Section - First! */}
          {onSetBalance && (
            <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="text-green-600" size={18} />
                <span className="font-bold text-green-700 dark:text-green-400 text-sm">Account Balance</span>
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" size={18} />
                <input
                  type="text"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  placeholder="10000"
                  className="w-full pl-10 pr-4 py-3 text-xl font-bold rounded-lg border-2 border-green-500/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {[1000, 5000, 10000, 25000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setBalanceInput(amount.toString())}
                    className={`px-2 py-1 text-xs font-medium rounded-lg transition-all ${balanceInput === amount.toString()
                      ? 'bg-green-500 text-white'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200'
                      }`}
                  >
                    ${amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trading Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Target size={16} className="text-purple-500" /> Trading Parameters
            </h4>
            {(["pipValue", "stopLoss", "profitTarget", "dailyGrowth"] as const).map((k) => {
              const config = settingLabels[k];
              const Icon = config.icon;
              return (
                <div key={k} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium dark:text-white">{config.label}</label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{config.description}</p>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={local[k]}
                    onChange={(e) => setLocal({ ...local, [k]: parseFloat(e.target.value) || 0 })}
                    className="w-20 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white text-right font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              );
            })}
          </div>

          {/* Display Options */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Eye size={16} className="text-pink-500" /> Display Options
            </h4>
            <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={local.showWeeklyGoals}
                onChange={(e) => setLocal({ ...local, showWeeklyGoals: e.target.checked })}
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium dark:text-white">Show Weekly/Monthly Goals</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Display extended goal tracking</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={local.showStreakDetails}
                onChange={(e) => setLocal({ ...local, showStreakDetails: e.target.checked })}
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium dark:text-white">Show Detailed Streak Info</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Best streak, current streak details</p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={handleSave}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
          >
            <Check size={18} /> Save Changes
          </button>
        </div>
      </div>
    </>
  );
};


/* ---------------- Floating helpers ---------------- */
const HelpTooltip: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <>
      <button onClick={() => setShowHelp(!showHelp)} className="fixed bottom-4 left-4 p-3 bg-slate-800 text-white rounded-full shadow-lg z-40 hover:bg-slate-700 transition-all print:hidden" aria-label="Help">
        <HelpCircle size={20} />
      </button>
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold dark:text-white">Quick Start Guide</h3>
              <button onClick={() => setShowHelp(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <p><strong>1. Set Balance</strong> - Enter your current account balance</p>
              <p><strong>2. Configure</strong> - Select broker, risk mode, and tax settings</p>
              <p><strong>3. Enter Trades</strong> - Log each trade with entry/exit prices</p>
              <p><strong>4. Analyze</strong> - Review performance metrics and analytics</p>
              <p><strong>5. Export</strong> - Backup data regularly and print reports</p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
              <p className="text-xs text-slate-500">Tip: Use Ctrl+Enter to quickly log trades</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const QRCodeGenerator: React.FC = () => {
  const [showQR, setShowQR] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  return (
    <>
      <button onClick={() => setShowQR(!showQR)} className="fixed bottom-4 left-20 p-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full shadow-lg z-40 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all print:hidden" aria-label="QR Code">
        <QrCode size={20} />
      </button>
      {showQR && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold dark:text-white">Mobile Access</h3>
              <button onClick={() => setShowQR(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-white"><X size={20} /></button>
            </div>
            <div className="bg-white p-4 rounded-lg flex justify-center">
              <div className="w-48 h-48 bg-slate-100 flex items-center justify-center border-2 border-slate-200 rounded">
                <div className="text-center">
                  <QrCode size={64} className="mx-auto mb-2 text-slate-400" />
                  <span className="text-xs text-slate-500">Scan URL</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4 break-all bg-slate-100 dark:bg-black/20 p-2 rounded">{currentUrl}</p>
          </div>
        </div>
      )}
    </>
  );
};

// ============= FLIP MODE COMPONENT =============
type TradingRule = {
  id: string;
  text: string;
  checked: boolean;
};

const FlipMode: React.FC<{
  balance: number;
  trades: Trade[];
  settings: GlobalSettings;
  onAddTrade: (trade: Omit<Trade, 'id' | 'ts' | 'time' | 'date' | 'lots' | 'setup' | 'emotion' | 'notes'>) => void;
  onSwitchMode: () => void;
  onOpenSettings: () => void;
}> = ({ balance, trades, settings, onAddTrade, onSwitchMode, onOpenSettings }) => {
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showLossModal, setShowLossModal] = useState(false);
  const [showRulesCheck, setShowRulesCheck] = useState(true);
  const [newTrade, setNewTrade] = useState({
    pair: '',
    direction: 'Long' as Direction,
    entry: '',
    exit: ''
  });

  const [rules, setRules] = useState<TradingRule[]>([
    { id: '1', text: 'I am well-rested (7+ hours sleep)', checked: false },
    { id: '2', text: 'I have reviewed my plan for today', checked: false },
    { id: '3', text: 'I am emotionally neutral (no revenge trading)', checked: false },
    { id: '4', text: 'I will follow my stop loss', checked: false },
    { id: '5', text: `Max ${settings.maxTradesPerDay || 3} trades today`, checked: false }
  ]);


  const todayKey = useMemo(() => localDayKey(new Date()), []);
  const todayTrades = useMemo(() => trades.filter(t => t.date === todayKey), [trades, todayKey]);
  const todayPnl = useMemo(() => todayTrades.reduce((sum, t) => sum + t.pnl, 0), [todayTrades]);
  const totalPnL = useMemo(() => trades.reduce((sum, t) => sum + t.pnl, 0), [trades]);

  const dailyGoalAmount = balance * ((settings.dailyGrowth || 5) / 100);
  const maxDailyLossAmount = balance * ((settings.maxDailyLoss || 5) / 100);
  const startBalance = settings.startBalance || 100;
  const targetBalance = settings.targetBalance || 1000;
  const progressPercent = ((balance - startBalance) / (targetBalance - startBalance)) * 100;
  const todayGoalPercent = Math.min(100, Math.max(0, (todayPnl / dailyGoalAmount) * 100));

  const wins = todayTrades.filter(t => t.pnl > 0).length;
  const losses = todayTrades.filter(t => t.pnl < 0).length;
  const allRulesChecked = rules.every(r => r.checked);
  const maxTradesPerDay = settings.maxTradesPerDay || 3;

  useEffect(() => {
    if (todayPnl >= dailyGoalAmount && dailyGoalAmount > 0 && !showGoalModal) {
      setShowGoalModal(true);
    }
    if (todayPnl <= -maxDailyLossAmount && todayPnl < 0 && !showLossModal) {
      setShowLossModal(true);
    }
  }, [todayPnl, dailyGoalAmount, maxDailyLossAmount, showGoalModal, showLossModal]);

  // Smart Price Auto-fill
  useEffect(() => {
    const p = newTrade.pair.toUpperCase();
    if (COMMON_PAIRS.includes(p)) {
      const lastTrade = trades.find(t => t.pair === p);
      if (lastTrade) {
        // Use last exit (if closed) or entry as a proxy for current price
        const price = lastTrade.exit || lastTrade.entry;
        if (price) {
          setNewTrade(prev => ({ ...prev, entry: String(price) }));
        }
      }
    }
  }, [newTrade.pair, trades]);

  /* ---------------- HANDLERS ---------------- */
  const handlePrint = () => {
    window.print();
  };

  const exportToCSV = (tradesToExport?: Trade[]) => {
    const dataToExport = tradesToExport || trades;
    if (dataToExport.length === 0) return;

    // Header row
    const headers = ['ID', 'Date', 'Time', 'Pair', 'Direction', 'Entry', 'Exit', 'PnL', 'Lots', 'Setup', 'Emotion', 'Notes', 'Screenshot'];

    // Data rows
    const rows = dataToExport.map(t => {
      const safeNotes = t.notes?.replace(/"/g, '""') || '';
      return [
        t.id,
        t.date,
        t.time,
        t.pair,
        t.direction,
        t.entry,
        t.exit,
        t.pnl,
        t.lots,
        t.setup,
        t.emotion,
        `"${safeNotes}"`,
        t.imageUrl || ''
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `aqt_trades_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddTrade = () => {
    const entry = parseFloat(newTrade.entry);
    const exit = parseFloat(newTrade.exit);

    if (!newTrade.pair || !entry || !exit) {
      alert('Please fill all fields');
      return;
    }

    if (todayTrades.length >= maxTradesPerDay) {
      alert(`Max ${maxTradesPerDay} trades per day!`);
      return;
    }

    const dirMult = newTrade.direction === 'Long' ? 1 : -1;
    const pnl = (exit - entry) * dirMult * 10000 * ((settings.pipValue || 10) / 10);

    onAddTrade({
      pair: newTrade.pair.toUpperCase(),
      direction: newTrade.direction,
      entry,
      exit,
      pnl: Math.round(pnl * 100) / 100
    });

    setNewTrade({ pair: '', direction: 'Long', entry: '', exit: '' });
  };

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, checked: !r.checked } : r));
  };

  const getTip = () => {
    if (todayTrades.length === 0) return "First trade of the day sets the tone. Make it count!";
    if (todayTrades.length === 1) return "One down. Stay disciplined on the next ones.";
    if (todayTrades.length === maxTradesPerDay - 1) return "Final trade of the day. Make it your best one.";
    if (todayTrades.length >= maxTradesPerDay) return "All trades done! Review and prepare for tomorrow.";
    return "Focus on quality over quantity. Follow your plan.";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-4">
      {/* Rules Check Modal */}
      {showRulesCheck && !allRulesChecked && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-blue-500/30">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-blue-400" size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Ready to Trade?</h2>
              <p className="text-slate-400 text-sm">Check all rules before you start</p>
            </div>

            <div className="space-y-3 mb-6">
              {rules.map(rule => (
                <label
                  key={rule.id}
                  className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={rule.checked}
                    onChange={() => toggleRule(rule.id)}
                    className="w-5 h-5 rounded border-slate-500"
                  />
                  <span className="text-sm">{rule.text}</span>
                </label>
              ))}
            </div>

            <button
              onClick={() => setShowRulesCheck(false)}
              disabled={!allRulesChecked}
              className={`w-full py-3 rounded-lg font-bold transition-colors ${allRulesChecked
                ? 'bg-green-600 hover:bg-green-500'
                : 'bg-slate-600 cursor-not-allowed'
                }`}
            >
              {allRulesChecked ? "Let's Trade! 🚀" : 'Check All Rules First'}
            </button>
          </div>
        </div>
      )}

      {/* Goal Hit Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-green-500/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl p-8 max-w-md w-full text-center">
            <Trophy className="mx-auto mb-4 text-yellow-500" size={80} />
            <h2 className="text-3xl font-bold mb-2">Goal Hit! 🎯</h2>
            <div className="text-5xl font-bold text-green-600 mb-4">
              {fmtUSD(todayPnl)}
            </div>
            <p className="text-slate-600 mb-6 text-lg">
              You hit your daily goal of {fmtUSD(dailyGoalAmount)}!
            </p>
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
              <p className="font-bold text-yellow-800 mb-2">⚠️ Stop Now</p>
              <p className="text-sm text-yellow-700">
                Overtrading after hitting your goal is the #1 way to give profits back.
                Close the app and celebrate your win!
              </p>
            </div>
            <button
              onClick={() => setShowGoalModal(false)}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-500"
            >
              I'm Done For Today ✓
            </button>
          </div>
        </div>
      )}

      {/* Max Loss Modal */}
      {showLossModal && (
        <div className="fixed inset-0 bg-red-500/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl p-8 max-w-md w-full text-center">
            <AlertTriangle className="mx-auto mb-4 text-red-500" size={80} />
            <h2 className="text-3xl font-bold mb-2">Daily Loss Limit Hit</h2>
            <div className="text-5xl font-bold text-red-600 mb-4">
              {fmtUSD(todayPnl)}
            </div>
            <p className="text-slate-600 mb-6 text-lg">
              You've hit your max daily loss of {fmtUSD(-maxDailyLossAmount)}
            </p>
            <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 mb-6">
              <p className="font-bold text-red-800 mb-2">🛑 STOP TRADING</p>
              <p className="text-sm text-red-700">
                Trading is now locked for today. Revenge trading will only make it worse.
                Review your trades, learn, and come back fresh tomorrow.
              </p>
            </div>
            <button
              onClick={() => setShowLossModal(false)}
              className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-500"
            >
              Close App
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="text-yellow-400" size={28} />
              AQT Flip Mode
            </h1>
            <p className="text-sm text-slate-400">Simple. Focused. Profitable.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onOpenSettings}
              className="w-10 h-10 bg-slate-800 rounded-lg hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              title="Settings"
            >
              <SettingsIcon size={20} />
            </button>
            <button
              onClick={onSwitchMode}
              className="px-4 py-2 bg-slate-800 rounded-lg text-sm hover:bg-slate-700 flex items-center gap-2"
            >
              <Eye size={16} />
              Pro Mode
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Big Balance Display */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

          <div className="relative z-10">
            <p className="text-blue-200 text-sm mb-2">Account Balance</p>
            <h2 className="text-6xl font-bold mb-4">{fmtUSD(balance)}</h2>

            {/* Flip Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-blue-200">${startBalance}</span>
                <span className="text-blue-100 font-bold">{progressPercent.toFixed(1)}% to goal</span>
                <span className="text-blue-200">${targetBalance}</span>
              </div>
              <div className="h-3 bg-blue-900/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                />
              </div>
            </div>

            {/* Today's Performance */}
            <div className="flex justify-around items-center pt-4 border-t border-blue-400/30">
              <div>
                <p className="text-blue-200 text-xs mb-1">Today's P&L</p>
                <p className={`text-2xl font-bold ${todayPnl >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {todayPnl >= 0 ? '+' : ''}{fmtUSD(todayPnl)}
                </p>
              </div>
              <div>
                <p className="text-blue-200 text-xs mb-1">Total Profit</p>
                <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {totalPnL >= 0 ? '+' : ''}{fmtUSD(totalPnL)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Goal Tracker */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Target className="text-green-400" size={20} />
              <span className="font-bold">Daily Goal</span>
            </div>
            <span className={`text-xl font-bold ${todayPnl >= dailyGoalAmount ? 'text-green-400' : 'text-white'}`}>
              {Math.round(todayGoalPercent)}%
            </span>
          </div>

          <div className="h-4 bg-slate-700 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-500 ${todayPnl >= dailyGoalAmount ? 'bg-green-500' : 'bg-blue-500'
                }`}
              style={{ width: `${Math.min(100, todayGoalPercent)}%` }}
            />
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-400">{fmtUSD(Math.max(0, todayPnl))} / {fmtUSD(dailyGoalAmount)}</span>
            <span className="text-slate-400">{fmtUSD(Math.max(0, dailyGoalAmount - todayPnl))} to go</span>
          </div>
        </div>

        {/* Trade Limits */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Flame className={todayTrades.length >= maxTradesPerDay ? 'text-red-400' : 'text-yellow-400'} size={20} />
              <span className="text-sm text-slate-400">Trades Today</span>
            </div>
            <p className="text-3xl font-bold">{todayTrades.length}/{maxTradesPerDay}</p>
            {todayTrades.length >= maxTradesPerDay && (
              <p className="text-xs text-red-400 mt-1">Limit reached!</p>
            )}
          </div>

          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="text-blue-400" size={20} />
              <span className="text-sm text-slate-400">Win Rate</span>
            </div>
            <p className="text-3xl font-bold">
              {todayTrades.length > 0 ? Math.round((wins / todayTrades.length) * 100) : 0}%
            </p>
            <p className="text-xs text-slate-400 mt-1">{wins}W / {losses}L</p>
          </div>
        </div>

        {/* Quick Trade Entry */}
        {!showGoalModal && !showLossModal && todayTrades.length < maxTradesPerDay && (
          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <DollarSign className="text-green-400" size={20} />
              Quick Trade Entry
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Pair</label>
                <input
                  type="text"
                  placeholder="EURUSD"
                  value={newTrade.pair}
                  onChange={(e) => setNewTrade({ ...newTrade, pair: e.target.value.toUpperCase() })}
                  list="flip-pairs"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
                <datalist id="flip-pairs">
                  {COMMON_PAIRS.map(p => <option key={p} value={p} />)}
                </datalist>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Direction</label>
                <select
                  value={newTrade.direction}
                  onChange={(e) => setNewTrade({ ...newTrade, direction: e.target.value as Direction })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="Long">Long</option>
                  <option value="Short">Short</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Entry Price</label>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="1.0850"
                  value={newTrade.entry}
                  onChange={(e) => setNewTrade({ ...newTrade, entry: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Exit Price</label>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="1.0900"
                  value={newTrade.exit}
                  onChange={(e) => setNewTrade({ ...newTrade, exit: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <button
              onClick={handleAddTrade}
              className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold transition-colors"
            >
              Log Trade
            </button>
          </div>
        )}

        {todayTrades.length >= maxTradesPerDay && !showGoalModal && (
          <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-xl p-4 text-center">
            <Lock className="mx-auto mb-2 text-yellow-400" size={32} />
            <p className="font-bold text-yellow-400 mb-1">Trade Limit Reached</p>
            <p className="text-sm text-yellow-200">Max {maxTradesPerDay} trades per day. Come back tomorrow.</p>
          </div>
        )}

        {/* Today's Trades */}
        {todayTrades.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="font-bold mb-4">Today's Trades</h3>
            <div className="space-y-2">
              {todayTrades.map(trade => (
                <div key={trade.id} className="bg-slate-700/50 rounded-lg p-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-1 rounded text-xs font-bold ${trade.direction === 'Long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                      {trade.direction}
                    </div>
                    <div>
                      <p className="font-bold">{trade.pair}</p>
                      <p className="text-xs text-slate-400">{trade.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.pnl >= 0 ? '+' : ''}{fmtUSD(trade.pnl)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Motivational Footer */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-center">
          <p className="text-xl font-bold mb-2">💡 Today's Tip</p>
          <p className="text-purple-100">{getTip()}</p>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Main ---------------- */
const AQTApp: React.FC = () => {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Local State (hydrated from Firebase if available)
  const [balance, setBalance] = useState<number>(1000);
  const [balanceInput, setBalanceInput] = useState<string>("1000");
  const [broker, setBroker] = useState<string>("PlexyTrade");
  const [leverage, setLeverage] = useState<string>(BROKERS["PlexyTrade"]?.default || "1:500");
  const [safeMode, setSafeMode] = useState<boolean>(true);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [taxBracketIndex, setTaxBracketIndex] = useState<number>(2);
  const [isSection1256, setIsSection1256] = useState<boolean>(false);
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    pipValue: 10,
    stopLoss: 15,
    profitTarget: 30,
    dailyGrowth: 5,
    maxDailyLoss: 5,
    maxTradesPerDay: 3,
    startBalance: 100,
    targetBalance: 1000,
    showWeeklyGoals: true,
    showStreakDetails: false,
    tradingStyle: 'day'
  });
  const [isFlipMode, setIsFlipMode] = useState(false);

  // Component Integration State
  const [showHelp, setShowHelp] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showRRCalculator, setShowRRCalculator] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [showShareLLM, setShowShareLLM] = useState(false);
  const [weeklyGoal, setWeeklyGoal] = useState(200);
  const [monthlyGoal, setMonthlyGoal] = useState(800);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [filters, setFilters] = useState<{ pair: string; direction: "" | Direction; minPnl: string; maxPnl: string }>({ pair: "", direction: "", minPnl: "", maxPnl: "" });
  const [notesModalTradeId, setNotesModalTradeId] = useState<string | null>(null);
  const notesTrade = useMemo(() => trades.find((t) => t.id === notesModalTradeId) ?? null, [trades, notesModalTradeId]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const initialTradeState: TradeInput = useMemo(() => ({ pair: "", direction: "Long", entry: "", exit: "", lots: "", setup: "Breakout", emotion: "Calm", notes: "" }), []);
  const [newTrade, setNewTrade] = useState<TradeInput>(initialTradeState);

  // ============= PHASE 1-5: NEW STATE VARIABLES =============
  // Tags System
  const [tags, setTags] = useState<Tag[]>([]);
  // Strategies System
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  // Notifications System
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  // Search & Filters
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  // UI State
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [showNewSettingsManager, setShowNewSettingsManager] = useState(false);
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showStrategyLibrary, setShowStrategyLibrary] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showGoalTracker, setShowGoalTracker] = useState(false);

  // Demo Mode State
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showDemoBanner, setShowDemoBanner] = useState(true);
  const [showImportWizard, setShowImportWizard] = useState(false);

  // Multi-Account State
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [showAccountManager, setShowAccountManager] = useState(false);
  const [balanceOperations, setBalanceOperations] = useState<BalanceOperation[]>([]);

  // Onboarding State
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showOnboardingChecklist, setShowOnboardingChecklist] = useState(true);
  const [hasViewedAnalytics, setHasViewedAnalytics] = useState(false);
  const [showFlipModeSettings, setShowFlipModeSettings] = useState(false);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'ts', direction: 'desc' });

  // Bulk Edit State
  const [selectedTradeIds, setSelectedTradeIds] = useState<Set<string>>(new Set());
  const [bulkSetup, setBulkSetup] = useState<string>('OB');

  // Undo Stack for deleted trades
  const [undoStack, setUndoStack] = useState<{ trade: Trade; originalBalance: number; timeoutId?: NodeJS.Timeout }[]>([]);
  const [showUndoToast, setShowUndoToast] = useState<{ visible: boolean; tradePair?: string }>({ visible: false });

  // Refs
  const entryRef = useRef<HTMLInputElement>(null);
  const exitRef = useRef<HTMLInputElement>(null);
  const lotsRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  // Auth providers
  const googleProvider = useMemo(() => new GoogleAuthProvider(), []);
  const twitterProvider = useMemo(() => new TwitterAuthProvider(), []);

  // --- Auth & Data Effects (only if Firebase is ready) ---
  useEffect(() => {
    if (!firebaseReady || !auth) {
      setIsLoading(false); // Local mode – no cloud sync
      return;
    }
    const initAuth = async () => {
      try {
        const token = process.env.NEXT_PUBLIC_FIREBASE_CUSTOM_TOKEN;
        if (token) await signInWithCustomToken(auth, token);
        else await signInAnonymously(auth);
      } catch (e) {
        console.warn("[AQT] Auth failed; staying in Local Mode:", e);
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Sync Trades from Firebase
  useEffect(() => {
    if (!firebaseReady || !db || !user) return;
    const tradesCol = collection(db, "artifacts", APP_ID, "users", user.uid, "trades");
    const unsubscribe = onSnapshot(tradesCol, (snapshot) => {
      const remoteTrades = snapshot.docs.map(doc => doc.data() as Trade);
      remoteTrades.sort((a, b) => b.ts - a.ts);
      setTrades(remoteTrades);
    });
    return () => unsubscribe();
  }, [user]);

  // Load Trades from localStorage for offline/unauthenticated users
  useEffect(() => {
    if (user) return; // Firebase sync handles authenticated users
    if (typeof window === 'undefined') return;
    try {
      const savedTrades = localStorage.getItem('aqt_offline_trades');
      if (savedTrades) {
        const parsed = JSON.parse(savedTrades) as Trade[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTrades(parsed);
        }
      }
    } catch (e) {
      console.warn('[AQT] Failed to load trades from localStorage:', e);
    }
  }, [user]);

  // Save Trades to localStorage for offline mode
  useEffect(() => {
    if (user) return; // Firebase sync handles authenticated users
    if (typeof window === 'undefined') return;
    if (trades.length === 0) return; // Don't save empty array on initial load
    try {
      localStorage.setItem('aqt_offline_trades', JSON.stringify(trades));
    } catch (e) {
      console.warn('[AQT] Failed to save trades to localStorage:', e);
    }
  }, [trades, user]);

  // Save Settings to localStorage (Offline Fallback)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const settingsToSave = {
      balance,
      broker,
      leverage,
      safeMode,
      darkMode,
      globalSettings
    };
    try {
      localStorage.setItem('aqt_settings', JSON.stringify(settingsToSave));
    } catch (e) {
      console.warn('[AQT] Failed to save settings to localStorage:', e);
    }
  }, [balance, broker, leverage, safeMode, darkMode, globalSettings]);

  // Sync Settings from Firebase (Read)
  useEffect(() => {
    // First, try to load from localStorage as fallback
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('aqt_settings');
        if (savedSettings) {
          const data = JSON.parse(savedSettings);
          if (data.balance !== undefined) { setBalance(data.balance); setBalanceInput(String(data.balance)); }
          if (data.broker !== undefined) setBroker(data.broker);
          if (data.leverage !== undefined) setLeverage(data.leverage);
          if (data.safeMode !== undefined) setSafeMode(data.safeMode);
          if (data.darkMode !== undefined) setDarkMode(data.darkMode);
          if (data.globalSettings !== undefined) setGlobalSettings(data.globalSettings);
        }
      } catch (e) {
        console.warn('[AQT] Failed to load settings from localStorage:', e);
      }
    }

    if (!firebaseReady || !db || !user) {
      setIsLoading(false);
      return;
    }
    const settingsRef = doc(db, "artifacts", APP_ID, "users", user.uid, "data", "settings");
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as any;
        if (data.balance !== undefined) { setBalance(data.balance); setBalanceInput(String(data.balance)); }
        if (data.broker !== undefined) setBroker(data.broker);
        if (data.leverage !== undefined) setLeverage(data.leverage);
        if (data.safeMode !== undefined) setSafeMode(data.safeMode);
        if (data.taxBracketIndex !== undefined) setTaxBracketIndex(data.taxBracketIndex);
        if (data.isSection1256 !== undefined) setIsSection1256(data.isSection1256);
        if (data.darkMode !== undefined) setDarkMode(data.darkMode);
        if (data.globalSettings !== undefined) setGlobalSettings(data.globalSettings);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Sync Settings to Firebase (Write - Debounced) + localStorage fallback
  useEffect(() => {
    const payload = {
      balance,
      broker,
      leverage,
      safeMode,
      taxBracketIndex,
      isSection1256,
      darkMode,
      globalSettings
    };

    // Always save to localStorage as fallback
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('aqt_settings', JSON.stringify(payload));
      } catch (e) {
        console.warn('[AQT] Failed to save settings to localStorage:', e);
      }
    }

    // Also sync to Firebase if available
    if (!firebaseReady || !db || !user) return;
    const settingsRef = doc(db, "artifacts", APP_ID, "users", user.uid, "data", "settings");
    const t = setTimeout(() => {
      setDoc(settingsRef, payload, { merge: true }).catch(e => console.error("Sync error", e));
    }, 1000);
    return () => clearTimeout(t);
  }, [user, balance, broker, leverage, safeMode, taxBracketIndex, isSection1256, darkMode, globalSettings]);

  // Sync Accounts to Firebase (Write - Debounced)
  useEffect(() => {
    if (!firebaseReady || !db || !user || accounts.length === 0) return;
    const accountsRef = doc(db, "artifacts", APP_ID, "users", user.uid, "data", "accounts");
    const t = setTimeout(() => {
      setDoc(accountsRef, { list: accounts }, { merge: true }).catch(e => console.error("Accounts sync error", e));
    }, 1000);
    return () => clearTimeout(t);
  }, [user, accounts]);

  // Sync Accounts from Firebase (Read)
  useEffect(() => {
    if (!firebaseReady || !db || !user) return;
    const accountsRef = doc(db, "artifacts", APP_ID, "users", user.uid, "data", "accounts");
    const unsubscribe = onSnapshot(accountsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.list && Array.isArray(data.list) && data.list.length > 0) {
          // Merge with local? Or replace? 
          // For now, replace if remote has data, but handle ID conflicts?
          // Replacing is safest for sync, assuming single source of truth behavior
          setAccounts(data.list);
          if (!activeAccountId && data.list.length > 0) {
            setActiveAccountId(data.list[0].id);
          }
        }
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Standard Effects
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", darkMode);
    }
  }, [darkMode]);
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      const num = safeParseNumber(balanceInput);
      if (num !== balance) setBalance(num);
    }, 400);
    return () => clearTimeout(t);
  }, [balanceInput, balance]);
  useEffect(() => { const t = setTimeout(() => setIsLoading(false), 600); return () => clearTimeout(t); }, []);

  // Migration for old broker key
  useEffect(() => { if (broker === "Hugo's Way") setBroker("Hugo's Way"); }, [broker]);

  // Load accounts from localStorage on mount
  useEffect(() => {
    if (!isBrowser) return;
    try {
      const stored = localStorage.getItem('aqt_accounts');
      if (stored) {
        const parsed = JSON.parse(stored) as TradingAccount[];
        setAccounts(parsed);
        if (parsed.length > 0 && !activeAccountId) {
          setActiveAccountId(parsed[0].id);
        }
      }
    } catch (e) {
      console.warn('[AQT] Failed to load accounts:', e);
    }
  }, []);

  // Save accounts to localStorage when they change  
  useEffect(() => {
    if (!isBrowser || accounts.length === 0) return;
    try {
      localStorage.setItem('aqt_accounts', JSON.stringify(accounts));
    } catch (e) {
      console.warn('[AQT] Failed to save accounts:', e);
    }
  }, [accounts]);

  // Get active account for greeting
  const activeAccount = useMemo(() => {
    return accounts.find(a => a.id === activeAccountId) || accounts[0] || null;
  }, [accounts, activeAccountId]);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") Notification.requestPermission().catch(() => { });
  }, []);

  // Session alerts
  useEffect(() => {
    if (!alertsEnabled || globalSettings.tradingStyle === 'swing' || !("Notification" in window)) return;
    const sessionOpen = (tz: string, openH: number) => {
      const nowTz = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
      return nowTz.getHours() === openH && nowTz.getMinutes() === 0 && nowTz.getSeconds() === 0;
    };
    if (Notification.permission === "granted") {
      if (sessionOpen('Europe/London', 8)) new Notification("MARKET ALERT: London Open", { body: "08:00 London Time - High Volatility", icon: "/favicon.ico" });
      if (sessionOpen('America/New_York', 8)) new Notification("MARKET ALERT: New York Open", { body: "08:00 New York Time - Session Start", icon: "/favicon.ico" });
    }
  }, [currentTime, alertsEnabled]);

  // Derived
  const pairMeta = useMemo(() => getPairMetadata(newTrade.pair), [newTrade.pair]);
  const brokerMinLot = BROKERS[broker]?.minLot ?? 0.01;

  const metrics = useMemo(
    () => calculateTradingMetrics(balance, broker, safeMode, BROKERS, globalSettings, leverage),
    [balance, broker, safeMode, leverage, globalSettings]
  );
  const { currentTier, lotSize, dailyGoal, maxLoss, targetWin, riskRewardRatio, progress, pipValueForLot } = metrics;

  const beBufferPips = BROKER_BE_BUFFER[broker] ?? 0;

  const effectiveLots = useMemo(() => {
    const raw = safeParseNumber(newTrade.lots);
    if (newTrade.lots && raw >= brokerMinLot) {
      const snapped = Math.max(brokerMinLot, Math.round(raw / brokerMinLot) * brokerMinLot);
      return parseFloat(snapped.toFixed(3));
    }
    return lotSize;
  }, [newTrade.lots, brokerMinLot, lotSize]);

  const pipValueForLotEffective = effectiveLots * globalSettings.pipValue;
  const previewPnL = useMemo(
    () => calculatePnL(newTrade, pipValueForLotEffective, BROKER_BE_BUFFER[broker] ?? 0),
    [newTrade, pipValueForLotEffective, broker]
  );

  const marginRequiredEffective = useMemo(() => {
    const levNum = Math.max(1, parseInt(leverage.replace("1:", "").replace("Unlimited", "2000"), 10) || 500);
    const contractSize = getContractSize(pairMeta);
    const proxyPrice = safeParseNumber(pairMeta.placeholder);
    return balance > 0 && effectiveLots > 0 ? round2((effectiveLots * contractSize * proxyPrice) / levNum) : 0;
  }, [balance, effectiveLots, leverage, pairMeta]);

  const maxLossEffective = useMemo(
    () => round2(pipValueForLotEffective * globalSettings.stopLoss),
    [pipValueForLotEffective, globalSettings.stopLoss]
  );

  const previewR = maxLossEffective > 0 ? (previewPnL / maxLossEffective) : 0;

  const isFormValid = useMemo(() => {
    const errs = validateTradeInputs(newTrade, brokerMinLot);
    setValidationErrors(errs);
    return errs.length === 0;
  }, [newTrade, brokerMinLot]);

  const todayKey = useMemo(() => localDayKey(currentTime), [currentTime]);

  // Filter trades by active account
  const accountTrades = useMemo(() => {
    if (!activeAccountId) return trades;
    return trades.filter(t => (t as any).accountId === activeAccountId);
  }, [trades, activeAccountId]);

  const todayPnl = useMemo(() => accountTrades.filter(t => t.date === todayKey).reduce((s, t) => s + t.pnl, 0), [accountTrades, todayKey]);
  const totalPnL = useMemo(() => accountTrades.reduce((acc, t) => acc + t.pnl, 0), [accountTrades]);

  const balanceHistory = useMemo(() => {
    // If we have an active account with a starting balance, use it as baseline
    let startBal = activeAccount?.startingBalance;

    // If no specific starting balance but we have trades, try to derive from current balance
    if (!startBal && balance > 0) {
      startBal = round2(balance - totalPnL);
    }

    // Default to global setting or 1000 if all else fails
    const baseline = startBal || globalSettings.startBalance || 1000;

    const points = [{ trade: 0, balance: baseline }];
    // Sort trades by timestamp for accurate history
    const sortedTrades = [...accountTrades].sort((a, b) => (a.ts || 0) - (b.ts || 0));

    let runningBal = baseline;
    sortedTrades.forEach((t, i) => {
      runningBal += t.pnl;
      points.push({ trade: i + 1, balance: round2(runningBal) });
    });
    return points;
  }, [accountTrades, balance, totalPnL, activeAccount, globalSettings.startBalance]);

  const riskMetrics = useMemo(() => calculateRiskMetrics(accountTrades, balanceHistory), [accountTrades, balanceHistory]);

  // Recovery Mode Detection
  const startingBalanceRef = activeAccount?.startingBalance || globalSettings.startBalance || 1000;
  const isInRecoveryMode = balance < startingBalanceRef;
  const drawdownAmount = isInRecoveryMode ? round2(startingBalanceRef - balance) : 0;
  const drawdownPercent = isInRecoveryMode ? round2((drawdownAmount / startingBalanceRef) * 100) : 0;
  const recoveryNeeded = isInRecoveryMode ? round2((drawdownAmount / balance) * 100) : 0; // % gain needed to recover

  const { winsCount, lossesCount } = useMemo(() => {
    let w = 0, l = 0; for (const t of accountTrades) { if (t.pnl > 0) w++; else if (t.pnl < 0) l++; }
    return { winsCount: w, lossesCount: l };
  }, [accountTrades]);

  const filteredTrades = useMemo(() => {
    const min = filters.minPnl ? parseFloat(filters.minPnl) : -Infinity;
    const max = filters.maxPnl ? parseFloat(filters.maxPnl) : Infinity;
    const result = accountTrades.filter((t) => {
      if (filters.pair && t.pair !== filters.pair.toUpperCase()) return false;
      if (filters.direction && t.direction !== filters.direction) return false;
      if (t.pnl < min || t.pnl > max) return false;
      return true;
    });

    // Sort logic
    if (sortConfig) {
      result.sort((a, b) => {
        let aVal: any = a[sortConfig.key as keyof Trade];
        let bVal: any = b[sortConfig.key as keyof Trade];

        // Handle null/undefined
        if (aVal === undefined || aVal === null) aVal = "";
        if (bVal === undefined || bVal === null) bVal = "";

        // If string, case insensitive
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      result.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    }

    return result;
  }, [accountTrades, filters, sortConfig]);

  const filteredTotal = useMemo(() => filteredTrades.reduce((s, t) => s + t.pnl, 0), [filteredTrades]);

  // Daily Streak Integration
  const streakData = useStreakCalculator(trades);

  // todayKey and todayPnl already defined above (line 1947-1948)

  const sessionOpen = (tz: string, openH: number, closeH: number) => {
    const nowTz = new Date(currentTime.toLocaleString('en-US', { timeZone: tz }));
    const h = nowTz.getHours();
    return h >= openH && h < closeH;
  };
  const isLondonOpen = sessionOpen('Europe/London', 8, 17);
  const isNYOpen = sessionOpen('America/New_York', 8, 17);
  const isTokyoOpen = sessionOpen('Asia/Tokyo', 9, 18);

  const bracketRate = TAX_BRACKETS_2025[taxBracketIndex]?.rate ?? 0.22;
  const taxRate = activeTaxRate(isSection1256, bracketRate);
  const estimatedTax = Math.max(0, totalPnL) * taxRate;
  const netPocket = totalPnL - estimatedTax;

  // Sorting Handler
  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  // --- Auth actions (Google + Twitter + Sign out) ---
  const signInWithGoogle = async () => {
    if (!auth) {
      if (typeof window !== "undefined") {
        alert("Firebase not ready. Check your .env and Firebase initialization.");
      }
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      // Don't fall back to redirect - it has session storage issues in privacy browsers
      if (err?.code === "auth/popup-blocked") {
        if (typeof window !== "undefined") {
          alert("Popup blocked! Please allow popups for this site and try again.");
        }
      } else if (err?.code === "auth/popup-closed-by-user") {
        // User closed popup, no action needed
      } else {
        if (typeof window !== "undefined") {
          alert(`Google sign-in failed: ${err?.code || err?.message || err}`);
        }
      }
    }
  };

  const signInWithTwitter = async () => {
    if (!auth) {
      if (typeof window !== "undefined") {
        alert("Firebase not ready. Check your .env & Firebase initialization.");
      }
      return;
    }
    try {
      await signInWithPopup(auth, twitterProvider);
    } catch (err: any) {
      // Don't fall back to redirect - it has session storage issues in privacy browsers
      if (err?.code === "auth/popup-blocked") {
        if (typeof window !== "undefined") {
          alert("Popup blocked! Please allow popups for this site and try again.");
        }
      } else if (err?.code === "auth/popup-closed-by-user") {
        // User closed popup, no action needed
      } else {
        if (typeof window !== "undefined") {
          alert(`Twitter sign-in failed: ${err?.code || err?.message || err}`);
        }
      }
    }
  };

  const signOutAll = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (e: any) {
      if (typeof window !== "undefined") {
        alert(`Sign out error: ${e?.code || e?.message || e}`);
      }
    }
  };

  // --- Actions ---
  const addTrade = useCallback(async () => {
    if (!isFormValid) return;
    const beBuf = BROKER_BE_BUFFER[broker] ?? 0;
    const pnlValue = calculatePnL(newTrade, pipValueForLotEffective, beBuf);
    const normalized = normalizeTrade(newTrade, effectiveLots);
    const finalTrade = { ...normalized, pnl: pnlValue };

    // Optimistic Update
    setTrades(prev => [finalTrade, ...prev]);
    setBalance(prev => round2(prev + pnlValue));
    setBalanceInput(String(round2(balance + pnlValue)));

    // Persist to Firestore if available
    if (firebaseReady && db && user) {
      try {
        await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trades', finalTrade.id), finalTrade);
      } catch (e) {
        console.error("Failed to save trade", e);
      }
    }
    setNewTrade(initialTradeState);
  }, [isFormValid, user, newTrade, pipValueForLotEffective, effectiveLots, balance, initialTradeState, broker]);

  const deleteTrade = useCallback(async (id: string, skipConfirm = false) => {
    const trade = trades.find((t) => t.id === id);
    if (!trade) return;

    // Skip confirm if already confirmed (from VirtualizedTradeTable)
    if (!skipConfirm && typeof window !== "undefined" && !window.confirm("Delete trade? You can undo within 5 seconds.")) {
      return;
    }

    const originalBalance = balance;
    const newBalance = round2(balance - trade.pnl);

    // Optimistic UI update (soft delete)
    setBalance(newBalance);
    setBalanceInput(String(newBalance));
    setTrades((prev) => prev.filter((t) => t.id !== id));

    // Show undo toast
    setShowUndoToast({ visible: true, tradePair: trade.pair });

    // Set timeout to permanently delete from Firebase after 5 seconds
    const timeoutId = setTimeout(async () => {
      // Remove from undo stack
      setUndoStack((prev) => prev.filter((item) => item.trade.id !== id));
      setShowUndoToast({ visible: false });

      // Actually delete from Firebase
      if (firebaseReady && db && user) {
        try {
          await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trades', id));
        } catch (e) {
          console.error("Failed to delete trade from Firebase", e);
        }
      }
    }, 5000);

    // Add to undo stack
    setUndoStack((prev) => [...prev, { trade, originalBalance, timeoutId }]);
  }, [user, trades, balance]);

  // Undo last deleted trade
  const undoDelete = useCallback(() => {
    const lastItem = undoStack[undoStack.length - 1];
    if (!lastItem) return;

    // Clear the pending delete timeout
    if (lastItem.timeoutId) clearTimeout(lastItem.timeoutId);

    // Restore trade and balance
    setTrades((prev) => [lastItem.trade, ...prev].sort((a, b) => (b.ts || 0) - (a.ts || 0)));
    setBalance(lastItem.originalBalance);
    setBalanceInput(String(lastItem.originalBalance));

    // Remove from undo stack
    setUndoStack((prev) => prev.slice(0, -1));
    setShowUndoToast({ visible: false });
  }, [undoStack]);

  const copyTrade = useCallback((trade: Trade) => {
    setNewTrade({
      pair: trade.pair,
      direction: trade.direction,
      entry: trade.entry.toString(),
      exit: trade.exit.toString(),
      lots: trade.lots.toString(),
      setup: trade.setup || "Breakout",
      emotion: trade.emotion || "Calm",
      notes: "",
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const uploadTradeImage = async (file: File): Promise<string> => {
    if (!firebaseReady || !storage || !user) {
      if (typeof window !== "undefined") alert("Cloud storage not linked.");
      throw new Error("Cloud storage not linked");
    }
    const storageRef = ref(storage, `trades/${user.uid}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const saveNotes = useCallback(async (id: string, data: { notes: string; imageUrl?: string }) => {
    setTrades((p) => p.map((t) => (t.id === id ? { ...t, notes: data.notes, imageUrl: data.imageUrl || t.imageUrl } : t)));
    setNotesModalTradeId(null);
    if (firebaseReady && db && user) {
      try {
        await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trades', id), { notes: data.notes, ...(data.imageUrl ? { imageUrl: data.imageUrl } : {}) }, { merge: true });
      } catch (e) {
        console.error("Failed to update notes", e);
      }
    }
  }, [user]);

  const applyTemplate = useCallback((name: string) => { const t = TRADE_TEMPLATES.find((temp) => temp.name === name); if (t) setNewTrade((p) => ({ ...p, pair: t.pair, setup: t.setup })); }, []);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const exportToCSV = (tradesToExport?: Trade[]) => {
    const dataToExport = tradesToExport || trades;
    if (dataToExport.length === 0) return;

    const headers = ['ID', 'Date', 'Time', 'Pair', 'Direction', 'Entry', 'Exit', 'PnL', 'Lots', 'Setup', 'Emotion', 'Notes', 'Screenshot'];
    const rows = dataToExport.map(t => {
      const safeNotes = t.notes?.replace(/"/g, '""') || '';
      return [
        t.id, t.date, t.time, t.pair, t.direction, t.entry, t.exit, t.pnl, t.lots, t.setup, t.emotion, `"${safeNotes}"`, t.imageUrl || ''
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `aqt_trades_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onRestore = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(String(ev.target?.result || "{}"));
        if (!data || typeof data !== "object") throw new Error("Invalid");

        if (trades.length > 0) {
          const ok = typeof window !== "undefined" && window.confirm("This will overwrite current data. Continue?");
          if (!ok) return;
        }

        const newBalance = safeParseNumber(data.balance);
        setBalance(newBalance);
        setBalanceInput(String(newBalance));

        const cleanedTrades: Trade[] = (data.trades as any[] || []).map((t: any) => ({
          id: String(t.id ?? generateId()),
          pair: String(t.pair ?? ""),
          direction: (t.direction === "Short" ? "Short" : "Long") as Direction,
          entry: safeParseNumber(t.entry),
          exit: safeParseNumber(t.exit),
          date: t.ts ? localDayKey(new Date(t.ts)) : (t.date ? localDayKey(new Date(t.date)) : localDayKey(new Date())),
          time: String(t.time ?? formatTime(Date.now())),
          ts: typeof t.ts === "number" ? t.ts : Date.now(),
          lots: safeParseNumber(t.lots),
          pnl: safeParseNumber(t.pnl),
          setup: String(t.setup ?? ""),
          emotion: String(t.emotion ?? ""),
          notes: String(t.notes ?? ""),
        }));

        setTrades(cleanedTrades);
        if (data.settings) {
          const s = safeSettings(data.settings);
          setGlobalSettings(prev => ({ ...prev, ...s }));
        }

        if (firebaseReady && db && user) {
          cleanedTrades.forEach(t => {
            setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trades', t.id), t);
          });
          setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'settings'), {
            balance: newBalance,
            globalSettings: data.settings ? { ...safeSettings(data.settings) } : globalSettings
          }, { merge: true });
        }
        alert("System restored successfully.");
      } catch {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  const clearAllTrades = async () => {
    const idsToDelete = trades.map(t => t.id);
    setTrades([]);
    if (firebaseReady && db && user) {
      for (const id of idsToDelete) {
        try { await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trades', id)); }
        catch (e) { console.error("Delete error", id, e); }
      }
    }
  };

  // ============= DEMO MODE HANDLERS =============
  const loadDemoData = useCallback(() => {
    // Cast DEMO_TRADES to match local Trade type
    const demoTradesTyped = DEMO_TRADES.map(t => ({
      ...t,
      time: t.time || '09:00',
      imageUrl: undefined
    })) as Trade[];

    setTrades(demoTradesTyped);
    setBalance(1000); // Demo starting balance
    setBalanceInput('1000');
    setIsDemoMode(true);
    setShowDemoBanner(false);

    console.log('[AQT] Demo data loaded: 100 sample trades');
  }, []);

  const clearDemoData = useCallback(() => {
    setTrades([]);
    setBalance(100);
    setBalanceInput('100');
    setIsDemoMode(false);
    setShowDemoBanner(true);

    console.log('[AQT] Demo data cleared');
  }, []);

  // ============= PHASE 1-5: NEW HANDLERS =============

  // Tag Handlers
  const handleAddTag = useCallback((tag: Omit<Tag, 'id' | 'createdAt' | 'usageCount'>) => {
    const newTag: Tag = {
      ...tag,
      id: Date.now().toString(),
      createdAt: Date.now(),
      usageCount: 0,
    };
    setTags(prev => [...prev, newTag]);
  }, []);

  const handleUpdateTag = useCallback((id: string, updates: Partial<Tag>) => {
    setTags(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const handleDeleteTag = useCallback((id: string) => {
    setTags(prev => prev.filter(t => t.id !== id));
  }, []);

  // Strategy Handlers
  const handleAddStrategy = useCallback((strategy: Omit<Strategy, 'id' | 'totalTrades' | 'winningTrades' | 'losingTrades' | 'totalPnL' | 'averagePnL' | 'bestTrade' | 'worstTrade' | 'createdAt' | 'updatedAt'>) => {
    const newStrategy: Strategy = {
      ...strategy,
      id: Date.now().toString(),
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalPnL: 0,
      averagePnL: 0,
      bestTrade: 0,
      worstTrade: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setStrategies(prev => [...prev, newStrategy]);
  }, []);

  const handleUpdateStrategy = useCallback((id: string, updates: Partial<Strategy>) => {
    setStrategies(prev => prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s));
  }, []);

  const handleDeleteStrategy = useCallback((id: string) => {
    setStrategies(prev => prev.filter(s => s.id !== id));
  }, []);

  // Notification Handlers
  const handleMarkRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const handleClearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const addNotification = useCallback((type: 'goal_reached' | 'max_loss_warning' | 'streak_milestone' | 'weekly_summary' | 'custom', title: string, message: string) => {
    const notif = createNotification(type, title, message);
    setNotifications(prev => [...prev, notif]);
  }, []);

  // Keyboard Shortcuts
  const shortcuts = useMemo(() => createDefaultShortcuts({
    onNewTrade: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    onSettings: () => setShowNewSettingsManager(true),
    onBackup: () => setShowBackupManager(true),
    onAnalytics: () => setShowInsights(true),
    onHelp: () => setShowHelp(true),
    onFocusMode: () => setShowFocusMode(prev => !prev),
    onSearch: () => { }, // Focus search would be implemented here
  }), []);

  // PWA Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      registerServiceWorker().catch(() => { });
      setupInstallPrompt();
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (e as any).isComposing) return;
      if (e.ctrlKey) {
        if (e.key.toLowerCase() === "enter") { e.preventDefault(); addTrade(); }
        if (e.key.toLowerCase() === "r") { e.preventDefault(); setNewTrade(initialTradeState); }
        if (e.key.toLowerCase() === "d" && trades.length > 0) {
          e.preventDefault();
          copyTrade(trades[0]);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [addTrade, initialTradeState, trades, copyTrade]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <h2 className="text-xl font-bold">AQT Trading Journal</h2>
        <p className="text-slate-500">Loading your data...</p>
      </div>
    );
  }

  // Handle Flip Mode
  const handleAddTradeForFlipMode = (tradeInput: Omit<Trade, 'id' | 'ts' | 'time' | 'date' | 'lots' | 'setup' | 'emotion' | 'notes'>) => {
    const ts = Date.now();
    const trade: Trade = {
      ...tradeInput,
      id: generateId(),
      ts,
      time: formatTime(ts),
      date: localDayKey(new Date(ts)),
      lots: 0.01,
      setup: 'Manual',
      emotion: 'Calm',
      notes: ''
    };

    setTrades(prev => [trade, ...prev]);
    setBalance(prev => Math.round((prev + trade.pnl) * 100) / 100);
    setBalanceInput(String(Math.round((balance + trade.pnl) * 100) / 100));

    // Persist to Firestore if available
    if (firebaseReady && db && user) {
      setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trades', trade.id), trade).catch(e => {
        console.error("Failed to save trade", e);
      });
    }
  };

  if (isFlipMode) {
    return (
      <>
        <FlipMode
          balance={balance}
          trades={trades}
          settings={globalSettings}
          onAddTrade={handleAddTradeForFlipMode}
          onSwitchMode={() => setIsFlipMode(false)}
          onOpenSettings={() => setShowFlipModeSettings(true)}
        />

        {/* Flip Mode Settings Modal */}
        <FlipModeSettings
          isOpen={showFlipModeSettings}
          onClose={() => setShowFlipModeSettings(false)}
          balance={balance}
          onSetBalance={(newBalance) => {
            setBalance(newBalance);
            setBalanceInput(newBalance.toString());
          }}
          settings={{
            dailyGrowth: globalSettings.dailyGrowth || 5,
            maxDailyLoss: globalSettings.maxDailyLoss || 5,
            maxTradesPerDay: globalSettings.maxTradesPerDay || 3,
            startBalance: globalSettings.startBalance || 100,
            targetBalance: globalSettings.targetBalance || 1000,
          }}
          onUpdateSettings={(newSettings) => {
            setGlobalSettings(prev => ({ ...prev, ...newSettings }));
          }}
          darkMode={true}
        />
      </>
    );
  }

  return (
    <div className={`min-h-screen font-sans overflow-x-hidden pb-12 transition-colors duration-300 ${darkMode ? "dark bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white" : "bg-white text-slate-800"}`}>
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          #dashboard { max-width: 100% !important; padding: 0 !important; }
          .rounded-xl, .rounded-lg { border-radius: 0 !important; box-shadow: none !important; border: 1px solid #ddd !important; }
        }
      `}</style>

      <div className="print:hidden">
        <ErrorBoundary><TradingViewTicker darkMode={darkMode} /></ErrorBoundary>
      </div>

      {/* Service Worker for Offline Mode */}
      <ServiceWorkerRegistrar />

      <div className="max-w-7xl mx-auto space-y-4 p-4" id="dashboard">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center py-2">
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                AQT <span className="text-blue-600 dark:text-blue-400">v2.8 Pro</span>
                <span className="ml-2 px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 text-xs font-bold uppercase tracking-wider">Beta</span>
                {user ? (
                  <span className="inline-flex" aria-label="Synced to Cloud">
                    <Cloud size={16} className="text-green-500" />
                  </span>
                ) : (
                  <span className="inline-flex" aria-label="Local Mode">
                    <CloudOff size={16} className="text-slate-400" />
                  </span>
                )}
              </h1>
              <p className="text-slate-600 dark:text-blue-300 text-sm">
                Adaptive Quantitative Trading System
                {(activeAccount?.name || user?.displayName) && (
                  <span className="hidden sm:inline"> • Welcome, <span className="font-semibold text-blue-600 dark:text-blue-400">{activeAccount?.name?.split(' ')[0] || user?.displayName?.split(' ')[0]}</span></span>
                )}
              </p>
            </div>

            {/* Sign-in buttons */}
            <div className="flex items-center gap-2">
              {!user && (
                <>
                  <button
                    onClick={signInWithGoogle}
                    className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 dark:bg-white/10 border dark:border-white/20 dark:hover:bg-white/20 text-white text-sm transition-colors"
                    aria-label="Sign in with Google"
                  >
                    Sign in with Google
                  </button>
                  <button
                    onClick={signInWithTwitter}
                    className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 dark:bg-slate-800 text-white dark:hover:bg-slate-700 flex items-center gap-2 text-sm border border-slate-600 dark:border-white/10 transition-colors"
                    aria-label="Sign in with X (Twitter)"
                  >
                    <Twitter size={16} />
                    Sign in with X
                  </button>
                </>
              )}
              {user && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {user.displayName || user.email}
                  </span>
                  <button
                    onClick={signOutAll}
                    className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-500 text-sm"
                    aria-label="Sign out"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0 print:hidden">
            <div className="hidden md:flex gap-2">
              <span className={`px-2 py-1 text-xs rounded ${isTokyoOpen ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`} aria-label={`Tokyo session ${isTokyoOpen ? 'active' : 'inactive'}`}>Tokyo</span>
              <span className={`px-2 py-1 text-xs rounded ${isLondonOpen ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`} aria-label={`London session ${isLondonOpen ? 'active' : 'inactive'}`}>London</span>
              <span className={`px-2 py-1 text-xs rounded ${isNYOpen ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`} aria-label={`New York session ${isNYOpen ? 'active' : 'inactive'}`}>New York</span>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-500 dark:text-slate-400">System Time</div>
              <div className="font-mono text-xl">{currentTime.toLocaleTimeString()}</div>
            </div>
            {/* Primary Action */}
            <button
              onClick={() => setIsFlipMode(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white hover:from-emerald-400 hover:via-blue-400 hover:to-purple-500 transition-all flex items-center gap-2 font-bold text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95"
              title="Switch to Flip Mode"
            >
              <Zap size={16} className="animate-pulse" />
              <span className="hidden sm:inline">Flip Mode</span>
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block"></div>

            {/* Tools - Hidden on mobile */}
            <div className="hidden md:flex glass-card rounded-full p-1.5 gap-1">
              <button onClick={() => setShowHelp(true)} className="p-2.5 rounded-full hover:bg-white/20 dark:hover:bg-white/10 text-purple-500 dark:text-purple-400 transition-all hover:scale-110 hover:shadow-lg hover:shadow-purple-500/20" title="Help Guide"><HelpCircle size={20} /></button>
              <button onClick={() => setShowAnalytics(true)} className="p-2.5 rounded-full hover:bg-white/20 dark:hover:bg-white/10 text-blue-500 dark:text-blue-400 transition-all hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20" title="Analytics Dashboard"><BarChart2 size={20} /></button>
              <button onClick={() => setShowCommunity(true)} className="p-2.5 rounded-full hover:bg-white/20 dark:hover:bg-white/10 text-amber-500 dark:text-amber-400 transition-all hover:scale-110 hover:shadow-lg hover:shadow-amber-500/20" title="Community Leaderboard"><Trophy size={20} /></button>
              <button onClick={() => setShowShareLLM(true)} className="p-2.5 rounded-full hover:bg-white/20 dark:hover:bg-white/10 text-pink-500 dark:text-pink-400 transition-all hover:scale-110 hover:shadow-lg hover:shadow-pink-500/20" title="Share with AI"><Brain size={20} /></button>
            </div>


            {/* Account & Import - Hidden on mobile */}
            <div className="hidden sm:flex gap-2">
              <button
                onClick={() => setShowAccountManager(true)}
                className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 text-blue-500 dark:text-blue-400 hover:from-blue-500/20 hover:to-purple-500/20 transition-all border border-blue-300/30 dark:border-blue-500/20 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20"
                title="Account Manager"
              >
                <UserIcon size={20} />
              </button>
              <button
                onClick={() => setShowImportWizard(true)}
                className="p-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-400 hover:to-emerald-500 transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-110"
                title="Import Trades (MT4/MT5)"
              >
                <Upload size={20} />
              </button>
            </div>

            {/* Settings */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-white/5">
              <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all" title="Settings"><SettingsIcon size={18} /></button>
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all" title="Toggle Theme"><Sun size={18} /></button>
            </div>

            {/* More Menu */}
            <div className="relative">
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={`p-2 rounded-full transition-all border ${isMoreMenuOpen ? 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent'}`}
                title="More Options"
              >
                <MoreVertical size={20} className="text-slate-600 dark:text-slate-400" />
              </button>

              {isMoreMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMoreMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                    {/* Mobile-only: Account & Import */}
                    <div className="sm:hidden">
                      <button onClick={() => { setIsMoreMenuOpen(false); setShowAccountManager(true); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                        <UserIcon size={16} /> Accounts
                      </button>
                      <button onClick={() => { setIsMoreMenuOpen(false); setShowImportWizard(true); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                        <Upload size={16} /> Import Trades
                      </button>
                      <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                    </div>
                    {/* Mobile-only: Tools */}
                    <div className="md:hidden">
                      <button onClick={() => { setIsMoreMenuOpen(false); setShowHelp(true); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                        <HelpCircle size={16} /> Help Guide
                      </button>
                      <button onClick={() => { setIsMoreMenuOpen(false); setShowAnalytics(true); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                        <BarChart2 size={16} /> Analytics
                      </button>
                      <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                    </div>
                    <button
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        backupJSON({ version: "2.8-pro", timestamp: new Date().toISOString(), balance, trades, settings: { broker, leverage, safeMode, taxBracketIndex, isSection1256, darkMode, globalSettings } });
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Download size={16} /> Backup JSON
                    </button>
                    <button
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        exportToCSV();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <BarChart2 size={16} /> Export CSV
                    </button>
                    <button
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        quickExportPDF();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Download size={16} /> Export PDF
                    </button>
                    <label className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer">
                      <Upload size={16} /> Restore Data
                      <input type="file" accept=".json" onChange={(e) => {
                        setIsMoreMenuOpen(false);
                        e.target.files && onRestore(e.target.files[0]);
                      }} className="hidden" />
                    </label>
                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                    <button
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        handlePrint();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Printer size={16} /> Print Report
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ALERTS */}
        <WithdrawalAlert balance={balance} />

        {/* RECOVERY MODE BANNER */}
        {isInRecoveryMode && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-red-600/20 to-orange-600/20 border-2 border-red-500/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="text-red-500" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                    <Flame size={18} /> Recovery Mode Active
                  </h3>
                  <p className="text-sm text-red-300/80">Account is {drawdownPercent.toFixed(1)}% below starting balance</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-xs text-red-400 uppercase font-bold">Drawdown</div>
                  <div className="text-xl font-bold text-red-400">-{fmtUSD(drawdownAmount)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-orange-400 uppercase font-bold">To Recover</div>
                  <div className="text-xl font-bold text-orange-400">+{recoveryNeeded.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DEMO DATA BANNER */}
        {trades.length === 0 && showDemoBanner && !isDemoMode && (
          <DemoDataBanner
            onLoadDemo={loadDemoData}
            onDismiss={() => setShowDemoBanner(false)}
          />
        )}

        {/* ONBOARDING CHECKLIST */}
        {showOnboardingChecklist && trades.length < 20 && (
          <OnboardingChecklist
            tradesCount={trades.length}
            hasTaggedTrade={trades.some(t => t.setup && t.setup !== 'Import')}
            hasViewedDashboard={hasViewedAnalytics}
            onAddTrade={() => window.scrollTo({ top: document.body.scrollHeight * 0.3, behavior: 'smooth' })}
            onOpenSetups={() => setShowTagManager(true)}
            onViewDashboard={() => {
              setHasViewedAnalytics(true);
              setShowInsights(true);
            }}
            onDismiss={() => setShowOnboardingChecklist(false)}
            darkMode={darkMode}
          />
        )}

        {/* SUMMARY */}
        <PerformanceSummary metrics={riskMetrics} />

        {/* STREAK TRACKER */}
        <StreakTracker
          currentStreak={streakData.currentStreak}
          longestStreak={streakData.longestStreak}
          lastProfitableDay={streakData.lastProfitableDay}
          showDetails={globalSettings.showStreakDetails}
        />

        {/* GOALS & BENCHMARKS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {globalSettings.tradingStyle === 'swing' ? (
            /* Swing Mode: Weekly Focus Instead of Daily */
            <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={18} className="text-purple-400" />
                <span className="text-xs text-purple-400 uppercase font-bold tracking-wider">Weekly Focus</span>
              </div>
              <div className="text-2xl font-bold text-white">{fmtUSD(weeklyGoal)}</div>
              <div className="text-xs text-purple-300 mt-1">Long-term growth target</div>
            </div>
          ) : (
            <DailyGoalTracker current={todayPnl} target={dailyGoal} />
          )}
          <PerformanceBenchmarks winRate={riskMetrics.winRate} profitFactor={riskMetrics.profitFactor} tradesCount={trades.length} />
          <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2 block">Total P&L</div>
              <div className={`text-xl font-bold ${totalPnL >= 0 ? "text-green-500" : "text-red-500"}`} aria-live="polite">{fmtUSD(totalPnL)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2 block bg-transparent">Account</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white bg-transparent" aria-live="polite">{fmtUSD(balance)}</div>
            </div>
          </div>
        </div>

        {/* MILESTONES */}
        <PerformanceMilestones trades={trades} balance={balance} />

        {/* WEEKLY & MONTHLY GOALS - Always visible in Swing mode */}
        {(globalSettings.showWeeklyGoals || globalSettings.tradingStyle === 'swing') && (
          <WeeklyGoals
            trades={trades}
            weeklyGoal={weeklyGoal}
            monthlyGoal={monthlyGoal}
            onUpdateWeeklyGoal={setWeeklyGoal}
            onUpdateMonthlyGoal={setMonthlyGoal}
          />
        )}

        {/* CONFIGURATION */}
        <CollapsibleSection title="Configuration" icon={Shield}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="text-blue-700 dark:text-blue-200 text-xs font-bold uppercase tracking-wider mb-2 block">Balance ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-blue-600 dark:text-blue-400">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value.replace(/[^\d.-]/g, ""))}
                  className="w-full pl-8 pr-4 py-2 bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-white/20 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg"
                />
              </div>
            </div>
            <div>
              <label className="text-blue-700 dark:text-blue-200 text-xs font-bold uppercase tracking-wider mb-2 block">Broker & Lev</label>
              <div className="flex gap-2">
                <select
                  value={broker}
                  onChange={(e) => {
                    const b = e.target.value;
                    setBroker(b);
                    const nextLev = BROKERS[b]?.default ?? BROKERS[b]?.leverage?.[0] ?? leverage;
                    setLeverage(nextLev);
                  }}
                  className="w-full px-2 py-2 bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-white/20 rounded-lg text-slate-900 dark:text-white text-sm"
                >
                  {Object.keys(BROKERS).map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <select
                  value={leverage}
                  onChange={(e) => setLeverage(e.target.value)}
                  className="w-24 px-2 py-2 bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-white/20 rounded-lg text-slate-900 dark:text-white text-sm"
                >
                  {(BROKERS[broker]?.leverage ?? [leverage]).map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 text-right">{BROKERS[broker]?.regulation ?? "—"}</div>
            </div>
            <div>
              <label className="text-blue-700 dark:text-blue-200 text-xs font-bold uppercase tracking-wider mb-2 block">Risk Mode</label>
              <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg border border-slate-300 dark:border-white/20">
                <button type="button" onClick={() => setSafeMode(true)} className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${safeMode ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400" : "text-slate-400"}`}>Safe</button>
                <button type="button" onClick={() => setSafeMode(false)} className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${!safeMode ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400" : "text-slate-400"}`}>Aggressive</button>
              </div>
            </div>
            <div>
              <label className="text-blue-700 dark:text-blue-200 text-xs font-bold uppercase tracking-wider mb-2 block">Tax (2025)</label>
              <select value={taxBracketIndex} onChange={(e) => setTaxBracketIndex(parseInt(e.target.value, 10))} className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white text-sm">
                {TAX_BRACKETS_2025.map((b, i) => <option key={i} value={i}>{b.label}</option>)}
              </select>
              <div className="mt-2 text-xs flex items-center gap-2">
                <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <input type="checkbox" checked={isSection1256} onChange={(e) => setIsSection1256(e.target.checked)} />
                  <span>Use §1256 (60/40)</span>
                </label>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* METRICS & RISK */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gradient-to-br dark:from-blue-600/20 dark:to-indigo-600/20 rounded-xl p-6 border border-slate-200 dark:border-white/10 relative overflow-hidden shadow-sm dark:shadow-none">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white"><TrendingUp size={20} /> Tier Status</h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between border-b border-slate-200 dark:border-white/10 pb-2"><span className="text-blue-700 dark:text-blue-200">Current Tier</span><span className="font-bold text-green-600 dark:text-green-400 text-lg">{currentTier.name}</span></div>
              <div className="w-full bg-slate-200 dark:bg-black/30 h-3 rounded-full overflow-hidden"><div className="bg-gradient-to-r from-blue-400 to-green-400 h-full transition-all duration-1000" style={{ width: `${progress}%` }} /></div>
              <p className="text-xs text-slate-500 dark:text-blue-300 italic">
                {metrics.nextTier ? `${fmtUSD(Math.max(0, metrics.nextTier.min - balance))} to reach ${metrics.nextTier.name}` : currentTier.desc}
              </p>
            </div>
          </div>

          <div className={`rounded-xl p-6 border border-slate-200 dark:border-white/10 relative overflow-hidden transition-colors duration-500 shadow-sm dark:shadow-none ${safeMode ? "bg-emerald-50 dark:bg-emerald-600/20" : "bg-orange-50 dark:bg-orange-600/20"}`}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white"><Target size={20} /> Risk Controls</h3>
            <div className="space-y-2 relative z-10 text-sm">
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-white/10"><span className="text-slate-700 dark:text-white">Rec. Lots</span><span className="font-bold text-xl text-slate-900 dark:text-white">{lotSize}</span></div>
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-white/10"><span className="text-slate-700 dark:text-white">Max Loss</span><span className="font-bold text-red-600 dark:text-red-300">{fmtUSD(maxLoss)}</span></div>
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-white/10"><span className="text-slate-700 dark:text-white">Target Win</span><span className="font-bold text-emerald-600 dark:text-emerald-300">{fmtUSD(targetWin)}</span></div>
              <div className="flex justify-between"><span className="text-slate-700 dark:text-white">Est. R:R</span><span className="font-mono text-blue-600 dark:text-blue-200">1:{riskRewardRatio}</span></div>
              <div className="flex justify-between"><span className="text-slate-700 dark:text-white">Margin ({(newTrade.pair || "EURUSD").toUpperCase()})</span><span className="font-mono text-blue-600 dark:text-blue-200">{fmtUSD(marginRequiredEffective)}</span></div>
              <div className="flex justify-between pt-1"><span className="text-slate-700 dark:text-white">Lots In Use</span><span className="font-mono text-slate-900 dark:text-white font-bold">{effectiveLots}</span></div>
              <div className="flex justify-between"><span className="text-slate-700 dark:text-white">BE Buffer</span><span className="font-mono text-slate-900 dark:text-white">{beBufferPips} pips</span></div>
              <RiskOfRuinCalculator winRate={riskMetrics.winRate} riskPerTradePct={balance > 0 ? Math.max(0.01, (maxLossEffective / balance) * 100) : 0} />
            </div>
          </div>

          {globalSettings.tradingStyle === 'scalper' ? (
            <div className="bg-white dark:bg-gradient-to-br dark:from-slate-700/50 dark:to-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-white/10 relative overflow-hidden shadow-sm dark:shadow-none">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white"><Zap size={20} /> Scalper Stats</h3>
              <div className="space-y-3 relative z-10 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Pip Value ({effectiveLots}L)</span><span className="font-mono text-blue-600 dark:text-blue-200">{fmtUSD(pipValueForLotEffective)}</span></div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Spread Impact</span><span className="text-amber-500 font-bold">High Priority</span></div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Recent Win Rate</span><span className="font-bold text-green-500 dark:text-green-400">{((winsCount / (Math.max(1, winsCount + lossesCount))) * 100).toFixed(0)}%</span></div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gradient-to-br dark:from-slate-700/50 dark:to-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-white/10 relative overflow-hidden shadow-sm dark:shadow-none">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                  <Calculator size={20} /> Tax Est.
                  <span className="ml-2 text-[10px] text-slate-400 font-normal">(estimate; excludes state taxes)</span>
                </h3>
                <button onClick={() => setIsSection1256(!isSection1256)} className="text-[10px] px-2 py-1 rounded border border-slate-500">Mode</button>
              </div>
              <div className="space-y-3 relative z-10 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Gross P&L</span><span className={totalPnL >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>{fmtUSD(totalPnL)}</span></div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300"><span title="Estimated based on filing status & location">Est. Tax ({(taxRate * 100).toFixed(1)}%)</span><span className="text-red-500 dark:text-red-300">{fmtUSD(-estimatedTax)}</span></div>
                <div className="border-t border-slate-200 dark:border-white/20 pt-2 flex justify-between"><span className="font-bold text-slate-800 dark:text-white">Net Pocket</span><span className={`font-bold text-lg ${netPocket >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{fmtUSD(netPocket)}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* DEEP ANALYTICS */}
        {trades.length > 0 && (
          <CollapsibleSection title="Deep Analytics" icon={BarChart2}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <EnhancedTradeHeatmap trades={trades} />
              <SetupPerformanceAnalysis trades={trades} />
              <PairPerformanceSummary trades={trades} />
            </div>
          </CollapsibleSection>
        )}

        {/* BROKER COMMISSION MODELS */}
        <CollapsibleSection title="Broker Commission Models" icon={Calculator} defaultOpen={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300">
                  <th className="py-2 pr-3 text-left">Broker</th>
                  <th className="py-2 pr-3 text-left">Model</th>
                  <th className="py-2 pr-3 text-left">Pricing</th>
                  <th className="py-2 pr-3 text-left">Note</th>
                </tr>
              </thead>
              <tbody>
                {BROKER_MODELS.map((b) =>
                  b.models.map((m, i) => (
                    <tr key={`${b.name}-${m.label}`} className="border-b border-slate-100 dark:border-white/5">
                      {i === 0 && (
                        <td rowSpan={b.models.length} className="py-3 pr-3 font-bold align-top text-slate-800 dark:text-white">
                          {b.name}
                        </td>
                      )}
                      <td className="py-3 pr-3 text-slate-700 dark:text-slate-300">{m.label}</td>
                      <td className="py-3 pr-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold border
                          ${m.commission
                            ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                            : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"}`}>
                          {m.commission ? "Spread + Commission" : "Spread-Only"}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-slate-500 dark:text-slate-400">{m.note}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Note: labels & fees vary by <em>account type</em> and <em>region</em>. Use your broker's official specs for exact numbers.
            </div>
          </div>
        </CollapsibleSection>

        {/* ENTRY */}
        <CollapsibleSection title="Trade Entry" icon={DollarSign} defaultOpen={true}>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="col-span-2 md:col-span-1"><label className="text-xs text-blue-700 dark:text-blue-200 block mb-1">Pair</label><input type="text" placeholder="EURUSD" value={newTrade.pair} list={listId} onChange={(e) => setNewTrade({ ...newTrade, pair: e.target.value.toUpperCase() })} onKeyDown={(e) => e.key === "Enter" && entryRef.current?.focus()} className="w-full pl-8 pr-4 py-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg" /><datalist id={listId}>{COMMON_PAIRS.map((p) => <option key={p} value={p} />)}</datalist></div>
            <div><label className="text-xs text-blue-700 dark:text-blue-200 block mb-1">Dir</label><select value={newTrade.direction} onChange={(e) => setNewTrade({ ...newTrade, direction: e.target.value as Direction })} className="w-full bg-slate-100 dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded px-3 py-3 text-sm dark:text-white"><option value="Long">Long</option><option value="Short">Short</option></select></div>
            <div><label className="text-xs text-blue-700 dark:text-blue-200 block mb-1">Entry</label><input ref={entryRef} type="number" placeholder={pairMeta.placeholder} step={pairMeta.step} value={newTrade.entry} onChange={(e) => setNewTrade({ ...newTrade, entry: e.target.value })} onKeyDown={(e) => e.key === "Enter" && exitRef.current?.focus()} className="w-full bg-slate-100 dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded px-3 py-3 dark:text-white" /></div>
            <div><label className="text-xs text-blue-700 dark:text-blue-200 block mb-1">Exit</label><input ref={exitRef} type="number" placeholder={pairMeta.placeholder} step={pairMeta.step} value={newTrade.exit} onChange={(e) => setNewTrade({ ...newTrade, exit: e.target.value })} onKeyDown={(e) => e.key === "Enter" && lotsRef.current?.focus()} className="w-full bg-slate-100 dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded px-3 py-3 dark:text-white" /></div>
            <div><label className="text-xs text-blue-700 dark:text-blue-200 block mb-1">Lots</label><input ref={lotsRef} type="number" placeholder={`Rec: ${lotSize}`} step={brokerMinLot} value={newTrade.lots} onChange={(e) => setNewTrade({ ...newTrade, lots: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addTrade()} className="w-full bg-slate-100 dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded px-3 py-3 dark:text-white" /></div>
            <div><label className="text-xs text-blue-700 dark:text-blue-200 block mb-1">Setup</label><select value={newTrade.setup} onChange={(e) => setNewTrade({ ...newTrade, setup: e.target.value })} className="w-full bg-slate-100 dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded px-3 py-3 text-sm dark:text-white">{TRADE_SETUPS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="mt-4 p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 flex justify-between items-center" aria-live="polite">
            <div className="text-xs text-slate-500">Live Preview (with {effectiveLots} lots):</div>
            <div className="flex items-center gap-4"><div className={`text-lg font-bold ${previewPnL >= 0 ? "text-green-500" : "text-red-500"}`} aria-live="polite">{previewPnL >= 0 ? "+" : ""}{fmtUSD(previewPnL)}</div><div className="text-xs px-2 py-1 bg-slate-200 dark:bg-white/10 rounded text-slate-600 dark:text-slate-300">{previewR >= 0 ? "+" : ""}{previewR.toFixed(2)}R</div></div>
          </div>
          {beBufferPips > 0 && (
            <div className="mt-2 text-[11px] rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-2 py-1 flex items-center gap-2">
              <AlertTriangle size={14} />
              Reality Check: on {broker}, a "breakeven" stop is a net loss. You need ~+{beBufferPips} pips to cover spread + commission.
            </div>
          )}
          {validationErrors.length > 0 && (<ul className="mt-3 text-sm text-red-600 list-disc list-inside">{validationErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>)}
          <div className="mt-4 flex gap-3"><button type="button" onClick={addTrade} disabled={!isFormValid} className={`flex-1 font-bold py-3 rounded-lg text-lg shadow-xl ${isFormValid ? "bg-blue-600 text-white" : "bg-slate-300 dark:bg-slate-700 text-slate-500"}`}>{isFormValid ? "Log Trade" : "Enter Details"}</button><button type="button" onClick={() => setNewTrade(initialTradeState)} className="px-4 py-3 rounded-lg bg-slate-200 dark:bg-slate-800">Reset</button></div>
        </CollapsibleSection>

        {/* SETUP & SESSION ANALYTICS */}
        {trades.length >= 5 && (
          <CollapsibleSection title="Setup & Session Analytics" icon={BarChart2} defaultOpen={false}>
            <div className="space-y-6">
              <ExpectancyChart trades={trades} darkMode={darkMode} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SessionHeatmap trades={trades} darkMode={darkMode} />
                <RMultipleECDF trades={trades} darkMode={darkMode} />
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* CHARTS */}
        {trades.length > 0 && (
          <CollapsibleSection title="Performance Charts" icon={PieIcon} defaultOpen={false}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-slate-100 dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/10">
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Growth Curve</h3>
                <ErrorBoundary><ResponsiveContainer width="100%" height={220}><LineChart data={balanceHistory}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="trade" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} domain={["dataMin - 5", "dataMax + 5"]} /><Tooltip formatter={(val: number, name: string) => [fmtUSD(val), name]} /><Line type="monotone" dataKey="balance" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></ErrorBoundary>
              </div>
              <div className="bg-slate-100 dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/10">
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Win/Loss Ratio</h3>
                <ErrorBoundary><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={[{ name: "Wins", value: winsCount }, { name: "Losses", value: lossesCount }]} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value"><Cell key="wins" fill="#10b981" /><Cell key="losses" fill="#ef4444" /></Pie><Tooltip formatter={(val: number, name: string) => [String(val), name]} /></PieChart></ResponsiveContainer></ErrorBoundary>
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* JOURNAL */}
        <CollapsibleSection title={`Journal (${trades.length})`} icon={Brain}>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-end mb-4">
            <input placeholder="Pair" list={listId} value={filters.pair} onChange={(e) => setFilters(f => ({ ...f, pair: e.target.value.toUpperCase() }))} className="px-2 py-1 rounded border dark:border-white/10 bg-white dark:bg-slate-900" />
            <select value={filters.direction} onChange={(e) => setFilters(f => ({ ...f, direction: e.target.value as any }))} className="px-2 py-1 rounded border dark:border-white/10 bg-white dark:bg-slate-900"><option value="">All</option><option value="Long">Long</option><option value="Short">Short</option></select>
            <input placeholder="Min P&L" inputMode="decimal" value={filters.minPnl} onChange={(e) => setFilters(f => ({ ...f, minPnl: e.target.value }))} className="px-2 py-1 w-24 rounded border dark:border-white/10 bg-white dark:bg-slate-900" />
            <input placeholder="Max P&L" inputMode="decimal" value={filters.maxPnl} onChange={(e) => setFilters(f => ({ ...f, maxPnl: e.target.value }))} className="px-2 py-1 w-24 rounded border dark:border-white/10 bg-white dark:bg-slate-900" />
            <button type="button" onClick={() => setFilters({ pair: "", direction: "", minPnl: "", maxPnl: "" })} className="h-8 px-3 rounded bg-slate-200 dark:bg-slate-700 text-sm">Clear</button>
            <div className="ml-auto flex gap-2 items-center">
              <ClearAllTradesButton onClear={clearAllTrades} />
              <button type="button" onClick={() => exportToCSV(filteredTrades)} className="h-8 px-3 rounded bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 flex items-center gap-2" aria-label="Export CSV">
                <Download size={14} /> Export CSV
              </button>
              <label className="h-8 px-3 rounded bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer" aria-label="Restore">
                <Upload size={14} /> Restore
                <input type="file" accept=".json" className="hidden" onChange={(e) => e.target.files && onRestore(e.target.files[0])} />
              </label>
            </div>
          </div>

          {/* Bulk Action Bar - shows when trades are selected */}
          {selectedTradeIds.size > 0 && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  {selectedTradeIds.size} trade{selectedTradeIds.size > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-blue-600 dark:text-blue-400">Set Setup:</label>
                  <select
                    value={bulkSetup}
                    onChange={(e) => setBulkSetup(e.target.value)}
                    className="px-3 py-1.5 rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-sm"
                    title="Select setup to apply"
                  >
                    {TRADE_SETUPS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button
                    onClick={() => {
                      // Apply bulk setup to all selected trades
                      const updatedTrades = trades.map(t =>
                        selectedTradeIds.has(t.id) ? { ...t, setup: bulkSetup } : t
                      );
                      setTrades(updatedTrades);
                      setSelectedTradeIds(new Set());
                    }}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSelectedTradeIds(new Set())}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                Clear Selection
              </button>
            </div>
          )}

          {/* Use VirtualizedTradeTable for large journals (100+ trades) */}
          {trades.length >= 100 ? (
            <div>
              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Zap size={16} />
                <span>Virtualized view enabled for {trades.length} trades (faster scrolling)</span>
              </div>
              <VirtualizedTradeTable
                trades={filteredTrades as any}
                onEdit={(id) => setNotesModalTradeId(id)}
                onDelete={(id) => { if (window.confirm('Delete this trade?')) deleteTrade(id); }}
                onViewNotes={(id) => setNotesModalTradeId(id)}
                darkMode={darkMode}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-blue-600 dark:text-blue-300 border-b border-slate-200 dark:border-white/10">
                    <th scope="col" className="pb-3 pl-2 w-8">
                      <input
                        type="checkbox"
                        checked={filteredTrades.length > 0 && filteredTrades.every(t => selectedTradeIds.has(t.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTradeIds(new Set(filteredTrades.map(t => t.id)));
                          } else {
                            setSelectedTradeIds(new Set());
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300 dark:border-white/20 accent-blue-600"
                        title="Select all trades"
                      />
                    </th>
                    <th scope="col" className="pb-3 pl-2 hidden sm:table-cell cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleSort('ts')}>
                      <div className="flex items-center gap-1">Time {sortConfig?.key === 'ts' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                    </th>
                    <th scope="col" className="pb-3 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleSort('pair')}>
                      <div className="flex items-center gap-1">Pair {sortConfig?.key === 'pair' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                    </th>
                    <th scope="col" className="pb-3 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleSort('direction')}>
                      <div className="flex items-center gap-1">Dir {sortConfig?.key === 'direction' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                    </th>
                    <th scope="col" className="pb-3 hidden sm:table-cell cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleSort('setup')}>
                      <div className="flex items-center gap-1">Setup {sortConfig?.key === 'setup' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                    </th>
                    <th scope="col" className="pb-3 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleSort('lots')}>
                      <div className="flex items-center gap-1">Lots {sortConfig?.key === 'lots' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                    </th>
                    <th scope="col" className="pb-3 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleSort('pnl')}>
                      <div className="flex items-center gap-1">P&L {sortConfig?.key === 'pnl' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                    </th>
                    <th scope="col" className="pb-3">Notes</th>
                    <th scope="col" className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.length === 0 && trades.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                            <DollarSign className="text-blue-600 dark:text-blue-400" size={32} />
                          </div>
                          <h3 className="text-lg font-bold text-slate-700 dark:text-white">No Trades Yet</h3>
                          <p className="text-slate-500 dark:text-slate-400 mb-4">Start by entering your first trade above.</p>
                          <button
                            onClick={() => {
                              setNewTrade({ ...initialTradeState, pair: "EURUSD", entry: "1.0500", exit: "1.0550", lots: "1.00" });
                              setTimeout(() => {
                                if (typeof window !== "undefined") {
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }
                              }, 100);
                            }}
                            className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 transition-colors"
                          >
                            Fill Sample Trade
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTrades.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <AlertTriangle className="text-yellow-500 mb-2" size={32} />
                          <h3 className="text-lg font-bold text-slate-700 dark:text-white">No Matching Trades</h3>
                          <p className="text-slate-500 dark:text-slate-400">Try adjusting your filters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTrades.map((t) => (
                      <tr key={t.id} className={`border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 ${selectedTradeIds.has(t.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                        <td className="py-3 pl-2 w-8">
                          <input
                            type="checkbox"
                            checked={selectedTradeIds.has(t.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedTradeIds);
                              if (e.target.checked) {
                                newSet.add(t.id);
                              } else {
                                newSet.delete(t.id);
                              }
                              setSelectedTradeIds(newSet);
                            }}
                            className="w-4 h-4 rounded border-slate-300 dark:border-white/20 accent-blue-600"
                          />
                        </td>
                        <td className="py-3 pl-2 text-slate-600 dark:text-white hidden sm:table-cell">{t.date} <span className="text-xs text-slate-400">{t.time}</span></td>
                        <td className="py-3 font-bold text-slate-800 dark:text-white">{t.pair}</td>
                        <td className="py-3"><span className={`px-2 py-0.5 rounded text-xs ${t.direction === "Long" ? "bg-green-100 text-green-700 dark:text-green-300 dark:bg-green-900/50" : "bg-red-100 text-red-700 dark:text-red-300 dark:bg-red-900/50"}`}>{t.direction}</span></td>
                        <td className="py-3 text-slate-500 dark:text-slate-400 text-xs hidden sm:table-cell">{t.setup}</td>
                        <td className="py-3 text-slate-600 dark:text-slate-300 font-mono">{t.lots}</td>
                        <td className={`py-3 font-bold font-mono ${t.pnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{fmtUSD(t.pnl)}</td>
                        <td className="py-3">
                          <button onClick={() => setNotesModalTradeId(t.id)} className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-300 hover:underline">
                            {t.imageUrl && <ImageIcon size={14} className="text-purple-500" />}
                            <Edit3 size={14} /> {t.notes || t.imageUrl ? "Details" : "Add"}
                          </button>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => copyTrade(t)} className="text-blue-400 hover:text-blue-600" aria-label="Copy"><ClipboardCopy size={14} /></button>
                            <button onClick={() => deleteTrade(t.id)} className="text-slate-400 hover:text-red-500" aria-label="Delete"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-white/5 font-mono">
                    <td className="py-2 pl-2 text-xs text-slate-500 dark:text-slate-400" colSpan={5}>Filtered total</td>
                    <td className={`py-2 font-bold ${filteredTotal >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {fmtUSD(filteredTotal)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CollapsibleSection>
      </div>

      <TradeNotesModal
        trade={notesTrade}
        isOpen={!!notesModalTradeId}
        onClose={() => setNotesModalTradeId(null)}
        onSave={saveNotes}
        onUpload={uploadTradeImage}
      />
      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={globalSettings} onSave={(s) => setGlobalSettings((prev) => ({ ...prev, ...s }))} />

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-slate-900/95 z-50 overflow-y-auto p-4 md:p-8 animate-in fade-in duration-200">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                <BarChart2 className="text-blue-400" />
                Visual Analytics
              </h2>
              <button
                onClick={() => setShowAnalytics(false)}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>
            <AnalyticsDashboard trades={accountTrades} currentBalance={balance} startBalance={activeAccount?.startingBalance || globalSettings.startBalance || 1000} />
          </div>
        </div>
      )}

      {/* Help Guide Modal */}
      <HelpGuide isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* ============= PHASE 1-5: NEW UI COMPONENTS ============= */}

      {/* Smart Insights Modal */}
      {showInsights && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-4 bg-slate-900 p-4 rounded-t-xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Brain className="text-purple-400" />
                Smart Insights
              </h2>
              <button onClick={() => setShowInsights(false)} className="text-white hover:text-slate-300">
                <X size={24} />
              </button>
            </div>
            <SmartInsights trades={accountTrades} />
          </div>
        </div>
      )}

      {/* Tag Manager Modal */}
      {showTagManager && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto p-4 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl">
              <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold dark:text-white">Manage Tags</h2>
                <button onClick={() => setShowTagManager(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <TagManager
                  tags={tags}
                  onAddTag={handleAddTag}
                  onUpdateTag={handleUpdateTag}
                  onDeleteTag={handleDeleteTag}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Library Modal */}
      {showStrategyLibrary && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto p-4 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl">
              <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold dark:text-white">Strategy Library</h2>
                <button onClick={() => setShowStrategyLibrary(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <StrategyLibrary
                  strategies={strategies}
                  onAddStrategy={handleAddStrategy}
                  onUpdateStrategy={handleUpdateStrategy}
                  onDeleteStrategy={handleDeleteStrategy}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Manager Modal */}
      {showNewSettingsManager && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto p-4 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto my-8">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden">
              <div className="h-full">
                <SettingsManager
                  isOpen={showNewSettingsManager}
                  settings={{
                    balance,
                    broker,
                    safeMode,
                    isPremium: true,
                    darkMode,
                    flipMode: isFlipMode,
                    dailyGoal: balance * ((globalSettings.dailyGrowth || 5) / 100), // Calculated override
                    weeklyGoal,
                    monthlyGoal,
                    targetBalance: globalSettings.targetBalance || 1000,
                    startBalance: globalSettings.startBalance || 100,
                    maxDailyLossPercent: globalSettings.maxDailyLoss || 5,
                    currentStreak: streakData.currentStreak,
                    longestStreak: streakData.longestStreak,
                    showBestStreak: globalSettings.showStreakDetails,
                    dailyGrowth: globalSettings.dailyGrowth || 5, // Default explicit
                    // Global settings overlap
                    ...globalSettings,
                    leverage: 50, // Default fallback
                    taxBracketIndex: taxBracketIndex,
                    isSection1256: isSection1256
                  } as any}
                  onSave={(newSettings) => {
                    // Update Top Level State
                    if (newSettings.balance !== undefined) { setBalance(newSettings.balance); setBalanceInput(String(newSettings.balance)); }
                    if (newSettings.broker !== undefined) setBroker(newSettings.broker);
                    if (newSettings.safeMode !== undefined) setSafeMode(newSettings.safeMode);
                    if (newSettings.darkMode !== undefined) setDarkMode(newSettings.darkMode);
                    if (newSettings.flipMode !== undefined) setIsFlipMode(newSettings.flipMode);
                    if (newSettings.taxBracketIndex !== undefined) setTaxBracketIndex(newSettings.taxBracketIndex);
                    if (newSettings.isSection1256 !== undefined) setIsSection1256(newSettings.isSection1256);

                    // Update Global Settings
                    setGlobalSettings(prev => ({
                      ...prev,
                      ...newSettings,
                      // Ensure percentage fields map correctly if needed
                      maxDailyLoss: newSettings.maxDailyLossPercent ?? prev.maxDailyLoss,
                      dailyGrowth: newSettings.dailyGrowth ?? prev.dailyGrowth
                    }));

                    addNotification('custom', 'Settings Saved', 'Your preferences have been updated.');
                    setShowNewSettingsManager(false);
                  }}
                  onClose={() => setShowNewSettingsManager(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backup Manager Modal */}
      {showBackupManager && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto p-4 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl">
              <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold dark:text-white">Backup & Restore</h2>
                <button onClick={() => setShowBackupManager(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <BackupManager
                  balance={balance}
                  trades={trades}
                  settings={globalSettings}
                  tags={tags}
                  strategies={strategies}
                  onRestore={(data: any) => {
                    if (data.balance) { setBalance(data.balance); setBalanceInput(String(data.balance)); }
                    if (data.settings) setGlobalSettings(prev => ({ ...prev, ...data.settings }));
                    if (data.tags) setTags(data.tags);
                    if (data.strategies) setStrategies(data.strategies);
                    setShowBackupManager(false);
                    alert('Backup restored!');
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goal Tracker Modal */}
      {showGoalTracker && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto p-4 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl">
              <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold dark:text-white">Goals & Milestones</h2>
                <button onClick={() => setShowGoalTracker(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <GoalTracker
                  currentBalance={balance}
                  startBalance={globalSettings.startBalance || 100}
                  targetBalance={globalSettings.targetBalance || 1000}
                  totalPnL={totalPnL}
                  totalTrades={trades.length}
                  currentStreak={streakData.currentStreak}
                  longestStreak={streakData.longestStreak}
                  winRate={riskMetrics.winRate}
                  onMilestoneAchieved={(milestone) => {
                    addNotification('streak_milestone', 'Milestone Achieved!', `You've reached: ${milestone.name}`);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Focus Mode Overlay */}
      {showFocusMode && (
        <FocusMode
          isActive={showFocusMode}
          onClose={() => setShowFocusMode(false)}
          currentBalance={balance}
          todayPnL={todayPnl}
        >
          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Quick Trade Entry</h3>
            <p className="text-slate-400 text-sm">Focus mode active. Press Ctrl+Shift+F to exit.</p>
          </div>
        </FocusMode>
      )}

      {/* Notification Manager in Header */}
      <div className="fixed top-4 right-4 z-40">
        <NotificationManager
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onClearAll={handleClearNotifications}
          notificationSettings={{ enabled: true, sound: true }}
        />
      </div>

      {/* Keyboard Shortcut Manager */}
      <ShortcutManager shortcuts={shortcuts} enabled={!showFocusMode} />

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Demo Mode Indicator */}
      {isDemoMode && (
        <DemoModeIndicator onClearDemo={clearDemoData} />
      )}

      {/* Import Wizard Modal */}
      <ImportWizard
        isOpen={showImportWizard}
        onClose={() => setShowImportWizard(false)}
        onImport={(importedTrades) => {
          setTrades(prev => [...prev, ...(importedTrades as Trade[])]);
          setIsDemoMode(false);
        }}
        darkMode={darkMode}
      />

      {/* Welcome Modal (FTUX) */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => {
          setShowWelcomeModal(false);
          localStorage.setItem('aqt_has_visited', 'true');
        }}
        onLoadDemo={() => {
          loadDemoData();
          setShowWelcomeModal(false);
          localStorage.setItem('aqt_has_visited', 'true');
        }}
        onOpenImport={() => {
          setShowImportWizard(true);
          setShowWelcomeModal(false);
          localStorage.setItem('aqt_has_visited', 'true');
        }}
        onSetBalance={(newBalance) => {
          setBalance(newBalance);
          setBalanceInput(newBalance.toString());
        }}
        currentBalance={balance}
        darkMode={darkMode}
      />

      {/* Import Wizard Modal */}
      {showImportWizard && (
        <ImportWizard
          isOpen={showImportWizard}
          onClose={() => setShowImportWizard(false)}
          onImport={(importedTrades, accountInfo, startingBalance) => {
            // Handle account info if present
            let accountId: string | undefined;
            if (accountInfo && (accountInfo.name || accountInfo.accountNumber)) {
              // Check if account already exists
              const existingAccount = accounts.find(
                acc => acc.accountNumber === accountInfo.accountNumber
              );

              if (existingAccount) {
                // Update existing account
                accountId = existingAccount.id;
                setAccounts(prev => prev.map(acc =>
                  acc.id === existingAccount.id
                    ? { ...acc, lastUpdated: Date.now(), lastReportDate: accountInfo.reportDate }
                    : acc
                ));
              } else {
                // Create new account with starting balance
                const newAccount: TradingAccount = {
                  id: `acct-${Date.now()}`,
                  name: accountInfo.name || 'Unknown',
                  accountNumber: accountInfo.accountNumber || '',
                  broker: accountInfo.broker || '',
                  currency: accountInfo.currency || 'USD',
                  accountType: accountInfo.accountType,
                  server: accountInfo.server,
                  createdAt: Date.now(),
                  lastUpdated: Date.now(),
                  lastReportDate: accountInfo.reportDate,
                  startingBalance: startingBalance || 0
                };
                accountId = newAccount.id;
                setAccounts(prev => [...prev, newAccount]);

                // Set as active if first account
                if (accounts.length === 0) {
                  setActiveAccountId(newAccount.id);
                }
              }
            }

            // Update balance to starting balance from first deposit
            if (startingBalance && startingBalance > 0) {
              // Calculate total P&L from imported trades
              const totalPnL = importedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
              // Set balance to starting balance + all trade P&L
              const calculatedBalance = startingBalance + totalPnL;
              setBalance(calculatedBalance);
              setBalanceInput(calculatedBalance.toString());

              // Also update globalSettings.startBalance for equity curve
              setGlobalSettings(prev => ({
                ...prev,
                startBalance: startingBalance
              }));
            }

            // Add imported trades with account ID
            const newTrades = importedTrades.map((t, i) => ({
              ...t,
              id: `imported-${Date.now()}-${i}`,
              ts: t.ts || new Date(t.date).getTime(),
              time: t.time ?? formatTime(t.ts || Date.now()),
              emotion: t.emotion ?? 'Unknown',
              notes: t.notes ?? '',
              accountId: accountId
            })) as Trade[];

            setTrades(prev => [...prev, ...newTrades]);

            // Persist imported trades to Firebase
            if (firebaseReady && db && user && newTrades.length > 0) {
              const saveTrades = async () => {
                try {
                  let batch = writeBatch(db);
                  let count = 0;
                  const promises = [];

                  for (const trade of newTrades) {
                    // Sanitize to remove undefined values which Firestore rejects
                    const safeTrade = JSON.parse(JSON.stringify(trade));
                    const ref = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'trades', trade.id);
                    batch.set(ref, safeTrade);
                    count++;
                    if (count >= 450) { // Commit batch every ~450 items
                      promises.push(batch.commit());
                      batch = writeBatch(db);
                      count = 0;
                    }
                  }
                  if (count > 0) promises.push(batch.commit());
                  await Promise.all(promises);
                  console.log(`Successfully saved ${newTrades.length} imported trades to cloud.`);
                } catch (e) {
                  console.error("Failed to save imported trades to cloud", e);
                }
              };
              saveTrades();
            }

            setShowImportWizard(false);
            setIsDemoMode(false);
          }}
          darkMode={darkMode}
        />
      )}

      {/* Account Manager Modal */}
      <AccountManager
        isOpen={showAccountManager}
        onClose={() => setShowAccountManager(false)}
        accounts={accounts}
        activeAccountId={activeAccountId}
        onSelectAccount={(accountId) => {
          setActiveAccountId(accountId);
          setShowAccountManager(false);
        }}
        onUpdateAccount={(updatedAccount) => {
          setAccounts(prev => prev.map(acc =>
            acc.id === updatedAccount.id ? updatedAccount : acc
          ));
        }}
        onDeleteAccount={(accountId) => {
          setAccounts(prev => prev.filter(acc => acc.id !== accountId));
          if (activeAccountId === accountId) {
            const remaining = accounts.filter(acc => acc.id !== accountId);
            setActiveAccountId(remaining.length > 0 ? remaining[0].id : null);
          }
        }}
        balanceOperations={balanceOperations}
        onAddBalanceOperation={(operation) => {
          // Add operation to list
          setBalanceOperations(prev => [...prev, operation]);
          // Update balance based on operation
          if (operation.type === 'deposit') {
            setBalance(prev => round2(prev + operation.amount));
            setBalanceInput(String(round2(balance + operation.amount)));
          } else {
            setBalance(prev => round2(prev - operation.amount));
            setBalanceInput(String(round2(balance - operation.amount)));
          }
          // Update account's starting balance if it's the first deposit
          if (operation.accountId) {
            setAccounts(prev => prev.map(acc => {
              if (acc.id === operation.accountId) {
                const newStartingBalance = operation.type === 'deposit'
                  ? (acc.startingBalance || 0) + operation.amount
                  : (acc.startingBalance || 0) - operation.amount;
                return { ...acc, startingBalance: newStartingBalance, lastUpdated: Date.now() };
              }
              return acc;
            }));
          }
        }}
        darkMode={darkMode}
      />

      {/* Undo Toast Notification */}
      {showUndoToast.visible && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="glass-card px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-200 dark:border-slate-700">
            <div className="text-slate-700 dark:text-slate-200">
              <span className="font-medium">{showUndoToast.tradePair}</span> trade deleted
            </div>
            <button
              onClick={undoDelete}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
            >
              Undo
            </button>
            <button
              onClick={() => setShowUndoToast({ visible: false })}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Community Leaderboard */}
      <CommunityLeaderboard
        isOpen={showCommunity}
        onClose={() => setShowCommunity(false)}
        darkMode={darkMode}
        userStats={{
          winRate: riskMetrics.winRate,
          profitFactor: riskMetrics.profitFactor,
          totalTrades: trades.length,
          bestStreak: streakData.longestStreak || 0,
          averageRR: riskMetrics.expectancy || 0,
        }}
        userId={user?.uid}
      />

      {/* Share with AI */}
      <ShareWithLLM
        isOpen={showShareLLM}
        onClose={() => setShowShareLLM(false)}
        darkMode={darkMode}
        trades={trades.map(t => ({
          id: t.id,
          pair: t.pair,
          direction: t.direction,
          pnl: t.pnl,
          setup: t.setup || 'Unknown',
          emotion: t.emotion || 'Unknown',
          date: t.date,
          time: t.time,
          notes: t.notes,
        }))}
        stats={{
          winRate: riskMetrics.winRate,
          profitFactor: riskMetrics.profitFactor,
          expectancy: riskMetrics.expectancy || 0,
          totalPnL: trades.reduce((sum, t) => sum + t.pnl, 0),
        }}
      />

      {/* Corner mascot peek */}
      <MascotPeek
        delay={5000}
        position="bottom-right"
        message="Let's get those gains! 🐺💰"
        enabled={true}
      />

    </div>
  );
};

export default AQTApp;
