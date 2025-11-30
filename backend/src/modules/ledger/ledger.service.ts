import prisma from '../../config/database';

export class LedgerRepository {
    async findByAccount(accountId: string, startDate?: Date, endDate?: Date) {
        const where: any = { accountId };

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = startDate;
            if (endDate) where.date.lte = endDate;
        }

        return await prisma.ledger.findMany({
            where,
            include: {
                account: true,
            },
            orderBy: { date: 'asc' },
        });
    }

    async findAll(skip: number = 0, take: number = 100, accountId?: string, startDate?: Date, endDate?: Date) {
        const where: any = {};

        if (accountId) where.accountId = accountId;

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = startDate;
            if (endDate) where.date.lte = endDate;
        }

        const [entries, total] = await Promise.all([
            prisma.ledger.findMany({
                where,
                include: {
                    account: true,
                },
                skip,
                take,
                orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
            }),
            prisma.ledger.count({ where }),
        ]);

        return { entries, total };
    }
}

export class LedgerService {
    private repository: LedgerRepository;

    constructor() {
        this.repository = new LedgerRepository();
    }

    async getLedgerEntries(
        page: number = 1,
        limit: number = 100,
        accountId?: string,
        startDate?: string,
        endDate?: string,
        search?: string
    ) {
        const skip = (page - 1) * limit;
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;

        const { entries, total } = await this.repository.findAll(skip, limit, accountId, start, end);

        // Calculate running balance for each account
        const accountBalances = new Map<string, number>();

        const entriesWithBalance = entries.map(entry => {
            const currentBalance = accountBalances.get(entry.accountId) || 0;
            const newBalance = currentBalance + (entry.debit - entry.credit);
            accountBalances.set(entry.accountId, newBalance);

            return {
                ...entry,
                balance: newBalance,
            };
        });

        // Filter by search term if provided
        const filteredEntries = search
            ? entriesWithBalance.filter(entry =>
                entry.description?.toLowerCase().includes(search.toLowerCase()) ||
                entry.account?.name?.toLowerCase().includes(search.toLowerCase()) ||
                entry.reference?.toLowerCase().includes(search.toLowerCase())
            )
            : entriesWithBalance;

        return {
            entries: filteredEntries,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getAccountLedger(accountId: string, startDate?: string, endDate?: string) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;

        const entries = await this.repository.findByAccount(accountId, start, end);

        // Calculate running balance
        let runningBalance = 0;
        const entriesWithBalance = entries.map(entry => {
            runningBalance += (entry.debit - entry.credit);
            return {
                ...entry,
                balance: runningBalance,
            };
        });

        return entriesWithBalance;
    }
}
