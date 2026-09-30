/**
 * Import Pipeline for RetailBeastFX Journal
 * Supports CSV parsing with column auto-detection and MT4/MT5 format handling
 */

import { Trade, BalanceOperation } from '../types';

// ============= TYPES =============

export interface ColumnMapping {
    source: string;      // Column name in imported file
    target: keyof Trade | null;  // Mapped Trade field or null if skipped
    sampleValues: string[];      // First 3 values for preview
}

export interface ImportValidationError {
    row: number;
    column: string;
    value: string;
    message: string;
}

export interface ImportResult {
    success: boolean;
    trades: Trade[];
    errors: ImportValidationError[];
    warnings: string[];
    skippedRows: number;
}

export interface ParsedRow {
    [key: string]: string;
}

// ============= COLUMN DETECTION =============

// Column patterns for import field detection
// This includes aliases and import-specific fields that get mapped to Trade properties
const COLUMN_PATTERNS: Partial<Record<keyof Trade | 'symbol' | 'size' | 'timestamp', RegExp[]>> = {
    id: [/^id$/i, /^trade.?id$/i, /^ticket$/i, /^order$/i, /^position$/i, /^deal$/i],
    pair: [/^pair$/i, /^symbol$/i, /^instrument$/i, /^market$/i, /^currency$/i],
    symbol: [/^symbol$/i, /^pair$/i, /^instrument$/i], // Alias for pair
    direction: [/^direction$/i, /^side$/i, /^type$/i, /^buy.?sell$/i, /^action$/i],
    entry: [/^entry$/i, /^open.?price$/i, /^entry.?price$/i, /^price$/i],
    exit: [/^exit$/i, /^close.?price$/i, /^exit.?price$/i, /^take.?profit$/i, /^closeprice$/i],
    date: [/^date$/i, /^open.?date$/i, /^trade.?date$/i, /^time$/i, /^opentime$/i],
    time: [/^time$/i, /^open.?time$/i, /^trade.?time$/i],
    ts: [/^timestamp$/i, /^unix$/i, /^epoch$/i],
    lots: [/^lot/i, /^size$/i, /^volume$/i, /^qty$/i, /^quantity$/i, /^units$/i],
    size: [/^size$/i, /^lot/i, /^volume$/i], // Alias for lots
    pnl: [/^pnl$/i, /^p&l$/i, /^profit$/i, /^net.?profit$/i, /^result$/i, /^gain$/i],
    setup: [/^setup$/i, /^strategy$/i, /^pattern$/i, /^playbook$/i],
    emotion: [/^emotion$/i, /^mood$/i, /^feeling$/i, /^mental$/i],
    notes: [/^note/i, /^comment/i, /^remark/i, /^description$/i],
    sl: [/^sl$/i, /^stop.?loss$/i, /^stop$/i], // Numeric stop loss
    tp: [/^tp$/i, /^take.?profit$/i, /^target$/i], // Numeric take profit
    imageUrl: [/^image$/i, /^screenshot$/i, /^chart$/i],
    sessionType: [/^session$/i, /^market.?session$/i],
    tags: [/^tag/i, /^label/i, /^category$/i],
    strategyId: [/^strategy.?id$/i],
    riskRewardRatio: [/^r[:/]?r$/i, /^risk.?reward$/i],
    timestamp: [/^timestamp$/i],
    voiceNoteUrl: [/^voice$/i, /^audio$/i],
    mood: [/^mood$/i],
    accountId: [], // Not auto-mapped from imports, set programmatically
    entryType: [/^entry.?type$/i, /^entry.?style$/i], // Entry style categorization
    source: [/^source$/i, /^origin$/i], // Trade source
    stopMoved: [], // Not auto-mapped, set manually
    ruleViolation: [], // Not auto-mapped, set manually
};

/**
 * Auto-detect column mappings based on header names
 */
export function detectColumnMappings(headers: string[]): ColumnMapping[] {
    const mappings: ColumnMapping[] = [];
    const usedTargets = new Set<string>();

    headers.forEach(header => {
        let bestMatch: keyof Trade | null = null;

        // Check each pattern
        for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
            if (usedTargets.has(field)) continue;

            for (const pattern of patterns) {
                if (pattern.test(header.trim())) {
                    bestMatch = field as keyof Trade;
                    usedTargets.add(field);
                    break;
                }
            }
            if (bestMatch) break;
        }

        mappings.push({
            source: header,
            target: bestMatch,
            sampleValues: []
        });
    });

    return mappings;
}

