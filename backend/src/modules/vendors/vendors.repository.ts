import prisma from '../../config/database';

export class VendorsRepository {
    async findAll(skip: number = 0, take: number = 50, search?: string) {
        const where = search
            ? {
                OR: [
                    { code: { contains: search } },
                    { name: { contains: search } },
                    { email: { contains: search } },
                ],
            }
            : {};

        const [vendors, total] = await Promise.all([
            prisma.vendor.findMany({
                where,
                skip,
                take,
                orderBy: { code: 'asc' },
            }),
            prisma.vendor.count({ where }),
        ]);

        return { vendors, total };
    }

    async findById(id: string) {
        return await prisma.vendor.findUnique({
            where: { id },
            include: {
                bills: {
                    take: 10,
                    orderBy: { date: 'desc' },
                },
                paymentsMade: {
                    take: 10,
                    orderBy: { date: 'desc' },
                },
            },
        });
    }

    async findByCode(code: string) {
        return await prisma.vendor.findUnique({
            where: { code },
        });
    }

    async create(data: any) {
        return await prisma.vendor.create({
            data,
        });
    }

    async update(id: string, data: any) {
        return await prisma.vendor.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        return await prisma.vendor.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async getNextCode() {
        const lastVendor = await prisma.vendor.findFirst({
            orderBy: { code: 'desc' },
        });

        if (!lastVendor) {
            return 'VEND-0001';
        }

        const lastNumber = parseInt(lastVendor.code.split('-')[1]);
        const nextNumber = lastNumber + 1;
        return `VEND-${nextNumber.toString().padStart(4, '0')}`;
    }
}
