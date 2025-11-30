import prisma from '../../config/database';

export class DashboardService {
    async getDashboardStats() {
        // Get total revenue from revenue accounts
        const revenueAccounts = await prisma.account.findMany({
            where: {
                accountType: {
                    type: 'REVENUE',
                },
                isActive: true,
            },
        });

        const totalRevenue = Math.abs(revenueAccounts.reduce(
            (sum, account) => sum + account.currentBalance,
            0
        ));

        // Get total expenses from expense accounts
        const expenseAccounts = await prisma.account.findMany({
            where: {
                accountType: {
                    type: 'EXPENSE',
                },
                isActive: true,
            },
        });

        const totalExpenses = Math.abs(expenseAccounts.reduce(
            (sum, account) => sum + account.currentBalance,
            0
        ));

        // Get invoice stats
        const invoiceStats = await prisma.invoice.aggregate({
            _sum: {
                total: true,
                paidAmount: true,
            },
            _count: {
                id: true,
            },
        });

        // Get pending invoices count
        const pendingInvoices = await prisma.invoice.count({
            where: {
                status: {
                    in: ['DRAFT', 'SENT', 'PARTIALLY_PAID'],
                },
            },
        });

        // Get active customers count
        const activeCustomers = await prisma.customer.count({
            where: {
                isActive: true,
            },
        });

        // Get recent activity (last 10 transactions)
        const recentInvoices = await prisma.invoice.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                customer: true,
            },
        });

        const recentPayments = await prisma.paymentReceived.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                customer: true,
            },
        });

        // Combine and sort recent activity
        const recentActivity = [
            ...recentInvoices.map((inv) => ({
                id: inv.id,
                type: 'Invoice',
                description: `${inv.invoiceNumber} - ${inv.customer.name}`,
                amount: inv.total,
                time: inv.createdAt,
                status: inv.status,
            })),
            ...recentPayments.map((pmt) => ({
                id: pmt.id,
                type: 'Payment',
                description: `${pmt.paymentNumber} - ${pmt.customer.name}`,
                amount: pmt.amount,
                time: pmt.createdAt,
                status: 'RECEIVED',
            })),
        ]
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .slice(0, 10);

        return {
            totalRevenue: totalRevenue,
            totalInvoices: invoiceStats._count.id || 0,
            totalExpenses: totalExpenses,
            activeCustomers: activeCustomers,
            pendingInvoices: pendingInvoices,
            recentActivity,
        };
    }

    async getRevenueExpenseChart(months: number = 6) {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        // Get revenue by month
        const invoices = await prisma.invoice.findMany({
            where: {
                date: {
                    gte: startDate,
                },
                status: {
                    in: ['PAID', 'PARTIALLY_PAID'],
                },
            },
            select: {
                date: true,
                paidAmount: true,
            },
        });

        // Get expenses by month
        const ledgerEntries = await prisma.ledger.findMany({
            where: {
                date: {
                    gte: startDate,
                },
                account: {
                    accountType: {
                        type: 'EXPENSE',
                    },
                },
            },
            select: {
                date: true,
                debit: true,
            },
        });

        // Group by month
        const monthlyData: { [key: string]: { revenue: number; expenses: number } } = {};

        invoices.forEach((inv) => {
            const monthKey = inv.date.toISOString().substring(0, 7); // YYYY-MM
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { revenue: 0, expenses: 0 };
            }
            monthlyData[monthKey].revenue += inv.paidAmount;
        });

        ledgerEntries.forEach((entry) => {
            const monthKey = entry.date.toISOString().substring(0, 7);
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { revenue: 0, expenses: 0 };
            }
            monthlyData[monthKey].expenses += entry.debit;
        });

        return Object.entries(monthlyData)
            .map(([month, data]) => ({
                month,
                revenue: data.revenue,
                expenses: data.expenses,
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }
}
