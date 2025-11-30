import prisma from '../config/database';
import { AccountingError } from './errors';

/**
 * Validates that total debits equal total credits
 */
export const validateDebitCreditBalance = (
    lines: Array<{ debit: number; credit: number }>
): boolean => {
    const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);

    // Allow for small floating point differences
    const difference = Math.abs(totalDebit - totalCredit);
    return difference < 0.01;
};

/**
 * Validates that a journal entry has at least 2 lines
 */
export const validateMinimumLines = (lines: Array<any>): boolean => {
    return lines.length >= 2;
};

/**
 * Check if a date is within a locked fiscal year
 */
export const isDateInLockedFiscalYear = async (date: Date): Promise<boolean> => {
    const fiscalYear = await prisma.fiscalYear.findFirst({
        where: {
            startDate: { lte: date },
            endDate: { gte: date },
            isLocked: true,
        },
    });

    return !!fiscalYear;
};

/**
 * Post journal entry to ledger
 */
export const postJournalEntryToLedger = async (journalEntryId: string) => {
    const journalEntry = await prisma.journalEntry.findUnique({
        where: { id: journalEntryId },
        include: { lines: true },
    });

    if (!journalEntry) {
        throw new AccountingError('Journal entry not found');
    }

    if (journalEntry.status === 'POSTED') {
        throw new AccountingError('Journal entry is already posted');
    }

    // Validate debit = credit
    if (!validateDebitCreditBalance(journalEntry.lines)) {
        throw new AccountingError('Total debits must equal total credits');
    }

    // Check if date is in locked fiscal year
    if (await isDateInLockedFiscalYear(journalEntry.date)) {
        throw new AccountingError('Cannot post to a locked fiscal year');
    }

    // Post to ledger
    for (const line of journalEntry.lines) {
        // Get current account balance
        const account = await prisma.account.findUnique({
            where: { id: line.accountId },
        });

        if (!account) {
            throw new AccountingError(`Account not found: ${line.accountId}`);
        }

        // Calculate new balance based on account type
        const balanceChange = line.debit - line.credit;
        const newBalance = account.currentBalance + balanceChange;

        // Create ledger entry
        await prisma.ledger.create({
            data: {
                accountId: line.accountId,
                date: journalEntry.date,
                description: line.description || journalEntry.description,
                reference: journalEntry.reference || journalEntry.entryNumber,
                debit: line.debit,
                credit: line.credit,
                balance: newBalance,
                journalEntryId: journalEntry.id,
            },
        });

        // Update account balance
        await prisma.account.update({
            where: { id: line.accountId },
            data: { currentBalance: newBalance },
        });
    }

    // Update journal entry status
    await prisma.journalEntry.update({
        where: { id: journalEntryId },
        data: { status: 'POSTED' },
    });
};

/**
 * Create auto-posting journal entry for invoice
 */
export const createInvoiceJournalEntry = async (
    invoiceId: string,
    userId: string
) => {
    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
            items: true,
            customer: true,
        },
    });

    if (!invoice) {
        throw new AccountingError('Invoice not found');
    }

    // Get accounts from settings
    const arAccount = await getAccountByCode('1200'); // Accounts Receivable
    const salesAccount = await getAccountByCode('4000'); // Sales Revenue
    const taxPayableAccount = await getAccountByCode('2100'); // Tax Payable

    if (!arAccount || !salesAccount) {
        throw new AccountingError('Required accounts not found. Please setup chart of accounts.');
    }

    // Generate journal entry number
    const entryNumber = await generateJournalEntryNumber();

    // Create journal entry
    const journalEntry = await prisma.journalEntry.create({
        data: {
            entryNumber,
            date: invoice.date,
            description: `Sales Invoice ${invoice.invoiceNumber} - ${invoice.customer.name}`,
            reference: invoice.invoiceNumber,
            status: 'DRAFT',
            createdById: userId,
            lines: {
                create: [
                    // Dr. Accounts Receivable
                    {
                        accountId: arAccount.id,
                        debit: invoice.total,
                        credit: 0,
                        description: `Invoice ${invoice.invoiceNumber}`,
                    },
                    // Cr. Sales Revenue
                    {
                        accountId: salesAccount.id,
                        debit: 0,
                        credit: invoice.subtotal,
                        description: `Invoice ${invoice.invoiceNumber}`,
                    },
                    // Cr. Tax Payable (if applicable)
                    ...(invoice.taxAmount > 0 && taxPayableAccount
                        ? [
                            {
                                accountId: taxPayableAccount.id,
                                debit: 0,
                                credit: invoice.taxAmount,
                                description: `Tax on Invoice ${invoice.invoiceNumber}`,
                            },
                        ]
                        : []),
                ],
            },
        },
    });

    // Auto-post the journal entry
    await postJournalEntryToLedger(journalEntry.id);

    // Update invoice with journal entry reference
    await prisma.invoice.update({
        where: { id: invoiceId },
        data: { journalEntryId: journalEntry.id },
    });

    return journalEntry;
};