/**
 * Add sample values to mappings for preview
 */
export function addSampleValues(mappings: ColumnMapping[], rows: ParsedRow[]): ColumnMapping[] {
    return mappings.map(mapping => ({
        ...mapping,
        sampleValues: rows.slice(0, 3).map(row => row[mapping.source] || '').filter(Boolean)
    }));
}

// ============= CSV PARSING =============

/**
 * Parse CSV string into rows
 */
export function parseCSV(csvContent: string): { headers: string[]; rows: ParsedRow[] } {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) {
        return { headers: [], rows: [] };
    }

    // Detect delimiter (comma, semicolon, tab)
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t') && !firstLine.includes(',')) {
        delimiter = '\t';
    } else if (firstLine.includes(';') && !firstLine.includes(',')) {
        delimiter = ';';
    }

    // Parse header row
    const headers = parseCSVLine(firstLine, delimiter);

    // Parse data rows
    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i], delimiter);
        const row: ParsedRow = {};
        headers.forEach((header, idx) => {
            row[header] = values[idx] || '';
        });
        rows.push(row);
    }

    return { headers, rows };
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++; // Skip escaped quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === delimiter && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());

    return result;
}

// ============= VALUE PARSING =============

/**
 * Parse direction value from various formats
 */
export function parseDirection(value: string): 'Long' | 'Short' | null {
    const v = value.toLowerCase().trim();
    if (['long', 'buy', 'b', '1', 'up'].includes(v)) return 'Long';
    if (['short', 'sell', 's', '-1', 'down'].includes(v)) return 'Short';
    return null;
}

/**
 * Parse number value safely
 */
