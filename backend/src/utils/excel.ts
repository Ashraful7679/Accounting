import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export const generateExcelReport = (
    sheetName: string,
    data: any[],
    columns: string[]
): Buffer => {
    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Convert data to worksheet format
    const worksheetData = [
        columns, // Header row
        ...data.map(row => columns.map(col => row[col])),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
};

export const generateMultiSheetExcel = (
    sheets: Array<{
        name: string;
        data: any[];
        columns: string[];
    }>
): Buffer => {
    const workbook = XLSX.utils.book_new();

    for (const sheet of sheets) {
        const worksheetData = [
            sheet.columns,
            ...sheet.data.map(row => sheet.columns.map(col => row[col])),
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
};

export const generateTrialBalanceExcel = (trialBalanceData: any): Buffer => {
    const data = trialBalanceData.accounts.map((account: any) => ({
        'Account Code': account.account.code,
        'Account Name': account.account.name,
        'Account Type': account.account.accountType.name,
        'Debit': account.totalDebit,
        'Credit': account.totalCredit,
        'Balance': account.balance,
    }));

    // Add totals row
    data.push({
        'Account Code': '',
        'Account Name': 'TOTAL',
        'Account Type': '',
        'Debit': trialBalanceData.totals.totalDebit,
        'Credit': trialBalanceData.totals.totalCredit,
        'Balance': '',
    });

    return generateExcelReport(
        'Trial Balance',
        data,
        ['Account Code', 'Account Name', 'Account Type', 'Debit', 'Credit', 'Balance']
    );
};
