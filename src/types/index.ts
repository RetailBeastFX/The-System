/**
 * Shared TypeScript types for RetailBeastFX Journal
 */

/**
 * CANONICAL Trade Object
 * Single executed position with immutable timestamps
 */
export interface Trade {
    // === IMMUTABLE CORE ===
    id: string;
    pair: string;                    // Canonical symbol name
    direction: 'Long' | 'Short';
    entry: number;
    exit: number;
    lots: number;
    pnl: number;
    date: string;                    // YYYY-MM-DD
    time?: string;                   // Time of day ("HH:MM" or locale string)
    ts: number;                      // Unix timestamp (immutable)

    // === RISK (numeric only) ===
    sl?: number;                     // Stop loss price
    tp?: number;                     // Take profit price
    riskRewardRatio?: number;

    // === CONTEXT ===
    setup: string;
    sessionType?: SessionType;
    entryType?: EntryType;
    mood?: MoodType;                 // Single emotion field
    emotion?: string;                // Free-form emotion label (imports, legacy data)
    accountId?: string;
    source?: 'manual' | 'metaapi' | 'csv' | 'ctrader';
    tags?: string[];
    strategyId?: string;

    // === NOTES (single field) ===
    notes?: string;
    imageUrl?: string;
    voiceNoteUrl?: string;

    // === ENFORCEMENT ===
    ruleViolation?: ViolationReason;
    stopMoved?: boolean;
    submission?: TradeSubmission;

    // === COSTS ===
    transactionFee?: number;
}

// Canonical type definitions
export type SessionType = 'London' | 'NewYork' | 'Tokyo' | 'Sydney' | 'Frankfurt' | 'London-NY Overlap' | 'Overlap' | 'Asian' | 'Off-Hours' | 'News Event';
export type EntryType = 'Breakout' | 'Pullback' | 'Reversal' | 'Fade' | 'Momentum' | 'Scalp' | 'Swing' | 'Position';
export type MoodType = 'confident' | 'fearful' | 'neutral' | 'greedy' | 'disciplined' | 'anxious' | 'calm';

/**
 * Trading Account from MT5/MT4 report or manual entry
 */
export interface TradingAccount {
    id: string;
    name: string;           // Account holder name (e.g., "Alvin Marshall")
    accountNumber: string;  // Account ID (e.g., "973451")
    broker: string;         // Company/Broker name (e.g., "Coinexx Limited")
    currency: string;       // Account currency (e.g., "USD")
    accountType?: string;   // Account type (e.g., "real, Hedge")
    server?: string;        // Server name (e.g., "Coinexx-Live")
    createdAt: number;      // Timestamp when account was added
    lastUpdated: number;    // Timestamp of last import
    lastReportDate?: string; // Date from last imported report
    startingBalance?: number; // Initial balance from first deposit
}

/**
 * Deposit or withdrawal from account (from MT5 Deals table)
 */
export interface BalanceOperation {
    id: string;
    type: 'deposit' | 'withdrawal';
    amount: number;         // Always positive amount
    date: string;           // YYYY-MM-DD format
    ts: number;             // Timestamp for sorting
    balance: number;        // Running balance after operation
    comment?: string;       // e.g., "Auto-Account-Deposit"
    accountId?: string;     // Link to TradingAccount
}

export interface NewTradeInput {
    pair: string;
    direction: 'Long' | 'Short';
    entry: string;
    exit: string;
    setup: string;
    emotion: string;
    stopLoss?: string;
    takeProfit?: string;
    notes?: string;
}

export interface UserSettings {
    balance: number;
    broker: string;
    safeMode: boolean;
    isPremium: boolean;
    darkMode: boolean;
    flipMode: boolean;
    dailyGoal: number; // dynamic or static
    weeklyGoal?: number;
    monthlyGoal?: number;
    targetBalance: number;
    startBalance: number;
    maxDailyLossPercent: number;
    currentStreak?: number;
    longestStreak?: number;
    lastProfitableDay?: string;
    showBestStreak?: boolean;

    // Added from GlobalSettings
    dailyGrowth: number;
    pipValue: number;
    stopLoss: number;
    profitTarget: number;
    maxTradesPerDay?: number;
    showWeeklyGoals?: boolean;
    showStreakDetails?: boolean;
    maxDailyLoss?: number; // Fixed amount override
    leverage?: number;
    taxBracketIndex?: number;
    isSection1256?: boolean;

