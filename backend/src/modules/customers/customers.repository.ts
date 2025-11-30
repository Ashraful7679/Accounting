import prisma from '../../config/database';

export class CustomersRepository {
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

        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where,
                skip,
                take,
                orderBy: { code: 'asc' },
            }),
            prisma.customer.count({ where }),
        ]);

        return { customers, total };
    }

    async findById(id: string) {
        return await prisma.customer.findUnique({
            where: { id },
            include: {
                invoices: {
                    take: 10,
                    orderBy: { date: 'desc' },
                },
                paymentsReceived: {
                    take: 10,
                    orderBy: { date: 'desc' },
                },
            },
        });
    }

    async findByCode(code: string) {
        return await prisma.customer.findUnique({
            where: { code },
        });
    }

    async create(data: any) {
        return await prisma.customer.create({
            data,
        });
    }

    async update(id: string, data: any) {
        return await prisma.customer.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        return await prisma.customer.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async getNextCode() {
        const lastCustomer = await prisma.customer.findFirst({
            orderBy: { code: 'desc' },
        });

        if (!lastCustomer) {
            return 'CUST-0001';
        }

        const lastNumber = parseInt(lastCustomer.code.split('-')[1]);
        const nextNumber = lastNumber + 1;
        return `CUST-${nextNumber.toString().padStart(4, '0')}`;
    }
}