/**
 * Create auto-posting journal entry for bill
 */
export const createBillJournalEntry = async (
    billId: string,
    userId: string
) => {
    const bill = await prisma.bill.findUnique({
        where: { id: billId },
        include: {
            items: true,
            vendor: true,
        },
    });

    if (!bill) {
        throw new AccountingError('Bill not found');
    }

    // Get accounts
    const apAccount = await getAccountByCode('2000'); // Accounts Payable
    const expenseAccount = await getAccountByCode('5000'); // Expenses
    const taxPaidAccount = await getAccountByCode('1300'); // Tax Paid

    if (!apAccount || !expenseAccount) {
        throw new AccountingError('Required accounts not found. Please setup chart of accounts.');
    }

    const entryNumber = await generateJournalEntryNumber();

    const journalEntry = await prisma.journalEntry.create({
        data: {
            entryNumber,
            date: bill.date,
            description: `Purchase Bill ${bill.billNumber} - ${bill.vendor.name}`,
            reference: bill.billNumber,
            status: 'DRAFT',
            createdById: userId,
            lines: {
                create: [
                    // Dr. Expense
                    {
                        accountId: expenseAccount.id,
                        debit: bill.subtotal,
                        credit: 0,
                        description: `Bill ${bill.billNumber}`,
                    },
                    // Dr. Tax Paid (if applicable)
                    ...(bill.taxAmount > 0 && taxPaidAccount
                        ? [
                            {
                                accountId: taxPaidAccount.id,
                                debit: bill.taxAmount,
                                credit: 0,
                                description: `Tax on Bill ${bill.billNumber}`,
                            },
                        ]
                        : []),
                    // Cr. Accounts Payable
                    {
                        accountId: apAccount.id,
                        debit: 0,
                        credit: bill.total,
                        description: `Bill ${bill.billNumber}`,
                    },
                ],
            },
        },
    });

    await postJournalEntryToLedger(journalEntry.id);

    await prisma.bill.update({
        where: { id: billId },
        data: { journalEntryId: journalEntry.id },
    });

    return journalEntry;
};

/**
 * Create journal entry for payment received
 */
export const createPaymentReceivedJournalEntry = async (
    paymentId: string,
    userId: string
) => {
    const payment = await prisma.paymentReceived.findUnique({
        where: { id: paymentId },
        include: {
            customer: true,
            bankAccount: true,
        },
    });

    if (!payment) {
        throw new AccountingError('Payment not found');
    }

    const arAccount = await getAccountByCode('1200'); // Accounts Receivable
    const bankAccountId = payment.bankAccount?.accountId;

    if (!arAccount || !bankAccountId) {
        throw new AccountingError('Required accounts not found');
    }

    const entryNumber = await generateJournalEntryNumber();

    const journalEntry = await prisma.journalEntry.create({
        data: {
            entryNumber,
            date: payment.date,
            description: `Payment from ${payment.customer.name}`,
            reference: payment.paymentNumber,
            status: 'DRAFT',
            createdById: userId,
            lines: {
                create: [
                    // Dr. Bank
                    {
                        accountId: bankAccountId,
                        debit: payment.amount,
                        credit: 0,
                        description: `Payment ${payment.paymentNumber}`,
                    },
                    // Cr. Accounts Receivable
                    {
                        accountId: arAccount.id,
                        debit: 0,
                        credit: payment.amount,
                        description: `Payment ${payment.paymentNumber}`,
                    },
                ],
            },
        },
    });

    await postJournalEntryToLedger(journalEntry.id);

    await prisma.paymentReceived.update({
        where: { id: paymentId },
        data: { journalEntryId: journalEntry.id },
    });

    return journalEntry;
};

