/**
 * Report Export Utilities
 * Exports trade data to CSV and PDF formats
 */

import { Trade } from '../types';
import {
    calculateSummary,
    expectancyBySetup,
    getSessionFromTrade
} from './analyticsEngine';

// ============= CSV EXPORT =============

/**
 * Converts trades to CSV format
 */
export function tradesToCSV(trades: Trade[]): string {
    if (trades.length === 0) return '';

    // Headers
    const headers = [
        'Date',
        'Time',
        'Symbol',
        'Direction',
        'Entry',
        'Exit',
        'Stop Loss',
        'Take Profit',
        'Size',
        'P&L',
        'Result',
        'Setup',
        'Session',
        'Emotion',
        'Notes'
    ];

    // Rows
    const rows = trades.map(trade => [
        trade.date,
        trade.time || '',
        trade.pair,
        trade.direction,
        trade.entry?.toString() || '',
        trade.exit?.toString() || '',
        trade.sl?.toString() || '',
        trade.tp?.toString() || '',
        trade.lots?.toString() || '',
        trade.pnl.toFixed(2),
        trade.pnl >= 0 ? 'Win' : 'Loss',
        trade.setup || '',
        trade.sessionType || getSessionFromTrade(trade),
        trade.emotion || '',
        (trade.notes || '').replace(/,/g, ';').replace(/\n/g, ' ')
    ]);

    // Combine
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
}

/**
 * Downloads CSV file
 */
