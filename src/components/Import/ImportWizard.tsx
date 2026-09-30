'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
    Upload,
    FileSpreadsheet,
    ArrowRight,
    ArrowLeft,
    Check,
    AlertTriangle,
    X,
    ChevronDown,
    Download,
    RefreshCw
} from 'lucide-react';
import { Trade, TradingAccount } from '../../types';
import {
    ColumnMapping,
    ImportResult,
    ParsedRow,
    importFile,
    detectColumnMappings,
    addSampleValues,
    convertToTrades,
    ImportFileType,
    MT5AccountInfo
} from '../../utils/importPipeline';
import { User } from 'lucide-react';

interface ImportWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (trades: Trade[], accountInfo?: MT5AccountInfo | null, startingBalance?: number) => void;
    darkMode?: boolean;
}

type WizardStep = 'upload' | 'map' | 'validate' | 'preview' | 'complete';

const TRADE_FIELDS: { key: keyof Trade; label: string; required: boolean }[] = [
    { key: 'pair', label: 'Symbol/Pair', required: true },
    { key: 'direction', label: 'Direction (Long/Short)', required: true },
    { key: 'entry', label: 'Entry Price', required: true },
    { key: 'exit', label: 'Exit Price', required: false },
    { key: 'pnl', label: 'P&L', required: true },
    { key: 'lots', label: 'Lot Size', required: false },
    { key: 'date', label: 'Date', required: false },
    { key: 'time', label: 'Time', required: false },
    { key: 'setup', label: 'Setup/Strategy', required: false },
    { key: 'emotion', label: 'Emotion/Mood', required: false },
    { key: 'notes', label: 'Notes', required: false },
    { key: 'sl', label: 'Stop Loss', required: false },
    { key: 'tp', label: 'Take Profit', required: false },
];

