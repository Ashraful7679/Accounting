import prisma from '../../config/database';

export class ProductsRepository {
    async findAll(skip: number = 0, take: number = 50, search?: string) {
        const where = search
            ? {
                OR: [
                    { code: { contains: search } },
                    { name: { contains: search } },
                    { category: { contains: search } },
                ],
            }
            : {};

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    taxCode: true,
                    stockItem: true,
                },
                skip,
                take,
                orderBy: { code: 'asc' },
            }),
            prisma.product.count({ where }),
        ]);

        return { products, total };
    }

    async findById(id: string) {
        return await prisma.product.findUnique({
            where: { id },
            include: {
                taxCode: true,
                stockItem: true,
                invoiceItems: {
                    take: 10,
                    orderBy: { invoice: { date: 'desc' } },
                    include: { invoice: true },
                },
            },
        });
    }

    async findByCode(code: string) {
        return await prisma.product.findUnique({
            where: { code },
        });
    }

    async create(data: any) {
        return await prisma.product.create({
            data,
            include: {
                taxCode: true,
            },
        });
    }

    async update(id: string, data: any) {
        return await prisma.product.update({
            where: { id },
            data,
            include: {
                taxCode: true,
            },
        });
    }

    async delete(id: string) {
        return await prisma.product.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async getNextCode() {
        const lastProduct = await prisma.product.findFirst({
            orderBy: { code: 'desc' },
        });

        if (!lastProduct) {
            return 'PROD-0001';
        }

        const lastNumber = parseInt(lastProduct.code.split('-')[1]);
        const nextNumber = lastNumber + 1;
        return `PROD-${nextNumber.toString().padStart(4, '0')}`;
    }
}