export function parseNumber(value: string): number | null {
    if (!value || value.trim() === '') return null;
    const cleaned = value.replace(/[,$€£¥]/g, '').replace(/\s/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

/**
 * Parse date value into YYYY-MM-DD format
 * Preserves the date as-is without timezone conversion
 */
export function parseDate(value: string): string | null {
    if (!value || value.trim() === '') return null;

    // MT5 format: "2025.05.11 02:44:48" or "2025.05.11"
    const mt5Match = value.match(/^(\d{4})\.(\d{2})\.(\d{2})/);
    if (mt5Match) {
        return `${mt5Match[1]}-${mt5Match[2]}-${mt5Match[3]}`;
    }

    // ISO format: "2024-01-15" or "2024-01-15T..."
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    // US format: "01/15/2024"
    const usMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (usMatch) {
        return `${usMatch[3]}-${usMatch[1]}-${usMatch[2]}`;
    }

    // EU format: "15.01.2024" (only if not MT5 format which has YYYY first)
    const euMatch = value.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
    if (euMatch) {
        return `${euMatch[3]}-${euMatch[2]}-${euMatch[1]}`;
    }

    // Alt format: "15-01-2024"
    const altMatch = value.match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (altMatch) {
        return `${altMatch[3]}-${altMatch[2]}-${altMatch[1]}`;
    }

    // Fallback: try to extract any YYYY-MM-DD pattern
    const anyYMD = value.match(/(\d{4})[.\-\/](\d{2})[.\-\/](\d{2})/);
    if (anyYMD) {
        return `${anyYMD[1]}-${anyYMD[2]}-${anyYMD[3]}`;
    }

    return null;
}

// ============= TRADE CONVERSION =============

/**
 * Convert parsed rows to Trade objects using column mappings
 */
export function convertToTrades(
    rows: ParsedRow[],
    mappings: ColumnMapping[]
): ImportResult {
    const trades: Trade[] = [];
    const errors: ImportValidationError[] = [];
    const warnings: string[] = [];
    let skippedRows = 0;

    // Build mapping lookup
    const mappingLookup = new Map<keyof Trade, string>();
    mappings.forEach(m => {
        if (m.target) {
            mappingLookup.set(m.target, m.source);
        }
    });

    // Convert each row
    rows.forEach((row, rowIndex) => {
        const getValue = (field: keyof Trade | string): string => {
            const sourceCol = mappingLookup.get(field as keyof Trade);
            return sourceCol ? row[sourceCol] || '' : '';
        };

        // Required fields
        const pairValue = getValue('pair');
        const directionValue = getValue('direction');
        const entryValue = getValue('entry');
        const pnlValue = getValue('pnl');

        // Validate required fields
        const direction = parseDirection(directionValue);
        const entry = parseNumber(entryValue);
        const pnl = parseNumber(pnlValue);

        if (!pairValue) {
            errors.push({ row: rowIndex + 2, column: 'pair', value: pairValue, message: 'Missing pair/symbol' });
        }
        if (!direction) {
            errors.push({ row: rowIndex + 2, column: 'direction', value: directionValue, message: 'Invalid direction (expected Long/Short)' });
        }
        if (entry === null) {
            errors.push({ row: rowIndex + 2, column: 'entry', value: entryValue, message: 'Invalid entry price' });
        }
        if (pnl === null) {
            errors.push({ row: rowIndex + 2, column: 'pnl', value: pnlValue, message: 'Invalid P&L value' });
        }

        // Skip row if missing critical fields
        if (!pairValue || !direction || entry === null || pnl === null) {
            skippedRows++;
            return;
        }

        // Parse optional fields
        const exit = parseNumber(getValue('exit'));
        const lots = parseNumber(getValue('lots')) || 0.01;
        const date = parseDate(getValue('date')) || new Date().toISOString().split('T')[0];
        const timeStr = getValue('time') || '09:00';

        // Skip zero PnL trades where entry === exit (these are likely pending/cancelled orders or balance ops)
        // Real breakeven trades typically have slight difference between entry/exit due to spread
        if (pnl === 0 && (exit === null || exit === entry)) {
            skippedRows++;
            warnings.push(`Row ${rowIndex + 2}: Skipped $0 trade with no exit price (likely pending/cancelled order)`);
            return;
        }

        const trade: Trade = {
            id: getValue('id') || `import-${Date.now()}-${rowIndex}`,
            pair: pairValue.toUpperCase().replace(/[^A-Z0-9]/g, ''),
            direction,
            entry,
            exit: exit || entry,
            pnl,
            lots,
            date,
            ts: new Date(`${date}T${timeStr}`).getTime() || Date.now(),
            setup: getValue('setup') || 'Imported',
            mood: (getValue('mood') || undefined) as Trade['mood'],
            emotion: getValue('emotion') || undefined,
            notes: getValue('notes') || '',
            sl: parseNumber(getValue('sl')) || undefined,
            tp: parseNumber(getValue('tp')) || undefined,
        };

        trades.push(trade);
    });

    // Generate warnings
    if (skippedRows > 0) {
        warnings.push(`${skippedRows} rows skipped due to missing required fields`);
    }
    if (errors.length > 0) {
        warnings.push(`${errors.length} validation errors found`);
    }

    return {
        success: errors.length === 0,
        trades,
        errors,
        warnings,
        skippedRows
    };
}

// ============= MT4/MT5 HTML PARSING =============

/**
 * Parse MT5 Trade History Report HTML export
 * Handles Positions, Orders, and Deals tables with proper column mapping
 */
export function parseMT4HTML(htmlContent: string): { headers: string[]; rows: ParsedRow[] } {
    // First, try to find specific MT5 tables by looking for section markers
    const content = htmlContent;

    // Look for the Positions table (best for closed trades with P&L)
    const positionsData = extractMT5Table(content, 'Positions');
    if (positionsData.rows.length > 0) {
        return normalizeMT5Headers(positionsData);
    }

    // Fallback to Deals table
    const dealsData = extractMT5Table(content, 'Deals');
    if (dealsData.rows.length > 0) {
        return normalizeMT5Headers(dealsData);
    }

    // Final fallback: find the largest table with trade-like data
    return extractLargestTradeTable(content);
}

/**
 * Extract a specific MT5 table by section name
 * MT5 format: section headers are in <b> tags like <b>Positions</b>
 */
function extractMT5Table(html: string, sectionName: string): { headers: string[]; rows: ParsedRow[] } {
    // Find the section header - MT5 uses <b>Positions</b> format
    // Try multiple patterns since MT5 format can vary
    const patterns = [
        new RegExp(`<b>\\s*${sectionName}\\s*</b>`, 'i'),
        new RegExp(`<th[^>]*>\\s*${sectionName}\\s*</th>`, 'i'),
        new RegExp(`<td[^>]*><b>\\s*${sectionName}\\s*</b></td>`, 'i'),
        new RegExp(`>\\s*${sectionName}\\s*<`, 'i'),
    ];

    let sectionMatch: RegExpMatchArray | null = null;
    let matchIndex = -1;

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match.index !== undefined) {
            if (matchIndex === -1 || match.index < matchIndex) {
                sectionMatch = match;
                matchIndex = match.index;
            }
        }
    }

    if (!sectionMatch || matchIndex === -1) {
        return { headers: [], rows: [] };
    }

    // Get content after the section header
    const afterSection = html.substring(matchIndex + sectionMatch[0].length);

    // The table with data FOLLOWS the section header
    // Find the next <tr> that contains the column headers
    const tableStartMatch = afterSection.match(/<tr[^>]*>/i);
    if (!tableStartMatch || tableStartMatch.index === undefined) {
        return { headers: [], rows: [] };
    }

    // Find the end of this table section (either next section or end of table)
    const nextSectionMatch = afterSection.match(/<b>\s*(Orders|Deals|Results)\s*<\/b>/i);
    const tableEndIndex = nextSectionMatch?.index || afterSection.length;

    // Extract just the table rows for this section
    const sectionContent = afterSection.substring(0, tableEndIndex);

    // Get all rows in this section
    const rowMatches = sectionContent.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    if (rowMatches.length < 2) {
        return { headers: [], rows: [] };
    }

    return parseHTMLTableRows(rowMatches);
}