/**
 * Create journal entry for payment made
 */
export const createPaymentMadeJournalEntry = async (
    paymentId: string,
    userId: string
) => {
    const payment = await prisma.paymentMade.findUnique({
        where: { id: paymentId },
        include: {
            vendor: true,
            bankAccount: true,
        },
    });

    if (!payment) {
        throw new AccountingError('Payment not found');
    }

    const apAccount = await getAccountByCode('2000'); // Accounts Payable
    const bankAccountId = payment.bankAccount?.accountId;

    if (!apAccount || !bankAccountId) {
        throw new AccountingError('Required accounts not found');
    }

    const entryNumber = await generateJournalEntryNumber();

    const journalEntry = await prisma.journalEntry.create({
        data: {
            entryNumber,
            date: payment.date,
            description: `Payment to ${payment.vendor.name}`,
            reference: payment.paymentNumber,
            status: 'DRAFT',
            createdById: userId,
            lines: {
                create: [
                    // Dr. Accounts Payable
                    {
                        accountId: apAccount.id,
                        debit: payment.amount,
                        credit: 0,
                        description: `Payment ${payment.paymentNumber}`,
                    },
                    // Cr. Bank
                    {
                        accountId: bankAccountId,
                        debit: 0,
                        credit: payment.amount,
                        description: `Payment ${payment.paymentNumber}`,
                    },
                ],
            },
        },
    });

    await postJournalEntryToLedger(journalEntry.id);

    await prisma.paymentMade.update({
        where: { id: paymentId },
        data: { journalEntryId: journalEntry.id },
    });

    return journalEntry;
};

/**
 * Calculate trial balance
 */
export const calculateTrialBalance = async (asOfDate?: Date) => {
    const whereClause = asOfDate ? { date: { lte: asOfDate } } : {};

    const ledgerEntries = await prisma.ledger.findMany({
        where: whereClause,
        include: {
            account: {
                include: {
                    accountType: true,
                },
            },
        },
    });

    // Group by account
    const accountBalances = new Map<
        string,
        {
            account: any;
            totalDebit: number;
            totalCredit: number;
            balance: number;
        }
    >();

    for (const entry of ledgerEntries) {
        const existing = accountBalances.get(entry.accountId) || {
            account: entry.account,
            totalDebit: 0,
            totalCredit: 0,
            balance: 0,
        };

        existing.totalDebit += entry.debit;
        existing.totalCredit += entry.credit;
        existing.balance = existing.totalDebit - existing.totalCredit;

        accountBalances.set(entry.accountId, existing);
    }

    const trialBalance = Array.from(accountBalances.values());

    // Calculate totals
    const totals = trialBalance.reduce(
        (acc: any, item: any) => ({
            totalDebit: acc.totalDebit + item.totalDebit,
            totalCredit: acc.totalCredit + item.totalCredit,
        }),
        { totalDebit: 0, totalCredit: 0 }
    );

    return {
        accounts: trialBalance,
        totals,
        isBalanced: Math.abs(totals.totalDebit - totals.totalCredit) < 0.01,
    };
};

/**
 * Year-end closing
 */