    // Phase 1 Enhancements
    settingsMode?: 'simple' | 'advanced'; // Settings UI mode
    collapsedSections?: string[]; // Array of collapsed section IDs
    tradingStyle?: 'scalper' | 'day' | 'swing'; // Trading Style Mode

    // Notification preferences
    notificationsEnabled?: boolean;
    notifyOnGoalReached?: boolean;
    notifyOnMaxLossWarning?: boolean;
    notifyOnStreakMilestone?: boolean;
    notifyOnWeeklySummary?: boolean;
    notificationSound?: boolean;

    // Backup preferences
    autoBackup?: boolean;
    backupFrequency?: 'daily' | 'weekly' | 'monthly';
    lastBackupDate?: number;

    // Multi-account
    activeAccountId?: string; // Currently selected trading account
}

export interface Tier {
    name: string;
    min: number;
    max: number;
    pairs: number;
    suggestedPairs?: string;
    desc: string;
}

export interface BrokerConfig {
    minLot: number;
    leverage: string[];
    default: string;
}

export interface DeletedTrade extends Trade {
    deletedAt: number;
}

export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    description: string;
    action: () => void;
}

// Violation Taxonomy - Universal (works for any strategy)
export const VIOLATION_REASONS = [
    // === RISK MANAGEMENT ===
    'No Stop Loss',           // Universal: Every strategy should have stops
    'Stop Moved',             // Universal: Moving SL against the trade
    'Overleveraged',          // Universal: Position too large for account

    // === ENTRY DISCIPLINE ===
    'No Setup',               // Universal: Traded without valid entry criteria
    'Outside Trading Hours',  // Universal: Traded outside your preferred session
    'Chasing Entry',          // Universal: Entered late after move started

    // === PSYCHOLOGY ===
    'Revenge / FOMO',         // Universal: Emotional trading
    'Overtrading',            // Universal: Too many trades
    'Ignored Rules',          // Universal: Broke your own strategy rules

    // === SMALL ACCOUNT DISCIPLINE ===
    'Daily Limit Breach',     // Trading more than max trades per day
    'Withdrawal Goal Ignored' // Not withdrawing when target reached
] as const;
export type ViolationReason = typeof VIOLATION_REASONS[number];

// Setup Quality - Generic categories
export type SetupQuality = 'A+' | 'A' | 'B' | 'C' | 'IMPULSE';

// Weekly Review Gate
export interface WeeklyReview {
    id: string;
    weekEndingDate: string; // ISO date of the Sunday (or review date)
    bestSession: string;
    worstViolation: string; // Can be one of VIOLATION_REASONS or custom
    fixForNextWeek: string;
    timestamp: number;
}

// ============= BEHAVIOR ENFORCEMENT TYPES =============

/**
 * User-defined trading rule (framework-agnostic)
 */
export interface UserRule {
    id: string;
    category: 'entry' | 'risk' | 'session' | 'exit';
    description: string;  // e.g., "Entry requires trend alignment"
    required: boolean;    // Must be checked for trade to proceed
    createdAt: number;
}

/**
 * Trade lock state (cooldown, session lock, etc.)
 */
export interface TradeLock {
    type: 'cooldown' | 'session' | 'review' | 'violations' | 'daily_limit';
    reason: string;       // Clinical explanation
    expiresAt: number;    // Unix timestamp when lock expires (0 = manual unlock)
    sessionType?: string; // Which session is locked
    createdAt: number;
}

/**
 * Trade submission with eligibility tracking
 */
export interface TradeSubmission {
    rulesChecked: string[];      // IDs of rules user confirmed
    allRulesMet: boolean;
    eligibilityConfirmed: boolean;
    submittedAt: number;
    editLockedAt: number;        // 30 min after entry (truth machine)
    isAmended?: boolean;         // Flagged if edited after lock
    amendedAt?: number;
}

/**
 * Default rules for new users (universal)
 */
export const DEFAULT_RULES: Omit<UserRule, 'id' | 'createdAt'>[] = [
    { category: 'entry', description: 'Setup confirmation present', required: true },
    { category: 'entry', description: 'Trend/bias aligned', required: true },
    { category: 'risk', description: 'Stop loss defined', required: true },
    { category: 'risk', description: 'Position size within limits', required: true },
    { category: 'session', description: 'Trading during planned hours', required: false },
];
