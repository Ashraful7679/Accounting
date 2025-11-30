import prisma from '../../config/database';

export class PaymentsReceivedRepository {
    async findAll(skip: number = 0, take: number = 50, search?: string) {
        const where = search
            ? {
                OR: [
                    { paymentNumber: { contains: search } },
                    { customer: { name: { contains: search } } },
                ],
            }
            : {};

        const [payments, total] = await Promise.all([
            prisma.paymentReceived.findMany({
                where,
                include: {
                    customer: true,
                    invoice: true,
                    bankAccount: true,
                    createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
                skip,
                take,
                orderBy: { date: 'desc' },
            }),
            prisma.paymentReceived.count({ where }),
        ]);

        return { payments, total };
    }

    async findById(id: string) {
        return await prisma.paymentReceived.findUnique({
            where: { id },
            include: {
                customer: true,
                invoice: true,
                bankAccount: true,
                createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
    }

    async create(data: any) {
        return await prisma.paymentReceived.create({
            data,
            include: {
                customer: true,
                invoice: true,
            },
        });
    }

    async update(id: string, data: any) {
        return await prisma.paymentReceived.update({
            where: { id },
            data,
            include: {
                customer: true,
                invoice: true,
            },
        });
    }

    async delete(id: string) {
        return await prisma.paymentReceived.delete({
            where: { id },
        });
    }

    async getNextNumber() {
        const lastPayment = await prisma.paymentReceived.findFirst({
            orderBy: { paymentNumber: 'desc' },
        });

        if (!lastPayment) {
            return 'PMT-0001';
        }

        const lastNumber = parseInt(lastPayment.paymentNumber.split('-')[1]);
        const nextNumber = lastNumber + 1;
        return `PMT-${nextNumber.toString().padStart(4, '0')}`;
    }
}