/**
 * Parse HTML table rows into headers and data rows
 */
function parseHTMLTableRows(rowMatches: string[]): { headers: string[]; rows: ParsedRow[] } {
    if (rowMatches.length < 2) {
        return { headers: [], rows: [] };
    }

    // Extract headers from first row
    const headerRow = rowMatches[0];
    const headerCells = headerRow.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) || [];
    const rawHeaders = headerCells.map(cell =>
        cell.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
    );

    // Make headers unique by appending index for duplicates
    const headers: string[] = [];
    const headerCounts: Record<string, number> = {};
    rawHeaders.forEach(h => {
        const baseHeader = h || 'Column';
        if (headerCounts[baseHeader] !== undefined) {
            headerCounts[baseHeader]++;
            headers.push(`${baseHeader}_${headerCounts[baseHeader]}`);
        } else {
            headerCounts[baseHeader] = 0;
            headers.push(baseHeader);
        }
    });

    // Parse data rows
    const rows: ParsedRow[] = [];
    for (let i = 1; i < rowMatches.length; i++) {
        const rowHtml = rowMatches[i];
        const dataCells = rowHtml.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) || [];
        const values = dataCells.map(cell =>
            cell.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
        );

        // Skip rows that don't match header count or are empty
        if (values.length !== headers.length || values.length === 0) continue;

        // Skip balance/summary rows (they typically have very few filled values)
        const filledValues = values.filter(v => v && v !== '0.00' && v !== '0');
        if (filledValues.length < 3) continue;

        const row: ParsedRow = {};
        headers.forEach((header, idx) => {
            row[header] = values[idx] || '';
        });
        rows.push(row);
    }

    return { headers, rows };
}

/**
 * Parse an HTML table into headers and rows
 */
function parseHTMLTable(tableHtml: string): { headers: string[]; rows: ParsedRow[] } {
    const rowMatches = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    if (rowMatches.length < 2) {
        return { headers: [], rows: [] };
    }

    // Extract headers from first row
    const headerRow = rowMatches[0];
    const headerCells = headerRow.match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi) || [];
    const rawHeaders = headerCells.map(cell =>
        cell.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
    );

    // Make headers unique by appending index for duplicates
    const headers: string[] = [];
    const headerCounts: Record<string, number> = {};
    rawHeaders.forEach(h => {
        const baseHeader = h || 'Column';
        if (headerCounts[baseHeader] !== undefined) {
            headerCounts[baseHeader]++;
            headers.push(`${baseHeader}_${headerCounts[baseHeader]}`);
        } else {
            headerCounts[baseHeader] = 0;
            headers.push(baseHeader);
        }
    });

    // Parse data rows
    const rows: ParsedRow[] = [];
    for (let i = 1; i < rowMatches.length; i++) {
        const rowHtml = rowMatches[i];
        const dataCells = rowHtml.match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi) || [];
        const values = dataCells.map(cell =>
            cell.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
        );

        // Skip rows that don't match header count or are summary/empty rows
        if (values.length !== headers.length) continue;

        // Skip balance/summary rows (they typically have very few filled values)
        const filledValues = values.filter(v => v && v !== '0.00' && v !== '0');
        if (filledValues.length < 3) continue;

        const row: ParsedRow = {};
        headers.forEach((header, idx) => {
            row[header] = values[idx] || '';
        });
        rows.push(row);
    }

    return { headers, rows };
}