export const performYearEndClosing = async (
    fiscalYearId: string,
    userId: string
) => {
    const fiscalYear = await prisma.fiscalYear.findUnique({
        where: { id: fiscalYearId },
    });

    if (!fiscalYear) {
        throw new AccountingError('Fiscal year not found');
    }

    if (fiscalYear.isClosed) {
        throw new AccountingError('Fiscal year is already closed');
    }

    // Get retained earnings account
    const retainedEarnings = await getAccountByCode('3100');
    if (!retainedEarnings) {
        throw new AccountingError('Retained earnings account not found');
    }

    // Get all revenue and expense accounts
    const revenueAccounts = await prisma.account.findMany({
        where: {
            accountType: {
                type: 'REVENUE',
            },
        },
        include: {
            ledgerEntries: {
                where: {
                    date: {
                        gte: fiscalYear.startDate,
                        lte: fiscalYear.endDate,
                    },
                },
            },
        },
    });

    const expenseAccounts = await prisma.account.findMany({
        where: {
            accountType: {
                type: 'EXPENSE',
            },
        },
        include: {
            ledgerEntries: {
                where: {
                    date: {
                        gte: fiscalYear.startDate,
                        lte: fiscalYear.endDate,
                    },
                },
            },
        },
    });

    const entryNumber = await generateJournalEntryNumber();
    const closingLines: any[] = [];

    // Close revenue accounts (Dr. Revenue, Cr. Retained Earnings)
    for (const account of revenueAccounts) {
        const balance = account.ledgerEntries.reduce(
            (sum: number, entry: any) => sum + entry.credit - entry.debit,
            0
        );

        if (balance !== 0) {
            closingLines.push({
                accountId: account.id,
                debit: balance,
                credit: 0,
                description: `Closing ${account.name}`,
            });
        }
    }

    // Close expense accounts (Dr. Retained Earnings, Cr. Expense)
    for (const account of expenseAccounts) {
        const balance = account.ledgerEntries.reduce(
            (sum: number, entry: any) => sum + entry.debit - entry.credit,
            0
        );

        if (balance !== 0) {
            closingLines.push({
                accountId: account.id,
                debit: 0,
                credit: balance,
                description: `Closing ${account.name}`,
            });
        }
    }

    // Calculate net income
    const netIncome = closingLines.reduce(
        (sum, line) => sum + line.credit - line.debit,
        0
    );

    // Add retained earnings line
    closingLines.push({
        accountId: retainedEarnings.id,
        debit: netIncome < 0 ? Math.abs(netIncome) : 0,
        credit: netIncome > 0 ? netIncome : 0,
        description: 'Year-end closing - Net Income',
    });

    // Create closing journal entry
    const closingEntry = await prisma.journalEntry.create({
        data: {
            entryNumber,
            date: fiscalYear.endDate,
            description: `Year-end closing for ${fiscalYear.name}`,
            reference: fiscalYear.name,
            status: 'DRAFT',
            createdById: userId,
            lines: {
                create: closingLines,
            },
        },
    });

    // Post closing entry
    await postJournalEntryToLedger(closingEntry.id);

    // Mark fiscal year as closed and locked
    await prisma.fiscalYear.update({
        where: { id: fiscalYearId },
        data: {
            isClosed: true,
            isLocked: true,
        },
    });

    return closingEntry;
};

/**
 * Helper: Get account by code
 */
const getAccountByCode = async (code: string) => {
    return await prisma.account.findUnique({
        where: { code },
    });
};

/**
 * Helper: Generate journal entry number
 */
const generateJournalEntryNumber = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const count = await prisma.journalEntry.count({
        where: {
            entryNumber: {
                startsWith: `JE${year}`,
            },
        },
    });

    return `JE${year}${String(count + 1).padStart(6, '0')}`;
};

/**
 * Helper: Generate next number for entities
 */
export const generateNextNumber = async (
    prefix: string,
    tableName: string,
    fieldName: string
): Promise<string> => {
    const year = new Date().getFullYear();
    const fullPrefix = `${prefix}${year}`;

    // This is a simplified version - in production, use a counter table
    const count = await (prisma as any)[tableName].count({
        where: {
            [fieldName]: {
                startsWith: fullPrefix,
            },
        },
    });

    return `${fullPrefix}${String(count + 1).padStart(6, '0')}`;
};
