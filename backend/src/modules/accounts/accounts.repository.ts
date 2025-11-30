import prisma from '../../config/database';

export class AccountsRepository {
    async findAll(skip: number = 0, take: number = 50, search?: string) {
        const where = search
            ? {
                OR: [
                    { code: { contains: search } },
                    { name: { contains: search } },
                ],
            }
            : {};

        const [accounts, total] = await Promise.all([
            prisma.account.findMany({
                where,
                include: {
                    accountType: true,
                    parent: true,
                },
                skip,
                take,
                orderBy: { code: 'asc' },
            }),
            prisma.account.count({ where }),
        ]);

        return { accounts, total };
    }

    async findById(id: string) {
        return await prisma.account.findUnique({
            where: { id },
            include: {
                accountType: true,
                parent: true,
                children: true,
            },
        });
    }

    async findByCode(code: string) {
        return await prisma.account.findUnique({
            where: { code },
        });
    }

    async create(data: any) {
        return await prisma.account.create({
            data,
            include: {
                accountType: true,
            },
        });
    }

    async update(id: string, data: any) {
        return await prisma.account.update({
            where: { id },
            data,
            include: {
                accountType: true,
            },
        });
    }

    async delete(id: string) {
        return await prisma.account.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async getAccountTree() {
        const accounts = await prisma.account.findMany({
            where: { isActive: true },
            include: {
                accountType: true,
                children: true,
            },
            orderBy: { code: 'asc' },
        });

        // Build tree structure
        const rootAccounts = accounts.filter(acc => !acc.parentId);
        return rootAccounts;
    }

    async getAccountTypes() {
        return await prisma.accountType.findMany({
            orderBy: { type: 'asc' },
        });
    }
}