/**
 * Normalize MT5 headers to standard field names for better auto-detection
 */
function normalizeMT5Headers(data: { headers: string[]; rows: ParsedRow[] }): { headers: string[]; rows: ParsedRow[] } {
    // MT5 column mapping to standardized names
    // IMPORTANT: In MT5 Deals table:
    // - 'Type' column contains buy/sell (the actual trade direction)
    // - 'Direction' column contains in/out (entry/exit markers, not trade direction!)
    const headerMap: Record<string, string> = {
        'Symbol': 'Symbol',
        'Type': 'Direction',            // buy/sell -> Long/Short (this is the actual direction!)
        'Direction': 'EntryType',       // in/out -> entry/exit markers (NOT trade direction!)
        'Volume': 'Lots',
        'Price': 'Entry',
        'Price_1': 'Exit',              // Second Price column is exit price
        'Profit': 'PnL',
        'Time': 'Date',
        'Time_1': 'CloseTime',
        'S / L': 'StopLoss',
        'S/L': 'StopLoss',
        'T / P': 'TakeProfit',
        'T/P': 'TakeProfit',
        'Position': 'Ticket',
        'Deal': 'Ticket',
        'Order': 'Ticket',
        'Commission': 'Commission',
        'Swap': 'Swap',
        'Comment': 'Notes',
    };

    // Create new headers with normalized names
    const newHeaders = data.headers.map(h => headerMap[h] || h);

    // Update rows with new header keys and transform values
    const newRows = data.rows.map(row => {
        const newRow: ParsedRow = {};
        data.headers.forEach((oldHeader, idx) => {
            const newHeader = newHeaders[idx];
            let value = row[oldHeader] || '';

            // Transform direction values
            // Note: In MT5 Deals table, values can be compound like 'buy in', 'sell out', etc.
            // Extract 'buy' or 'sell' from anywhere in the value
            if (newHeader === 'Direction') {
                const lower = value.toLowerCase();
                // Check if 'buy' appears anywhere in the string
                if (lower.includes('buy')) {
                    value = 'Long';
                    // Check if 'sell' appears anywhere in the string
                } else if (lower.includes('sell')) {
                    value = 'Short';
                }
                // 'in'/'out' alone without buy/sell are entry/exit markers - skip these rows
            }

            // Split MT5 'Time' (mapped to 'Date') into Date and Time fields
            // MT5 Time format: "2024.01.15 14:30:25"
            // If the value has a space, it likely contains both date and time
            if (newHeader === 'Date' && value.includes(' ')) {
                const parts = value.split(' ');
                // Parts[0] is date ("2024.01.15"), Parts[1] is time ("14:30:25")
                // Keep the date part in place for the 'Date' field
                newRow['Date'] = parts[0];
                // Add explicit Time field which convertToTrades will use
                newRow['Time'] = parts[1];
                return; // Skip default assignment since we handled it
            }

            newRow[newHeader] = value;
        });
        return newRow;
    });

    // Add 'Time' to headers if not present (since we added it to rows)
    if (!newHeaders.includes('Time')) {
        newHeaders.push('Time');
    }

    return { headers: newHeaders, rows: newRows };
}

/**
 * Fallback: Extract the largest table that looks like trade data
 */