const ImportWizard: React.FC<ImportWizardProps> = ({
    isOpen,
    onClose,
    onImport,
    darkMode = false
}) => {
    const [step, setStep] = useState<WizardStep>('upload');
    const [fileName, setFileName] = useState('');
    const [fileType, setFileType] = useState<ImportFileType>('unknown');
    const [headers, setHeaders] = useState<string[]>([]);
    const [rows, setRows] = useState<ParsedRow[]>([]);
    const [mappings, setMappings] = useState<ColumnMapping[]>([]);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [accountInfo, setAccountInfo] = useState<MT5AccountInfo | null>(null);
    const [startingBalance, setStartingBalance] = useState<number>(0);

    // Reset wizard
    const reset = useCallback(() => {
        setStep('upload');
        setFileName('');
        setFileType('unknown');
        setHeaders([]);
        setRows([]);
        setMappings([]);
        setImportResult(null);
        setAccountInfo(null);
        setStartingBalance(0);
    }, []);

    // Handle file selection
    const handleFile = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const result = importFile(content, file.name);

                setFileName(file.name);
                setFileType(result.fileType);
                setHeaders(result.headers);
                setRows(result.rows);
                setAccountInfo(result.accountInfo || null);
                setStartingBalance(result.startingBalance || 0);

                // Auto-detect mappings
                const detectedMappings = detectColumnMappings(result.headers);
                const withSamples = addSampleValues(detectedMappings, result.rows);
                setMappings(withSamples);

                setStep('map');
            } catch (error) {
                console.error('Import error:', error);
                setImportResult({
                    success: false,
                    trades: [],
                    errors: [{ row: 0, column: 'file', value: '', message: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}` }],
                    warnings: [],
                    skippedRows: 0
                });
                setStep('validate');
            }
        };
        reader.onerror = () => {
            setImportResult({
                success: false,
                trades: [],
                errors: [{ row: 0, column: 'file', value: '', message: 'Failed to read file. Please try again.' }],
                warnings: [],
                skippedRows: 0
            });
            setStep('validate');
        };
        reader.readAsText(file);
    }, []);

    // File input handler
    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    // Drag and drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    // Update mapping
    const updateMapping = useCallback((sourceCol: string, targetField: keyof Trade | null) => {
        setMappings(prev => prev.map(m =>
            m.source === sourceCol ? { ...m, target: targetField } : m
        ));
    }, []);

    // Validate and proceed
    const handleValidate = useCallback(() => {
        const result = convertToTrades(rows, mappings);
        setImportResult(result);
        setStep('validate');
    }, [rows, mappings]);

    // Check if required fields are mapped
    const requiredFieldsMapped = useMemo(() => {
        const mapped = new Set(mappings.filter(m => m.target).map(m => m.target));
        return ['pair', 'direction', 'entry', 'pnl'].every(f => mapped.has(f as keyof Trade));
    }, [mappings]);

    // Final import
    const handleImport = useCallback(() => {
        if (importResult?.trades.length) {
            onImport(importResult.trades, accountInfo, startingBalance);
            setStep('complete');
            setTimeout(() => {
                reset();
                onClose();
            }, 2000);
        }
    }, [importResult, onImport, reset, onClose, accountInfo, startingBalance]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className={`w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                        <FileSpreadsheet className="text-blue-500" size={24} />
                        <div>
                            <h2 className="text-lg font-bold">Import Trades</h2>
                            <p className="text-sm text-slate-500">CSV or MT4/MT5 HTML export</p>
                        </div>
                    </div>
                    <button onClick={() => { reset(); onClose(); }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className={`flex items-center justify-center gap-2 p-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                    {['upload', 'map', 'validate', 'complete'].map((s, idx) => (
                        <React.Fragment key={s}>
                            <div className={`flex items-center gap-2 ${step === s ? 'text-blue-500' : 'text-slate-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === s ? 'bg-blue-500 text-white' :
                                    ['upload', 'map', 'validate', 'complete'].indexOf(step) > idx ? 'bg-green-500 text-white' :
                                        'bg-slate-200 dark:bg-slate-700'
                                    }`}>
                                    {['upload', 'map', 'validate', 'complete'].indexOf(step) > idx ? <Check size={16} /> : idx + 1}
                                </div>
                                <span className="text-sm font-medium capitalize hidden sm:inline">{s}</span>
                            </div>
                            {idx < 3 && <div className={`w-8 h-0.5 ${['upload', 'map', 'validate', 'complete'].indexOf(step) > idx ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                        </React.Fragment>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {/* Step 1: Upload */}
                    {step === 'upload' && (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-600'
                                }`}
                        >
                            <Upload size={48} className="mx-auto mb-4 text-slate-400" />
                            <h3 className="text-lg font-bold mb-2">Drop your file here</h3>
                            <p className="text-slate-500 mb-4">CSV, TXT, or MT4/MT5 HTML export</p>
                            <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-500 transition-colors">
                                <FileSpreadsheet size={20} />
                                Choose File
                                <input type="file" accept=".csv,.txt,.html,.htm" onChange={handleFileInput} className="hidden" />
                            </label>

                            <div className="mt-6 text-sm text-slate-500">
                                <p className="font-medium mb-2">Supported formats:</p>
                                <ul className="space-y-1">
                                    <li>• CSV with headers (comma, semicolon, or tab separated)</li>
                                    <li>• MT4/MT5 HTML trade history export</li>
                                    <li>• TXT files with trade data</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Map Columns */}
                    {step === 'map' && (
                        <div>
                            <div className="mb-4">
                                <p className="text-sm text-slate-500">
                                    File: <strong>{fileName}</strong> ({fileType.toUpperCase()}) • {rows.length} rows detected
                                </p>
                            </div>

                            {/* Account Info Card */}
                            {accountInfo && (accountInfo.name || accountInfo.accountNumber) && (
                                <div className={`mb-4 p-4 rounded-xl border-2 border-blue-200 ${darkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50'}`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`p-2 rounded-full ${darkMode ? 'bg-blue-800' : 'bg-blue-100'}`}>
                                            <User size={20} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-blue-800 dark:text-blue-200">Account Detected</h4>
                                            <p className="text-xs text-blue-600 dark:text-blue-300">This info will be saved to your profile</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        {accountInfo.name && (
                                            <div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">Name</div>
                                                <div className="font-medium">{accountInfo.name}</div>
                                            </div>
                                        )}
                                        {accountInfo.accountNumber && (
                                            <div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">Account</div>
                                                <div className="font-medium font-mono">{accountInfo.accountNumber}</div>
                                            </div>
                                        )}
                                        {accountInfo.broker && (
                                            <div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">Broker</div>
                                                <div className="font-medium">{accountInfo.broker}</div>
                                            </div>
                                        )}
                                        {accountInfo.currency && (
                                            <div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">Currency</div>
                                                <div className="font-medium">{accountInfo.currency}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                {mappings.map((mapping, index) => (
                                    <div key={`${mapping.source}-${index}`} className={`p-3 rounded-lg border ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <div className="text-sm font-medium">{mapping.source}</div>
                                                <div className="text-xs text-slate-500 truncate">
                                                    {mapping.sampleValues.slice(0, 2).join(', ') || 'No sample data'}
                                                </div>
                                            </div>
                                            <ArrowRight size={16} className="text-slate-400" />
                                            <select
                                                value={mapping.target || ''}
                                                onChange={(e) => updateMapping(mapping.source, e.target.value as keyof Trade || null)}
                                                className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300'
                                                    } ${mapping.target ? 'ring-2 ring-blue-500' : ''}`}
                                            >
                                                <option value="">Skip this column</option>
                                                {TRADE_FIELDS.map(field => (
                                                    <option key={field.key} value={field.key}>
                                                        {field.label} {field.required ? '*' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {!requiredFieldsMapped && (
                                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
                                    <AlertTriangle size={18} className="text-amber-600" />
                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                        Please map required fields: Symbol, Direction, Entry, and P&L
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Validate */}
                    {step === 'validate' && importResult && (
                        <div>
                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900/20' : 'bg-green-50'} border border-green-200 dark:border-green-800`}>
                                    <div className="text-2xl font-bold text-green-600">{importResult.trades.length}</div>
                                    <div className="text-sm text-green-700 dark:text-green-400">Valid Trades</div>
                                </div>
                                <div className={`p-4 rounded-lg ${darkMode ? 'bg-amber-900/20' : 'bg-amber-50'} border border-amber-200 dark:border-amber-800`}>
                                    <div className="text-2xl font-bold text-amber-600">{importResult.skippedRows}</div>
                                    <div className="text-sm text-amber-700 dark:text-amber-400">Skipped Rows</div>
                                </div>
                                <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900/20' : 'bg-red-50'} border border-red-200 dark:border-red-800`}>
                                    <div className="text-2xl font-bold text-red-600">{importResult.errors.length}</div>
                                    <div className="text-sm text-red-700 dark:text-red-400">Errors</div>
                                </div>
                            </div>

                            {/* Warnings */}
                            {importResult.warnings.length > 0 && (
                                <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-amber-900/20' : 'bg-amber-50'} border border-amber-200 dark:border-amber-800`}>
                                    {importResult.warnings.map((w, i) => (
                                        <p key={i} className="text-sm text-amber-800 dark:text-amber-200">⚠️ {w}</p>
                                    ))}
                                </div>
                            )}

                            {/* Errors (first 10) */}
                            {importResult.errors.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-bold mb-2">Errors (showing first 10):</h4>
                                    <div className={`max-h-40 overflow-y-auto rounded-lg border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                                        <table className="w-full text-sm">
                                            <thead className={`${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                                <tr>
                                                    <th className="px-3 py-2 text-left">Row</th>
                                                    <th className="px-3 py-2 text-left">Column</th>
                                                    <th className="px-3 py-2 text-left">Value</th>
                                                    <th className="px-3 py-2 text-left">Error</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importResult.errors.slice(0, 10).map((err, i) => (
                                                    <tr key={i} className={`border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                                                        <td className="px-3 py-2">{err.row}</td>
                                                        <td className="px-3 py-2">{err.column}</td>
                                                        <td className="px-3 py-2 text-slate-500">{err.value || '-'}</td>
                                                        <td className="px-3 py-2 text-red-600">{err.message}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Preview (first 5 trades) */}
                            {importResult.trades.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold mb-2">Preview (first 5 trades):</h4>
                                    <div className={`overflow-x-auto rounded-lg border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                                        <table className="w-full text-sm">
                                            <thead className={`${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                                <tr>
                                                    <th className="px-3 py-2 text-left">Date</th>
                                                    <th className="px-3 py-2 text-left">Pair</th>
                                                    <th className="px-3 py-2 text-left">Dir</th>
                                                    <th className="px-3 py-2 text-right">Entry</th>
                                                    <th className="px-3 py-2 text-right">P&L</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importResult.trades.slice(0, 5).map((trade, i) => (
                                                    <tr key={i} className={`border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                                                        <td className="px-3 py-2">{trade.date}</td>
                                                        <td className="px-3 py-2 font-medium">{trade.pair}</td>
                                                        <td className={`px-3 py-2 ${trade.direction === 'Long' ? 'text-green-600' : 'text-red-600'}`}>{trade.direction}</td>
                                                        <td className="px-3 py-2 text-right">{trade.entry.toFixed(5)}</td>
                                                        <td className={`px-3 py-2 text-right font-bold ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Complete */}
                    {step === 'complete' && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check size={32} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Import Complete!</h3>
                            <p className="text-slate-500">
                                {importResult?.trades.length || 0} trades have been imported successfully.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`flex items-center justify-between p-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                    <div>
                        {step !== 'upload' && step !== 'complete' && (
                            <button
                                onClick={() => setStep(step === 'validate' ? 'map' : 'upload')}
                                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2"
                            >
                                <ArrowLeft size={18} /> Back
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {step === 'map' && (
                            <button
                                onClick={handleValidate}
                                disabled={!requiredFieldsMapped}
                                className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${requiredFieldsMapped
                                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                Validate <ArrowRight size={18} />
                            </button>
                        )}
                        {step === 'validate' && importResult && importResult.trades.length > 0 && (
                            <button
                                onClick={handleImport}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-green-500"
                            >
                                Import {importResult.trades.length} Trades <Check size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportWizard;
