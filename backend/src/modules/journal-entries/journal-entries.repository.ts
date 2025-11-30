import prisma from '../../config/database';

export class JournalEntriesRepository {
    async findAll(skip: number = 0, take: number = 50, search?: string) {
        const where = search
            ? {
                OR: [
                    { entryNumber: { contains: search } },
                    { description: { contains: search } },
                ],
            }
            : {};

        const [entries, total] = await Promise.all([
            prisma.journalEntry.findMany({
                where,
                include: {
                    lines: {
                        include: {
                            account: true,
                        },
                    },
                    createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
                skip,
                take,
                orderBy: { date: 'desc' },
            }),
            prisma.journalEntry.count({ where }),
        ]);

        return { entries, total };
    }

    async findById(id: string) {
        return await prisma.journalEntry.findUnique({
            where: { id },
            include: {
                lines: {
                    include: {
                        account: true,
                    },
                },
                createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
    }

    async create(data: any) {
        const { lines, ...entryData } = data;

        return await prisma.journalEntry.create({
            data: {
                ...entryData,
                date: new Date(entryData.date),
                lines: {
                    create: lines.map((line: any) => ({
                        accountId: line.accountId,
                        description: line.description || '',
                        debit: line.debit || 0,
                        credit: line.credit || 0,
                    })),
                },
            },
            include: {
                lines: {
                    include: {
                        account: true,
                    },
                },
            },
        });
    }

    async update(id: string, data: any) {
        return await prisma.journalEntry.update({
            where: { id },
            data,
            include: {
                lines: {
                    include: {
                        account: true,
                    },
                },
            },
        });
    }

    async delete(id: string) {
        return await prisma.journalEntry.delete({
            where: { id },
        });
    }

    async getNextNumber() {
        const lastEntry = await prisma.journalEntry.findFirst({
            orderBy: { entryNumber: 'desc' },
        });

        if (!lastEntry) {
            return 'JE-0001';
        }

        const lastNumber = parseInt(lastEntry.entryNumber.split('-')[1]);
        const nextNumber = lastNumber + 1;
        return `JE-${nextNumber.toString().padStart(4, '0')}`;
    }
}
