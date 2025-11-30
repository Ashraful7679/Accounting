import prisma from '../../config/database';

// Define InvoiceStatus enum since SQLite doesn't support native Prisma enums
export enum InvoiceStatus {
    DRAFT = 'DRAFT',
    VERIFIED = 'VERIFIED',
    APPROVED = 'APPROVED',
    PAID = 'PAID',
    PARTIALLY_PAID = 'PARTIALLY_PAID',
    CANCELLED = 'CANCELLED'
}

export class InvoicesRepository {
    async findAll(
        skip: number,
        take: number,
        filters?: {
            customerId?: string;
            status?: InvoiceStatus;
            dateFrom?: Date;
            dateTo?: Date;
        }
    ) {
        const where: any = {};

        if (filters?.customerId) where.customerId = filters.customerId;
        if (filters?.status) where.status = filters.status;
        if (filters?.dateFrom || filters?.dateTo) {
            where.date = {};
            if (filters.dateFrom) where.date.gte = filters.dateFrom;
            if (filters.dateTo) where.date.lte = filters.dateTo;
        }

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                include: {
                    customer: true,
                    items: {
                        include: {
                            product: true,
                            taxCode: true,
                        },
                    },
                    payments: true,
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
                skip,
                take,
                orderBy: { date: 'desc' },
            }),
            prisma.invoice.count({ where }),
        ]);

        return { invoices, total };
    }

    async findById(id: string) {
        return await prisma.invoice.findUnique({
            where: { id },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true,
                        taxCode: true,
                    },
                },
                payments: true,
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

    async create(data: any) {
        // Service already wraps items in {create: [...]} format
        return await prisma.invoice.create({
            data: {
                ...data,
                date: new Date(data.date),
                dueDate: new Date(data.dueDate),
            },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    }

    async update(id: string, data: any) {
        return await prisma.invoice.update({
            where: { id },
            data,
            include: {
                customer: true,
                items: true,
            },
        });
    }

    async delete(id: string) {
        return await prisma.invoice.delete({
            where: { id },
        });
    }

    async updateStatus(id: string, status: InvoiceStatus) {
        return await prisma.invoice.update({
            where: { id },
            data: { status },
        });
    }

    async verifyInvoice(id: string, verifiedById: string) {
        return await prisma.invoice.update({
            where: { id },
            data: {
                status: InvoiceStatus.VERIFIED,
                verifiedById,
                verifiedAt: new Date(),
            },
        });
    }

    async approveInvoice(id: string, approvedById: string) {
        return await prisma.invoice.update({
            where: { id },
            data: {
                status: InvoiceStatus.APPROVED,
                approvedById,
                approvedAt: new Date(),
            },
        });
    }

    async rejectInvoice(id: string) {
        return await prisma.invoice.update({
            where: { id },
            data: {
                status: InvoiceStatus.DRAFT,
                verifiedById: null,
                verifiedAt: null,
                approvedById: null,
                approvedAt: null,
            },
        });
    }
}