function extractLargestTradeTable(html: string): { headers: string[]; rows: ParsedRow[] } {
    const tableMatches = html.match(/<table[^>]*>([\s\S]*?)<\/table>/gi) || [];

    let bestResult: { headers: string[]; rows: ParsedRow[] } = { headers: [], rows: [] };
    let bestScore = 0;

    for (const tableHtml of tableMatches) {
        const parsed = parseHTMLTable(tableHtml);

        // Score based on row count and having trade-like columns
        const hasSymbol = parsed.headers.some(h => /symbol|pair|instrument/i.test(h));
        const hasType = parsed.headers.some(h => /type|direction|side/i.test(h));
        const hasProfit = parsed.headers.some(h => /profit|pnl|result/i.test(h));
        const hasPrice = parsed.headers.some(h => /price|entry|open/i.test(h));

        const score = parsed.rows.length * (hasSymbol ? 2 : 1) * (hasType ? 2 : 1) * (hasProfit ? 2 : 1) * (hasPrice ? 2 : 1);

        if (score > bestScore) {
            bestScore = score;
            bestResult = parsed;
        }
    }

    return normalizeMT5Headers(bestResult);
}

// ============= FILE TYPE DETECTION =============

export type ImportFileType = 'csv' | 'html' | 'unknown';

export function detectFileType(content: string, filename: string): ImportFileType {
    const lowName = filename.toLowerCase();

    if (lowName.endsWith('.csv') || lowName.endsWith('.txt')) {
        return 'csv';
    }
    if (lowName.endsWith('.html') || lowName.endsWith('.htm')) {
        return 'html';
    }

    // Content-based detection
    if (content.trim().startsWith('<') && content.includes('</')) {
        return 'html';
    }
    if (content.includes(',') || content.includes('\t')) {
        return 'csv';
    }

    return 'unknown';
}

// ============= MT5 ACCOUNT INFO EXTRACTION =============

/**
 * Account info extracted from MT5 HTML report
 */
export interface MT5AccountInfo {
    name: string;           // e.g., "Alvin Marshall"
    accountNumber: string;  // e.g., "973451"
    broker: string;         // e.g., "Coinexx Limited"
    currency: string;       // e.g., "USD"
    accountType?: string;   // e.g., "real, Hedge"
    server?: string;        // e.g., "Coinexx-Live"
    reportDate?: string;    // e.g., "2025.12.08 17:30"
}

/**
 * Extract account metadata from MT5 Trade History Report HTML
 * Actual format: <title>973451: Alvin Marshall - Trade History Report</title>
 */
