import prisma from '../../config/database';

export class ReportsService {
    async getTrialBalance(_startDate?: string, _endDate?: string) {
        // Get all accounts with their balances
        const accounts = await prisma.account.findMany({
            where: { isActive: true },
            include: {
                accountType: true,
            },
            orderBy: { code: 'asc' },
        });

        // Calculate debit and credit balances based on account type
        const accountsWithBalances = accounts.map(account => {
            const balance = account.currentBalance;
            const type = account.accountType.type;

            // Assets and Expenses have debit balances
            // Liabilities, Equity, and Revenue have credit balances
            const isDebitAccount = ['ASSET', 'EXPENSE'].includes(type);

            return {
                id: account.id,
                code: account.code,
                name: account.name,
                type: type,
                debit: isDebitAccount && balance > 0 ? balance : isDebitAccount && balance < 0 ? 0 : 0,
                credit: !isDebitAccount && balance > 0 ? balance : !isDebitAccount && balance < 0 ? 0 : Math.abs(balance),
            };
        });

        const totalDebits = accountsWithBalances.reduce((sum, acc) => sum + acc.debit, 0);
        const totalCredits = accountsWithBalances.reduce((sum, acc) => sum + acc.credit, 0);

        return {
            accounts: accountsWithBalances,
            totalDebits,
            totalCredits,
            isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
        };
    }

    async getProfitAndLoss(startDate: string, endDate: string) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Get revenue accounts
        const revenueAccounts = await prisma.account.findMany({
            where: {
                accountType: { type: 'REVENUE' },
                isActive: true,
            },
            include: {
                ledgerEntries: {
                    where: {
                        date: {
                            gte: start,
                            lte: end,
                        },
                    },
                },
            },
        });

        // Get expense accounts
        const expenseAccounts = await prisma.account.findMany({
            where: {
                accountType: { type: 'EXPENSE' },
                isActive: true,
            },
            include: {
                ledgerEntries: {
                    where: {
                        date: {
                            gte: start,
                            lte: end,
                        },
                    },
                },
            },
        });

        const totalRevenue = revenueAccounts.reduce((sum, acc) => {
            const accTotal = acc.ledgerEntries.reduce((s, entry) => s + entry.credit - entry.debit, 0);
            return sum + accTotal;
        }, 0);

        const totalExpenses = expenseAccounts.reduce((sum, acc) => {
            const accTotal = acc.ledgerEntries.reduce((s, entry) => s + entry.debit - entry.credit, 0);
            return sum + accTotal;
        }, 0);

        return {
            revenue: revenueAccounts.map(acc => ({
                code: acc.code,
                name: acc.name,
                amount: acc.ledgerEntries.reduce((s, entry) => s + entry.credit - entry.debit, 0),
            })),
            expenses: expenseAccounts.map(acc => ({
                code: acc.code,
                name: acc.name,
                amount: acc.ledgerEntries.reduce((s, entry) => s + entry.debit - entry.credit, 0),
            })),
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
        };
    }

    async getBalanceSheet(_asOfDate: string) {

        // Get asset accounts
        const assets = await prisma.account.findMany({
            where: {
                accountType: { type: 'ASSET' },
                isActive: true,
            },
        });

        // Get liability accounts
        const liabilities = await prisma.account.findMany({
            where: {
                accountType: { type: 'LIABILITY' },
                isActive: true,
            },
        });

        // Get equity accounts
        const equity = await prisma.account.findMany({
            where: {
                accountType: { type: 'EQUITY' },
                isActive: true,
            },
        });

        const totalAssets = assets.reduce((sum, acc) => sum + acc.currentBalance, 0);
        const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.currentBalance, 0);
        const totalEquity = equity.reduce((sum, acc) => sum + acc.currentBalance, 0);

        return {
            assets: assets.map(acc => ({ code: acc.code, name: acc.name, amount: acc.currentBalance })),
            liabilities: liabilities.map(acc => ({ code: acc.code, name: acc.name, amount: acc.currentBalance })),
            equity: equity.map(acc => ({ code: acc.code, name: acc.name, amount: acc.currentBalance })),
            totalAssets,
            totalLiabilities,
            totalEquity,
            isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
        };
    }
}