export function downloadCSV(trades: Trade[], filename: string = 'trades'): void {
    const csv = tradesToCSV(trades);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${formatDate(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

// ============= REPORT GENERATION =============

export interface ReportData {
    title: string;
    dateRange: { from: string; to: string };
    summary: ReturnType<typeof calculateSummary>;
    setupStats: ReturnType<typeof expectancyBySetup>;
    sessionStats: { session: string; trades: number; pnl: number; winRate: number }[];
    topWins: Trade[];
    topLosses: Trade[];
    totalTrades: number;
    generatedAt: string;
}

/**
 * Generates comprehensive report data
 */
export function generateReportData(
    trades: Trade[],
    dateRange?: { from: Date; to: Date }
): ReportData {
    let filteredTrades = trades;

    if (dateRange) {
        filteredTrades = trades.filter(t => {
            const tradeDate = new Date(t.date);
            return tradeDate >= dateRange.from && tradeDate <= dateRange.to;
        });
    }

    // Calculate all metrics
    const summary = calculateSummary(filteredTrades);
    const setupStats = expectancyBySetup(filteredTrades);

    // Session breakdown
    const sessionMap = new Map<string, { trades: number; pnl: number; wins: number }>();
    filteredTrades.forEach(trade => {
        const session = getSessionFromTrade(trade);
        if (!sessionMap.has(session)) {
            sessionMap.set(session, { trades: 0, pnl: 0, wins: 0 });
        }
        const stats = sessionMap.get(session)!;
        stats.trades++;
        stats.pnl += trade.pnl;
        if (trade.pnl > 0) stats.wins++;
    });

    const sessionStats = Array.from(sessionMap.entries()).map(([session, stats]) => ({
        session,
        trades: stats.trades,
        pnl: stats.pnl,
        winRate: stats.trades > 0 ? stats.wins / stats.trades : 0
    }));

    // Top trades
    const sortedByPnL = [...filteredTrades].sort((a, b) => b.pnl - a.pnl);
    const topWins = sortedByPnL.slice(0, 5);
    const topLosses = sortedByPnL.slice(-5).reverse();

    // Date range
    const dates = filteredTrades.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());

    return {
        title: 'Trading Performance Report',
        dateRange: {
            from: dates[0] ? formatDate(dates[0]) : 'N/A',
            to: dates[dates.length - 1] ? formatDate(dates[dates.length - 1]) : 'N/A'
        },
        summary,
        setupStats,
        sessionStats,
        topWins,
        topLosses,
        totalTrades: filteredTrades.length,
        generatedAt: new Date().toISOString()
    };
}

/**
 * Generates HTML report for printing/PDF
 */
export function generateReportHTML(data: ReportData): string {
    const { summary, setupStats, sessionStats, topWins, topLosses } = data;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${data.title} | RetailBeastFX</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a; 
            color: #e2e8f0;
            padding: 40px;
            line-height: 1.6;
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #334155;
        }
        .logo { font-size: 32px; font-weight: bold; color: #22c55e; }
        .subtitle { color: #94a3b8; margin-top: 8px; }
        .date-range { 
            background: #1e293b; 
            padding: 12px 24px; 
            border-radius: 8px; 
            display: inline-block;
            margin-top: 16px;
        }
        .section { 
            margin-bottom: 32px; 
            background: #1e293b;
            border-radius: 12px;
            padding: 24px;
        }
        .section-title { 
            font-size: 18px; 
            font-weight: bold; 
            margin-bottom: 16px;
            color: #22c55e;
        }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 16px; 
        }
        .stat-card { 
            background: #0f172a;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-value { 
            font-size: 24px; 
            font-weight: bold; 
            color: white;
        }
        .stat-label { 
            font-size: 12px; 
            color: #64748b;
            text-transform: uppercase;
            margin-top: 4px;
        }
        .positive { color: #22c55e; }
        .negative { color: #ef4444; }
        table { width: 100%; border-collapse: collapse; }
        th, td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #334155;
        }
        th { 
            background: #0f172a; 
            font-weight: 600;
            color: #94a3b8;
            text-transform: uppercase;
            font-size: 11px;
        }
        .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px;
            border-top: 1px solid #334155;
            color: #64748b;
            font-size: 12px;
        }
        @media print {
            body { background: white; color: #0f172a; }
            .section { background: #f8fafc; }
            .stat-card { background: #e2e8f0; }
            .stat-value { color: #0f172a; }
            th { background: #e2e8f0; color: #475569; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🐻 RetailBeastFX</div>
        <div class="subtitle">${data.title}</div>
        <div class="date-range">
            ${data.dateRange.from} — ${data.dateRange.to}
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">📊 Performance Summary</div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${data.totalTrades}</div>
                <div class="stat-label">Total Trades</div>
            </div>
            <div class="stat-card">
                <div class="stat-value ${summary.winRate >= 0.5 ? 'positive' : 'negative'}">${(summary.winRate * 100).toFixed(1)}%</div>
                <div class="stat-label">Win Rate</div>
            </div>
            <div class="stat-card">
                <div class="stat-value ${summary.profitFactor >= 1 ? 'positive' : 'negative'}">${summary.profitFactor.toFixed(2)}</div>
                <div class="stat-label">Profit Factor</div>
            </div>
            <div class="stat-card">
                <div class="stat-value ${summary.expectancy >= 0 ? 'positive' : 'negative'}">${summary.expectancy >= 0 ? '+' : ''}${summary.expectancy.toFixed(2)}R</div>
                <div class="stat-label">Expectancy</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">🎯 Setup Performance</div>
        <table>
            <thead>
                <tr>
                    <th>Setup</th>
                    <th>Trades</th>
                    <th>Win Rate</th>
                    <th>Expectancy</th>
                    <th>Total P&L</th>
                </tr>
            </thead>
            <tbody>
                ${setupStats.slice(0, 6).map(s => `
                    <tr>
                        <td>${s.setup}</td>
                        <td>${s.trades}</td>
                        <td class="${s.winRate >= 0.5 ? 'positive' : 'negative'}">${(s.winRate * 100).toFixed(0)}%</td>
                        <td class="${s.expectancy >= 0 ? 'positive' : 'negative'}">${s.expectancy >= 0 ? '+' : ''}${s.expectancy.toFixed(2)}R</td>
                        <td class="${s.totalPnL >= 0 ? 'positive' : 'negative'}">$${s.totalPnL >= 0 ? '+' : ''}${s.totalPnL.toFixed(0)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <div class="section">
        <div class="section-title">⏰ Session Breakdown</div>
        <table>
            <thead>
                <tr>
                    <th>Session</th>
                    <th>Trades</th>
                    <th>Win Rate</th>
                    <th>Total P&L</th>
                </tr>
            </thead>
            <tbody>
                ${sessionStats.map(s => `
                    <tr>
                        <td>${s.session}</td>
                        <td>${s.trades}</td>
                        <td class="${s.winRate >= 0.5 ? 'positive' : 'negative'}">${(s.winRate * 100).toFixed(0)}%</td>
                        <td class="${s.pnl >= 0 ? 'positive' : 'negative'}">$${s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(0)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <div class="section">
        <div class="section-title">🏆 Top Wins</div>
        <table>
            <thead>
                <tr><th>Date</th><th>Symbol</th><th>Setup</th><th>P&L</th></tr>
            </thead>
            <tbody>
                ${topWins.map(t => `
                    <tr>
                        <td>${t.date}</td>
                        <td>${t.pair}</td>
                        <td>${t.setup || '—'}</td>
                        <td class="positive">+$${t.pnl.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <div class="section">
        <div class="section-title">💀 Top Losses</div>
        <table>
            <thead>
                <tr><th>Date</th><th>Symbol</th><th>Setup</th><th>P&L</th></tr>
            </thead>
            <tbody>
                ${topLosses.map(t => `
                    <tr>
                        <td>${t.date}</td>
                        <td>${t.pair}</td>
                        <td>${t.setup || '—'}</td>
                        <td class="negative">$${t.pnl.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <div class="footer">
        Generated by RetailBeastFX Journal • ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
    </div>
</body>
</html>`;
}

/**
 * Opens print dialog for PDF generation
 */
export function printReport(trades: Trade[], dateRange?: { from: Date; to: Date }): void {
    const data = generateReportData(trades, dateRange);
    const html = generateReportHTML(data);

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();

        // Wait for styles to load before printing
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
}

// ============= HELPERS =============

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}