export function extractMT5AccountInfo(html: string): MT5AccountInfo | null {
    if (!html || !html.includes('Trade History Report')) {
        return null;
    }

    const info: MT5AccountInfo = {
        name: '',
        accountNumber: '',
        broker: '',
        currency: 'USD'
    };

    // Parse from title tag: "<title>973451: Alvin Marshall - Trade History Report</title>"
    const titleMatch = html.match(/<title>(\d+):\s*([^<-]+)\s*-\s*Trade History Report<\/title>/i);
    if (titleMatch) {
        info.accountNumber = titleMatch[1].trim();
        info.name = titleMatch[2].trim();
    }

    // Fallback: try to find account number in other places
    if (!info.accountNumber) {
        const accountMatch = html.match(/Account[:\s]*(\d{4,})/i);
        if (accountMatch) {
            info.accountNumber = accountMatch[1];
        }
    }

    // Extract broker - first try to find company name with suffix like "Limited", "LLC", etc.
    // Pattern: <b>Coinexx Limited</b> (anywhere in the HTML)
    const companyMatch = html.match(/<b>([^<]*(?:Limited|LLC|Inc|Corp|Ltd)[^<]*)<\/b>/i);
    if (companyMatch) {
        info.broker = companyMatch[1].trim();
    }

    // Fallback: Extract broker from <th> containing bold text (but exclude known non-broker text)
    if (!info.broker) {
        const thMatches = html.matchAll(/<th[^>]*>\s*<b>([^<]+)<\/b>\s*<\/th>/gi);
        for (const match of thMatches) {
            const text = match[1].trim();
            // Skip if it's a section header or the account holder name
            if (!text.includes('Trade History') &&
                !text.includes('Positions') &&
                !text.includes('Deals') &&
                !text.includes('Orders') &&
                text !== info.name) {
                info.broker = text;
                break;
            }
        }
    }

    // Try to extract currency from account string like "973451 (USD, ...)"
    const currencyMatch = html.match(/\d+\s*\(([A-Z]{3})/i);
    if (currencyMatch) {
        info.currency = currencyMatch[1].toUpperCase();
    }

    // Only return if we found at least name or account number
    if (info.name || info.accountNumber) {
        return info;
    }

    return null;
}

// ============= MAIN IMPORT FUNCTION =============

export interface ImportFileResult {
    headers: string[];
    rows: ParsedRow[];
    fileType: ImportFileType;
    accountInfo?: MT5AccountInfo | null;
    balanceOperations?: BalanceOperation[];
    startingBalance?: number;
}

/**
 * Extract balance operations (deposits/withdrawals) from MT5 Deals table
 * The first row with a balance value represents the initial deposit
 */
export function extractBalanceOperations(html: string): { operations: BalanceOperation[], startingBalance: number } {
    const operations: BalanceOperation[] = [];
    let startingBalance = 0;

    // Parse the Deals table
    const dealsData = extractMT5Table(html, 'Deals');
    if (dealsData.rows.length === 0) {
        return { operations, startingBalance };
    }

    // Find columns - looking for: Time, Type, Direction, Profit, Balance, Comment
    const headers = dealsData.headers.map(h => h.toLowerCase());
    const timeIdx = headers.findIndex(h => h.includes('time'));
    const typeIdx = headers.findIndex(h => h === 'type');
    const profitIdx = headers.findIndex(h => h.includes('profit'));
    const balanceIdx = headers.findIndex(h => h.includes('balance'));
    const commentIdx = headers.findIndex(h => h.includes('comment') || h.includes('notes'));

    // Look for the first balance value - this represents initial deposit
    for (const row of dealsData.rows) {
        const values = Object.values(row);
        const balance = balanceIdx >= 0 ? parseFloat(values[balanceIdx]?.replace(/[^0-9.-]/g, '') || '0') : 0;
        const comment = commentIdx >= 0 ? (values[commentIdx] || '').toLowerCase() : '';
        const type = typeIdx >= 0 ? (values[typeIdx] || '').toLowerCase() : '';
        const profit = profitIdx >= 0 ? parseFloat(values[profitIdx]?.replace(/[^0-9.-]/g, '') || '0') : 0;
        const dateStr = timeIdx >= 0 ? values[timeIdx] || '' : '';

        // Check if this is a balance operation (deposit/withdrawal)
        const isDeposit = type === 'balance' || comment.includes('deposit');
        const isWithdrawal = comment.includes('withdrawal');

        if (balance > 0 && (isDeposit || isWithdrawal || startingBalance === 0)) {
            // Parse date
            let date = '';
            let ts = 0;
            if (dateStr) {
                const dateMatch = dateStr.match(/(\d{4})[.\-/](\d{2})[.\-/](\d{2})/);
                if (dateMatch) {
                    date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
                    ts = new Date(dateStr.replace(/\./g, '-').replace(' ', 'T')).getTime() || Date.now();
                }
            }

            // First row with positive balance is typically the first deposit
            if (startingBalance === 0) {
                // For deposits, the balance column IS the deposit amount (it's the running balance after deposit)
                startingBalance = balance;
                operations.push({
                    id: `bal-${Date.now()}-0`,
                    type: 'deposit',
                    amount: balance,
                    date,
                    ts,
                    balance,
                    comment: comment || 'Initial Deposit'
                });
            } else if (isDeposit && profit > 0) {
                operations.push({
                    id: `bal-${Date.now()}-${operations.length}`,
                    type: 'deposit',
                    amount: profit,
                    date,
                    ts,
                    balance,
                    comment
                });
            } else if (isWithdrawal) {
                operations.push({
                    id: `bal-${Date.now()}-${operations.length}`,
                    type: 'withdrawal',
                    amount: Math.abs(profit),
                    date,
                    ts,
                    balance,
                    comment
                });
            }
        }
    }

    // Sort by timestamp
    operations.sort((a, b) => a.ts - b.ts);

    return { operations, startingBalance };
}

/**
 * Main import function - handles both CSV and HTML
 */
export function importFile(
    content: string,
    filename: string
): ImportFileResult {
    const fileType = detectFileType(content, filename);

    if (fileType === 'html') {
        const accountInfo = extractMT5AccountInfo(content);
        const { operations, startingBalance } = extractBalanceOperations(content);
        return {
            ...parseMT4HTML(content),
            fileType,
            accountInfo,
            balanceOperations: operations,
            startingBalance
        };
    }

    return { ...parseCSV(content), fileType, accountInfo: null, balanceOperations: [], startingBalance: 0 };
}

