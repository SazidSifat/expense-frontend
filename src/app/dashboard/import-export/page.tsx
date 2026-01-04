'use client';

import { useState } from 'react';
import { Upload, Download, FileSpreadsheet, FileText, CheckCircle, AlertCircle, FileDown } from 'lucide-react';
import { importExcel, exportExcel, exportCSV, getExpenses, getSettlements } from '@/lib/api';
import { pdf } from '@react-pdf/renderer';
import MonthlyReportPDF from '@/components/MonthlyReportPDF';

export default function ImportExportPage() {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<{
        success: boolean;
        message: string;
        data?: { totalRows: number; expensesImported: number; incomesImported: number };
    } | null>(null);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [isExporting, setIsExporting] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
            setImportResult(null);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setImportResult(null);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setIsImporting(true);
        setImportResult(null);

        try {
            const response = await importExcel(file);
            setImportResult({
                success: true,
                message: 'Import completed successfully!',
                data: response.data.data,
            });
            setFile(null);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setImportResult({
                success: false,
                message: error.response?.data?.message || 'Import failed. Please check your file format.',
            });
        } finally {
            setIsImporting(false);
        }
    };

    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const response = await exportExcel({ month, year });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `expense-report-${year}-${String(month).padStart(2, '0')}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportCSV = async (type: 'expenses' | 'income') => {
        setIsExporting(true);
        try {
            const response = await exportCSV({ month, year, type });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}-report-${year}-${String(month).padStart(2, '0')}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            // Fetch expenses and settlements for the selected month
            const [expensesRes, settlementsRes] = await Promise.all([
                getExpenses({ month, year }),
                getSettlements({ month, year })
            ]);

            // Backend returns expenses directly in data, settlements in data.settlements
            const expenses = Array.isArray(expensesRes.data.data) ? expensesRes.data.data : [];
            const settlementsData = settlementsRes.data.data;
            const settlements = Array.isArray(settlementsData) ? settlementsData : (settlementsData?.settlements || []);

            // Generate PDF using react-pdf
            const blob = await pdf(
                <MonthlyReportPDF
                    month={month}
                    year={year}
                    expenses={expenses}
                    settlements={settlements}
                />
            ).toBlob();

            // Download the PDF
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `monthly-report-${year}-${String(month).padStart(2, '0')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('PDF export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Import / Export</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Import data from Excel/ODS files or export your records
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Import Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-blue-500" />
                        Import Data
                    </h2>

                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragging
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600'
                            }`}
                    >
                        <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                            Drag and drop your Excel or ODS file here
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                            or
                        </p>
                        <label className="btn-secondary cursor-pointer inline-block">
                            Browse Files
                            <input
                                type="file"
                                accept=".xlsx,.xls,.ods,.csv"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {file && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FileSpreadsheet className="w-8 h-8 text-green-500" />
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {(file.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleImport}
                                    disabled={isImporting}
                                    className="btn-primary"
                                >
                                    {isImporting ? 'Importing...' : 'Import'}
                                </button>
                            </div>
                        </div>
                    )}

                    {importResult && (
                        <div className={`mt-4 p-4 rounded-xl ${importResult.success
                            ? 'bg-green-50 dark:bg-green-900/20'
                            : 'bg-red-50 dark:bg-red-900/20'
                            }`}>
                            <div className="flex items-start gap-3">
                                {importResult.success ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                )}
                                <div>
                                    <p className={`font-medium ${importResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                                        }`}>
                                        {importResult.message}
                                    </p>
                                    {importResult.data && (
                                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                            <p>Total rows processed: {importResult.data.totalRows}</p>
                                            <p>Expenses imported: {importResult.data.expensesImported}</p>
                                            <p>Income imported: {importResult.data.incomesImported}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Supported Formats</h3>
                        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                            <li>• Excel files (.xlsx, .xls)</li>
                            <li>• OpenDocument Spreadsheet (.ods)</li>
                            <li>• CSV files (.csv)</li>
                        </ul>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                            The system will auto-detect income vs expense and clean unnamed columns.
                        </p>
                    </div>
                </div>

                {/* Export Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Download className="w-5 h-5 text-green-500" />
                        Export Data
                    </h2>

                    {/* Date Range */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Period
                        </label>
                        <div className="flex gap-3">
                            <select
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                                className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2"
                            >
                                {months.map((m, i) => (
                                    <option key={m} value={i + 1}>{m}</option>
                                ))}
                            </select>
                            <select
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Export Options */}
                    <div className="space-y-4">
                        <button

                            // onClick={handleExportExcel}
                            disabled={isExporting}
                            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/25 transition-all disabled:opacity-50"
                        >
                            <div className="flex items-center gap-3">
                                <FileSpreadsheet className="w-6 h-6" />
                                <div className="text-left">
                                    <p className="font-semibold">Export as Excel</p>
                                    <p className="text-sm text-green-100">Complete report with all sheets</p>
                                </div>
                            </div>
                            <Download className="w-5 h-5" />
                        </button>

                        <button
                            // onClick={() => handleExportCSV('expenses')}
                            disabled={isExporting}
                            className="w-full flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all disabled:opacity-50"
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="w-6 h-6 text-red-500" />
                                <div className="text-left">
                                    <p className="font-semibold">Export Expenses as CSV</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Expenses only</p>
                                </div>
                            </div>
                            <Download className="w-5 h-5" />
                        </button>

                        <button
                            // onClick={() => handleExportCSV('income')}
                            disabled={isExporting}
                            className="w-full flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all disabled:opacity-50"
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="w-6 h-6 text-green-500" />
                                <div className="text-left">
                                    <p className="font-semibold">Export Income as CSV</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Income only</p>
                                </div>
                            </div>
                            <Download className="w-5 h-5" />
                        </button>

                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-50"
                        >
                            <div className="flex items-center gap-3">
                                <FileDown className="w-6 h-6" />
                                <div className="text-left">
                                    <p className="font-semibold">Download Monthly PDF Report</p>
                                    <p className="text-sm text-red-100">Expenses & Settlements summary</p>
                                </div>
                            </div>
                            <Download className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
