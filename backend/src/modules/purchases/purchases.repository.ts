import prisma from '../../config/database';

export class PurchasesRepository {
    async create(data: any) {
        return await prisma.bill.create({
            data: {
                ...data,
                items: {
                    create: data.items,
                },
            },
            include: {
                vendor: true,
                items: true,
                createdBy: true,
            },
        });
    }

    async findAll(filters: any = {}) {
        const { search, status, limit = 50, offset = 0 } = filters;

        const where: any = {};

        if (search) {
            where.OR = [
                { billNumber: { contains: search } },
                { vendor: { name: { contains: search } } },
                { reference: { contains: search } },
            ];
        }

        if (status) {
            where.status = status;
        }

        const [bills, total] = await Promise.all([
            prisma.bill.findMany({
                where,
                include: {
                    vendor: true,
                    items: true,
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.bill.count({ where }),
        ]);

        return { bills, total };
    }

    async findById(id: string) {
        return await prisma.bill.findUnique({
            where: { id },
            include: {
                vendor: true,
                items: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }

    async update(id: string, data: any) {
        return await prisma.bill.update({
            where: { id },
            data,
            include: {
                vendor: true,
                items: true,
            },
        });
    }

    async delete(id: string) {
        return await prisma.bill.delete({
            where: { id },
        });
    }

    async updateStatus(id: string, status: string) {
        return await prisma.bill.update({
            where: { id },
            data: { status },
        });
    }
}
